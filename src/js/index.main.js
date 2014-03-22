
/**
 *
 */
Mps.prototype.init = function() {

    // init maps
    this.r = {
        $map: $('#map'),
        $socketDisconnect: $('#socket-disconnect'),
        $formUsername: $('#form-username'),
        //$log: $('#log'),
        log: new Mps.Log('log', {
            limit: 100
        }),
        spin: Mps.Dialog('spin')
    };

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

    //this._infoWindow = new google.maps.InfoWindow({
    //    content: 'Info Window',
    //    size: new google.maps.Size(50,50)
    //});
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

        // TODO: user add
        var user = self._user = new Mps.User();
        user.socketId = _socket.socket.transport.sessid;
        user.latlng = new google.maps.LatLng(34.701909, 135.494977);
        self._users.push(user);

        self._socket.emit('user.connect', user.toUserdata());

        Mps.log('my connection ID: ' + _socket.socket.transport.sessid);
        Mps.log('接続方式: ' + _socket.socket.transport.name);
    });

    _socket.on('user.connect', function(userdata) {
        Mps.log('user.connect', arguments);

        var marker_ = userdata.marker;
        if (marker_) {
            var user = null;
            self._users.forEach(function(user_) {
                if (user_.socketId === userdata.socketId) {
                    user = user_;
                }
            });
            if (user) {
                // 自分自身
            } else {
                user = self._user = new Mps.User();
                user.socketId = userdata.socketId;
                user.latlng = new google.maps.LatLng(userdata.lat, userdata.lng);
                self._users.push(user);
            }
            if (!user.marker) {
            } else {
                throw new Error('Marker is already created.');
            }
        }
        self.r.log.add('ID[' + userdata.socketId + '] さんが接続しました。');
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
        var marker_ = userdata.marker;
        if (marker_) {
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
};
Mps.prototype.getUserBySocketId = function(socketId) {
    var user = null;
    self._users.forEach(function(user_) {
        if (user_.socketId === socketId) {
            user = user_;
            return false;
        }
    });

    return user;
};
Mps.prototype.createMarker = function(userdata) {
    var self = this;

    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(userdata.lat, userdata.lng),
        map: this._map,
        draggable: true,
        title: 'Click to zoom'
    });
    this._map.setCenter(marker.getPosition());

    google.maps.event.addListener(marker, 'click', function() {
        self._map.setZoom(12);
        self._map.setCenter(marker.getPosition());

        //self._infoWindow.open(self._map, marker);
    });
    google.maps.event.addListener(marker, 'dragend', function(e) {
        Mps.log('marker dragged', e);

        var data = {
            marker: {
                lat: e.latLng.A,
                lng: e.latLng.k
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
