
/**
 *
 */
Mps.prototype.init = function() {

    // init maps
    this.r = {
        $map: $('#map'),
        $menu: $('#menu'),
        $menuContents: $('#menu-contents'),
        $btnFold: $('#btn-fold'),
        $socketDisconnect: $('#socket-disconnect'),
        $formUsername: $('#form-username'),
        //$log: $('#log'),
        log: new Mps.Log('log', {
            limit: 100
        }),
        spin: Mps.Dialog('spin')
    };
    if (Mps.DEBUG) {
        window.r = this.r;
    }

    /**
     * ユーザの一覧
     */
    this._users = [];

    this.initMaps();
    this.initSocketio();
    this.initFinished();
};

Mps.prototype.initMaps = function() {
    this._map = new google.maps.Map(this.r.$map[0], {
        // Osaka
        center: new google.maps.LatLng(34.701909, 135.494977),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
};

Mps.prototype.initSocketio = function() {
    Mps.log('socketio');

    this._socket = io.connect(location.protocol + '//' + location.host + '/');
};

Mps.prototype.initFinished = function() {
    var self = this;
    var _socket = this._socket;

    // init my location
    //self.r.spin.show();
    //Mps.Geo.current().done(function(pos) {
    //    Mps.log('detected: ', pos);
    //    this.setMyself({
    //        lat: pos.coords.latitude,
    //        lng: pos.coords.longitude,
    //    });
    //}).fail(function(e) {
    //    Mps.log('Geolocation: ' + e.message, e);
    //    this.setMyself(null);
    //}).always(function(e) {
    //    self.r.spin.hide();
    //});

    function addUser(userdata) {
        Mps.log('userdata=', userdata);
        var user = self.getUserBySocketId(userdata.socketId);
        if (!user) {
            userdata.map = self._map;
            user = new Mps.User(userdata).on('marker.click', function(e) {
                //self._map.setZoom(12);
                self._map.setCenter(this.marker.ref.getPosition());

                var infoWindow = new google.maps.InfoWindow({
                    content: user.socketId + 'Info Window',
                    size: new google.maps.Size(250, 150)
                });
                infoWindow.open(self._map, this.marker.ref);
            }).on('marker.dragend', function(e) {
                Mps.log('marker dragged', e);

                var data = {
                    socketId: user.socketId,
                    marker: {
                        lat: e.latLng.k,
                        lng: e.latLng.A
                    }
                };
                self._socket.emit('user.update', data);
            });

            if (user.socketId === _socket.socket.transport.sessid) {
                Mps.log('myself');
                if (self._user) {
                    // 自分が重複したので、昔のやつ消して作り直す
                    removeUser(self._user);
                }
                self._user = user;
                user.private = true;
                user.marker.latlng = {
                    lat: 34.701909 + Math.round(Math.random() * 100) / 10000, // TODO
                    lng: 135.494977 + Math.round(Math.random() * 100) / 10000,
                };
                self.r.log.add('あなたのIDは' + user.socketId + 'です。');
                self._socket.emit('user.connect', user.toUserdata());
            } else {
                Mps.log('other');
                self.r.log.add('ID[' + userdata.socketId + '] さんが接続しました。');
            }
            self._users.push(user);
            //Mps.log('接続方式: ' + _socket.socket.transport.name);
        } else {
            // 自分自身
            //self.r.log.add('[' + userdata.socketId + '] 接続しました。');
            Mps.log('重複するユーザが検出されました。', userdata);
        }

        return user;
    }

    function removeUser(user) {
        var marker = user.marker.ref;
        if (marker) {
            marker.setMap(null);
        }
    }

    function removeAllUsers() {
        self._users.forEach(function(user) {
            removeUser(user);
        });
        self._users = [];
    }

    // socket.io
    _socket.on('connect', function() {
        console.log('connect', arguments);

        if (self._users.length === 0) {
        }
    });

    _socket.on('user.list', function(userdataList) {
        Mps.log('user.list', arguments);

        removeAllUsers();
        userdataList.forEach(function(userdata) {
            addUser(userdata);
        });
    });

    _socket.on('user.connect', function(userdata) {
        Mps.log('user.connect', arguments);

        addUser(userdata);
    });
    _socket.on('user.disconnect', function(connection) {
        console.log('user.disconnect', arguments);
        self.r.log.add('ID[' + connection.id + '] さんが切断しました。');

        // delete user
        self._users = self._users.filter(function(user) {
            if (user.socketId !== connection.id) {
                return true;
            }
            removeUser(user);
            return false;
        });
    });

    _socket.on('user.update', function(userdata) {
        Mps.log('user.update', userdata);

        var user = self.getUserBySocketId(userdata.socketId);
        if (user && user.marker.ref) {
            user.marker.latlng = {
                lat: userdata.marker.lat,
                lng: userdata.marker.lng,
            };
            self.r.log.add('ID[' + userdata.socketId + '] さんの位置が更新されました。');
        }
    });

    this.r.$socketDisconnect.click(function(e) {
        _socket.disconnect();
    });
    this.r.$formUsername.on('submit', function(e) {
        e.preventDefault();

        var $this = $(this);
        var $username = $this.find('*[name="username"]');
        var val = $username.val();
        Mps.log('submit, username=' + val);

        _socket.emit('user.update', {
            socketId: self._user.socketId,
            username: val,
        });
    });
    this.r.$btnFold.click(function(e) {
        Mps.log('');

        setMenuShown(!self.r.$menuContents.is(':visible'));
    });

    setMenuShown(true);
    function setMenuShown(isVisible) {
        var $i = $('<i/>').addClass('glyphicon');
        if (isVisible) {
            $i.addClass('glyphicon-minus');
            self.r.$btnFold.empty().append($i);
            self.r.$menuContents.show();
            self.r.$menu.css({
                width: '259px'
            });
        } else {
            $i.addClass('glyphicon-plus');
            self.r.$btnFold.empty().append($i);
            self.r.$menuContents.hide();
            self.r.$menu.css({
                width: '52px'
            });
        }
    }
};

Mps.prototype.getUserBySocketId = function(socketId) {
    var user = null;
    this._users.forEach(function(user_) {
        if (user_.socketId === socketId) {
            user = user_;
            return false;
        }
    });

    return user;
};

$(function() {
    var mps = Mps();
    if (Mps.DEBUG) {
        window.mps = mps;
    }
});
