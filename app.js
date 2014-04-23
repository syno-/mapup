
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
require('colors');

var app = express();

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/tags', function(req, res) {
    var clients = getClients(io.sockets.sockets);

    res.end(JSON.stringify(clients));
});

var server = http.createServer(app);
server.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

require('./show-addrs').show(app.get('port'));

var socketIO = require('socket.io');
var io = socketIO.listen(server);

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

    var clients = getClients(io.sockets.sockets);
    socket.emit('user.list', clients);

    socket.on('disconnect', function() {
        console.log('user.disconnect');
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
        console.log('user.connect, latlng=', userdata.marker);

        setData(userdata, function() {
            io.sockets.emit('user.connect', userdata);
        });
    });
    socket.on('user.update', function(userdata) {
        console.log('user.update');

        setData(userdata, function() {
            io.sockets.emit('user.update', {
                socketId: socket.id,
                marker: userdata.marker,
                username: userdata.username,
                tags: userdata.tags,
            });
        });
    });

    function setData(userdata, cb) {
        socket.set('username', userdata.username, function () {
            socket.set('marker', userdata.marker, function () {
                socket.set('tags', userdata.tags, function () {
                    cb();
                });
            });
        });
    }

});

