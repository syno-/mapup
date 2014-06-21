
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var fs = require('fs');
//var http = require('http');
var https = require('https');
var path = require('path');
var mod = {
    image: require('./image.upload'),
};
var crypto = require('crypto');

require('colors');

var app = module.exports = express();

// all environments
app.set('port', process.env.PORT || 8000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.multipart());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.bodyParser({
    keepExtensions: true,
    uploadDir: mod.image.uploadDir
}));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/room', function(req, res) {
    res.render('meetup', {
        title: 'meetup',
    });
});
/**
 * タグ一覧の取得API
 */
app.get('/tags', function(req, res) {
    var clients = getClients(io.sockets.sockets);

    res.end(JSON.stringify(clients));
});
app.post('/image', function(req, res) {
    mod.image.upload.apply(this, arguments);
});
app.get('/image', function(req, res) {
    mod.image.receive.apply(this, arguments);
});

//var server = http.createServer(app);
var server = https.createServer({
    key: fs.readFileSync('./certs/secret-key.pem'),
    cert: fs.readFileSync('./certs/server.cert'),
    passphrase: '8c9bf1b4e1fb72f0d341f101f496813d21a21773',
}, app);
server.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

require('./show-addrs').show(app.get('port'));

var socketIO = require('socket.io');
var io = module.exports = socketIO.listen(server);
var signalmaster = require('./signalmaster');

/**
 * クライアントのデータ一覧を取得
 */
function getClients(roomClients) {
    var r = [];
    if (roomClients) {
        for (var socketId in roomClients) {
            if (roomClients.hasOwnProperty(socketId)) {
                var client = roomClients[socketId];
                console.log('client, data=', client.store.data);
                var data;
                if (client.store.data) {
                    data = client.store.data;
                } else {
                    data = {};
                }
                data.socketId = socketId;
                r.push(data);
            }
        }
    }

    return r;
}

io.sockets.on('connection', function(socket) {
    console.log('connection, id=', socket.id);
    //console.log('connection, sockets=', io.sockets.sockets);
    signalmaster.connection.apply(this, arguments);

    var clients = getClients(io.sockets.sockets);
    socket.emit('user.list', clients);

    socket.on('disconnect', function() {
        console.log('user.disconnect', arguments);
        io.sockets.emit('user.disconnect', {
            id: socket.id
        });
    });

    /**
     *
     * @param {Object} 
     * username: {String}
     * marker {
     *   lat: {Float}
     *   lng: {Float}
     * }
     */
    socket.on('user.connect', function(userdata) {
        console.log('on user.connect, userdata=', userdata);

        setData(userdata, function() {
            console.log('emit user.connect');
            io.sockets.emit('user.connect', userdata);
        });
    });
    socket.on('user.update', function(userdata) {
        console.log('on user.update', userdata);

        setData(userdata, function() {
            console.log('emit user.update');
            io.sockets.emit('user.update', {
                socketId: socket.id,
                marker: userdata.marker,
                username: userdata.username,
                imageName: userdata.imageName,
                tags: userdata.tags,
                roomId: userdata.roomId,
            });
        });
    });
    socket.on('user.chat', function(userdata) {
        console.log('user.chat', userdata);
        var from = userdata.from;
        var to = userdata.to;

        var base = {
            to: {
                text: to.text,
            },
            from: {
                socketId: from.socketId,
                username: from.username,
            },
        };
        if (to.socketId) {
            base.to.socketId = to.socketId;
            io.sockets.socket(to.socketId).emit('user.chat', base);
        } else {
            io.sockets.emit('user.chat', base);
        }
    });
    socket.on('user.invite', function(invite) {
        console.log('user.invite', invite);
        var from = invite.from;
        var to = invite.to;

        // roomIdの生成
        if (!invite.roomId) {
            invite.roomId = createRoomId(from, to);
        }

        io.sockets.socket(to.socketId).emit('user.invite', invite);
    });
    socket.on('user.invited', function(invite) {
        console.log('user.invited', invite);
        var to = invite.to;
        var from = invite.from;

        io.sockets.socket(to.socketId).emit('user.invited', invite);
    });

    function createRoomId(from, to) {
        var base = from.socketId + ':' +
            to.socketId + ':' +
            Date.now() +
            ':mapup'; // salt

        console.log('createRoomId, base=', base);
        var sha1sum = crypto.createHash('sha1');
        sha1sum.update(base);

        var shasum = sha1sum.digest('hex');
        console.log('createRoomId, shasum=', shasum);

        return shasum;
    }

    function setData(userdata, cb) {
        var list = ['username', 'marker', 'tags', 'imageName', 'roomId'];
        var progress = 0;
        var maxProgress = list.length;
        list.forEach(function(prop, i) {
            if (userdata[prop] !== undefined) {
                console.log('setData, prop=', prop);
                socket.set(prop, userdata[prop], function () {
                    console.log('setData, set');
                    progress++;
                    if (maxProgress === progress) {
                        cb();
                    }
                });
            } else {
                console.log('setData, undefined prop=', prop);
                progress++;
                if (maxProgress === progress) {
                    cb();
                }
            }
        });
    }

});

