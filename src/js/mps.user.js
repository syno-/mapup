
/**
 *
 * Usage: 
 *
 */
Mps.User = (function() {
    "use strict";

    var EventObserver = Class.extend({
        _events: null,

        emit: function(eventName, args) {
            // collect
            var fireEventName;
            var fireEvents = [];
            var e;
            for (var i = 0, iL = this._events.length; i < iL; i++) {
                e = this._events[i];
                if (e.name === eventName) {
                    fireEventName = eventName;
                    fireEvents.push(e);
                }
            }

            // fire
            if (fireEvents.length > 0) {
                var newArgs = this._fireHooks(fireEventName, args); // 複数回実行されてしまう
                for (var j = 0, jL = fireEvents.length; j < jL; j++) {
                    e = fireEvents[j];
                    //console.trace();
                    //Quiks.log('event fired:', fireEventName, newArgs);
                    e.func.apply(this, newArgs);
                }
            }
        },
        _fireHooks: function(eventName, args) {
            return args;
        },
        /**
         * @param {String} name event name
         * @param {Function} func event callback
         */
        on: function(name, func) {
            this._events.push({
                name: name,
                func: func
            });

            return this;
        },
        off: function(name, func) {
            this._events = this._events.filter(function(event, i) {
                if (event.func === func) {
                    return false;
                }
                if (event.name === name) {
                    return false;
                }
                return true;
            });

            return this;
        },
        init: function() {
            this._events = [];
            this._tags = [];
        }
    }); 

    /**
     * Queue (FIFO)
     */
    var User = EventObserver.extend({
        init: function(userdata) {
            this._super.apply(this, arguments);
            var self = this;
            self._latlng = null;
            self._marker = null;
            self._private = false;
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
                    set: function(newValue) {
                        self._private = newValue;
                        if (this.marker.ref) {
                            this.marker.ref.setDraggable(newValue);
                        }
                    },
                    get: function() {
                        return self._private;
                    }
                },
            });
            Object.defineProperties(this.marker, {
                "latlng": {
                    set: function(newValue) {
                        self._latlng = newValue;
                        if (this.ref) {
                            if (newValue) {
                                this.ref.setPosition(new google.maps.LatLng(newValue.lat, newValue.lng));
                            } else {
                                this.ref.setPosition(null);
                            }
                        }
                    },
                    get: function() {
                        return self._latlng;
                    }
                },
                "ref": {
                    set: function(newValue) {
                        self._marker = newValue;
                    },
                    get: function() {
                        return self._marker;
                    }
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

            this._marker = User.createMarker(this);
            if (userdata.map) {
                this._marker.setMap(userdata.map);
            }
            if (userdata.marker) {
                this.marker.latlng = userdata.marker;
            }
        },
        toUserdata: function() {
            return {
                'username': this.username,
                'socketId': this.socketId,
                'marker': this.marker.latlng,
            };
        },
    });

    /**
     *
     */
    User.createMarker = function(user) {
        var self = this;

        var options = {};
        if (user.latlng) {
            options.position = new google.maps.LatLng(user.latlng.lat, user.latlng.lng);
        }
        if (typeof user.private !== 'undefined') {
            options.draggable = user.private;
        }
        //map: this._map,
        //title: 'Click to zoom'
        var marker = new google.maps.Marker(options);

        google.maps.event.addListener(marker, 'click', function(e) {
            user.emit('marker.click', arguments);
        });
        google.maps.event.addListener(marker, 'dragend', function(e) {
            user.emit('marker.dragend', arguments);
        });

        return marker;
    };

    return User;
})();
