
var os = require('os');

/**
 * http://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
 */
exports.show = function(port) {
    var addrs = (function() {
        var addrs = [];
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            var alias = 0;
            ifaces[dev].forEach(function(details){
                if (details.family === 'IPv4') {
                    addrs.push({
                        name: dev + (alias ? ':' + alias : ''),
                        addr: details.address
                    });
                    //console.log(dev + (alias ? ':' + alias : ''), details.address);
                    ++alias;
                }
            });
        }

        return addrs;
    })();

    console.log('Start Server:'.red);
    addrs.forEach(function(o, i) {
        console.log('    http://' + o.addr + ':' + port);
    });
};

