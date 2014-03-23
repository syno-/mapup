
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

    // socket.io
    _socket.on('connect', function() {
        console.log('connect', arguments);

        if (self._users.length === 0) {
            var user = self._user = new Mps.User({
                socketId: _socket.socket.transport.sessid,
                private: true,
                marker: {
                    lat: 34.701909 + Math.round(Math.random() * 100) / 10000, // TODO
                    lng: 135.494977 + Math.round(Math.random() * 100) / 10000,
                }
            });
            user.marker.ref = self.createMarker(user);
            self._users.push(user);
            self._socket.emit('user.connect', user.toUserdata());

            Mps.log('my connection ID: ' + _socket.socket.transport.sessid);
            Mps.log('接続方式: ' + _socket.socket.transport.name);
        }
    });

    _socket.on('user.connect', function(userdata) {
        Mps.log('user.connect', arguments);

        var user = self.getUserBySocketId(userdata.socketId);
        if (!user) {
            user = new Mps.User(userdata);
            self._users.push(user);

            var marker_ = userdata.marker;
            if (marker_) {
                user.marker.ref = self.createMarker(user);
                Mps.log('ref=', user.marker.ref);
            }
            self.r.log.add('ID[' + userdata.socketId + '] さんが接続しました。');
        } else {
            // 自分自身
            self.r.log.add('[' + userdata.socketId + '] 接続しました。');
        }
    });
    _socket.on('user.disconnect', function(connection) {
        console.log('user.disconnect', arguments);
        self.r.log.add('ID[' + connection.id + '] さんが切断しました。');

        // delete user
        self._users = self._users.filter(function(user) {
            return (user.socketId !== connection.id);
        });
    });

    _socket.on('user.update', function(userdata) {
        Mps.log('user.update', userdata);

        var user = self.getUserBySocketId(userdata.socketId);
        if (user && user.marker.ref) {
            window.hoge = user;
            user.marker.lat = userdata.marker.lat;
            user.marker.lng = userdata.marker.lng;
            user.marker.ref.setPosition(new google.maps.LatLng(user.marker.lat, user.marker.lng));
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
        Mps.log('submit, username=' + $username.val());
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

Mps.prototype.createMarker = function(user) {
    var self = this;
    var marker_ = user.marker;

    if (marker_.lat === undefined || marker_.lng === undefined) {
        throw new Error('lat/lng is undefined.');
    }
    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(marker_.lat, marker_.lng),
        map: this._map,
        draggable: user.private,
        title: 'Click to zoom'
    });
    var infoWindow = new google.maps.InfoWindow({
        content: user.socketId + 'Info Window',
        size: new google.maps.Size(250, 150)
    });
    //this._map.setCenter(marker.getPosition());

    google.maps.event.addListener(marker, 'click', function() {
        //self._map.setZoom(12);
        self._map.setCenter(marker.getPosition());

        infoWindow.open(self._map, marker);
    });
    google.maps.event.addListener(marker, 'dragend', function(e) {
        Mps.log('marker dragged', e);

        var data = {
            socketId: user.socketId,
            marker: {
                lat: e.latLng.k,
                lng: e.latLng.A
            }
        };
        self._socket.emit('user.update', data);
        Mps.log('marker emit', data);
    });

    return marker;
};

$(function() {
    var mps = Mps();
    if (Mps.DEBUG) {
        window.mps = mps;
    }
});
