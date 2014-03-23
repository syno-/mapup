
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
        init: function(userdata) {
            Object.defineProperties(this, {
                "username": {
                    value: null,
                    writable: true
                },
                "socketId": {
                    value: null,
                    writable: true
                },
                "marker": {
                    value: {},
                    writable: false
                },
                "infoWindow": {
                    value: null,
                    writable: true
                },
                "private": {
                    value: false,
                    writable: true
                },
            });
            Object.defineProperties(this.marker, {
                "lat": {
                    value: 0.0,
                    writable: true
                },
                "lng": {
                    value: 0.0,
                    writable: true
                },
                "ref": {
                    value: null,
                    writable: true
                },
            });

            if (userdata.username) {
                this.username = userdata.username;
            }
            if (userdata.socketId) {
                this.socketId = userdata.socketId;
            }
            if (typeof userdata.private !== 'undefined') {
                this.private = userdata.private;
            }
            if (userdata.marker) {
                this.marker.lat = userdata.marker.lat;
                this.marker.lng = userdata.marker.lng;
            }
        },
        toUserdata: function() {
            return {
                'username': this.username,
                'socketId': this.socketId,
                'marker': {
                    'lat': this.marker.lat,
                    'lng': this.marker.lng,
                },
            };
        },
    });

    return User;
})();
