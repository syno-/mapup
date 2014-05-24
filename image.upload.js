var extend = require('node.extend');
var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var uploadDir = exports.uploadDir = path.join(__dirname, '/files');

// ---------------------
var ResJson = function() {
    this.init.apply(this, arguments);
};
extend(ResJson.prototype, {
    init: function(res) {
        this._res = res;
    },
    ok: function(val) {
        this._out(val, 200);
    },
    err: function(msg, code) {
        var val = {
            code: code,
            message: msg,
        };
        val.code = (code) ? code : 500;
        if (msg) {
            val.message = msg;
        }

        this._out(val, val.code);
    },
    _out: function(val, code) {
        var s = JSON.stringify(val);
        this._res.set({
            'Content-Type': 'application/json',
        });
        this._res.status(code);
        this._res.end(s);
    },
    toString: function() {
        return this.str.apply(this._val);
    }
});

var json = function(res) {
    return new ResJson(res);
};

// ---------------------
function createSHA1(text) {
    var sha1sum = crypto.createHash('sha1');
    sha1sum.update(text);
    var hex = sha1sum.digest('hex');
    return hex;
}
exports.upload = function(req, res) {
    if (!req.files || !req.files.image) {
        console.log('req.files:', req.files);
        json(res).err('Image not found.', 400);
        return;
    }
    var image = req.files.image;
    console.log('image:', image);
    mkdirp(uploadDir, function(err) {
        if (err) {
            console.log('readFile', err);
            json(res).err(String(err), 500);
            return;
        }

        fs.readFile(image.path, function (err, data) {
            if (err) {
                console.log('readFile', err);
                json(res).err(String(err), 500);
                return;
            }
            var ext = path.extname(image.originalFilename);
            var newFileName = createSHA1(Date.now() + image.originalFilename) + ext;
            var newFilePath = uploadDir + '/' + newFileName;
            fs.writeFile(newFilePath, data, function (err) {
                if (err) {
                    console.log('writeFile', err);
                    json(res).err(String(err), 500);
                    return;
                }

                json(res).ok({
                    name: newFileName,
                    originalFilename: image.originalFilename,
                });
            });
        });
    });
};
exports.receive = function(req, res) {
    console.log('req.query=', req.query);

    var filename = req.query.filename;
    if (!filename) {
        res.send(404, 'No found filename.');
        return;
    }
    var filePath = uploadDir + '/' + filename;
    res.attachment(filePath);
    res.sendfile(filePath, function(err) {
        if (err) {
            console.log(err);
            res.send(403, 'Image not found.');
            return;
        }
    });
};


