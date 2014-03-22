
/**
 *
 * Usage: 
 *
 */
Mps.User = (function() {
    "use strict";

    /**
     * Queue (FIFO)
     */
    var User = Class.extend({
        init: function() {
            Object.defineProperties(this, {
                "username": {
                    value: null,
                    writable: true
                },
                "socketId": {
                    value: null,
                    writable: true
                },
                "latlng": {
                    value: null,
                    writable: true
                },
                "marker": {
                    value: null,
                    writable: true
                },
            });
        },
        toUserdata: function() {
            return {
                'username': this.username,
                'socketId': this.socketId,
                'lat': this.lat,
                'lng': this.lng,
            };
        },
    });

    return User;
})();
