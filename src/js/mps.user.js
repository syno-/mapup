
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
    var User = Mps.EventObserver.extend({
        init: function(userdata) {
            this._super.apply(this, arguments);
            this._tags = [];
            this._username = null;
            this._imageName = null;
            var self = this;
            self._latlng = null;
            self._marker = null;
            self._private = false;
            Object.defineProperties(this, {
                "username": {
                    set: function(newValue) {
                        self._username = newValue;
                        self.emit('username.changed', [newValue]);
                    },
                    get: function() {
                        return self._username;
                    }
                },
                "tags": {
                    set: function(newValue) {
                        self._tags = newValue;
                        self.emit('tags.init', [newValue]);
                    },
                    get: function() {
                        return self._tags;
                    }
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
                /**
                 * 自分自身かどうか。
                 * ドラッグの判定や、地図のピンの色へ影響。
                 */
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
                "imageName": {
                    set: function(newValue) {
                        self._imageName = newValue;
                        self.setIcon(newValue);
                    },
                    get: function() {
                        return self._imageName;
                    }
                },
            });
            Object.defineProperties(this.marker, {
                "latlng": {
                    set: function(newValue) {
                        self._latlng = newValue;
                        if (newValue) {
                            self._marker.setPosition(new google.maps.LatLng(newValue.lat, newValue.lng));
                        } else {
                            self._marker.setPosition(null);
                        }
                    },
                    get: function() {
                        return self._latlng;
                    }
                },
                "isVisible":{
                    set: function(newValue) {
                        self._marker.setVisible(newValue);
                    },
                    get: function() {
                        return self._marker.getVisible();
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
            if (userdata.tags) {
                this._tags = userdata.tags;
            }
            if (userdata.imageName) {
                this.imageName = userdata.imageName;
            }
        },
        setIcon: function(imageName) {
            this._imageName = imageName;
            var self = this;
            if (self._marker) {
                var m = self._marker;
                var url = this.getImageUrl();
                Mps.log('pin url=', url);
                m.setIcon({
                    size: new google.maps.Size(64, 48),
                    // http://localhost/image?filename=<hash>.jpg
                    url: url
                });
            }
        },
        getImageUrl: function() {
            var url = location.origin + '/image?filename=' + this._imageName;
            return url;
        },
        destroy: function() {
            var marker = this._marker;
            if (marker) {
                marker.setMap(null);
            }
            if (this.infoWindow) {
                this.infoWindow.close();
            }
            Mps.log('user destroy:', this.toUserdata());
        },
        save: function() {
            var json = JSON.stringify({
                username: this.username,
                marker: {
                    latlng: this.marker.latlng,
                },
                imageName: this._imageName,
                tags: this._tags,
            });
            localStorage.setItem('mps.user.myself', json);
            Mps.log('Saved myself: json=', json);
        },
        displayUsername: function() {
            var name;
            if (this.username) {
                name = this.username;
            } else {
                name = this.socketId;
            }
            return name;
        },
        toUserdata: function() {
            return {
                'username': this.username,
                'socketId': this.socketId,
                'marker': this.marker.latlng,
                'imageName': this._imageName,
                'tags': this._tags,
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

    /**
     *
     */
    User.loadMyself = function() {
        var item = null;
        try {
            item = JSON.parse(localStorage.getItem('mps.user.myself'));
        } catch (e) {
            Mps.log('Illegal userdata', e);
            localStorage.removeItem('mps.user.myself');
        }
        return item;
    };

    return User;
})();
