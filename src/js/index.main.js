
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
    var _map = this._map;

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
        self.setMyself(null);

        Mps.log('my connection ID: ' + _socket.socket.transport.sessid);
        Mps.log('接続方式: ' + _socket.socket.transport.name);
    });
    _socket.on('user.connect', function(connection) {
        console.log('user.connect', arguments);
        self.r.log.add('ID[' + connection.id + '] さんが接続しました。');

        // TODO: user add
        //new Users();
        //self._users.push()
    });
    _socket.on('user.disconnect', function(connection) {
        console.log('user.disconnect', arguments);
        self.r.log.add('ID[' + connection.id + '] さんが切断しました。');
    });

    _socket.on('user.marker.update', function(msg) {
        Mps.log('user.marker.update', msg);
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
Mps.prototype.setMyself = function(coords) {
    var self = this;
    var _map = this._map;
    var _socket = this._socket;

    var ll = (coords) ?  new google.maps.LatLng(coords.lat, coords.lng) : null;
    if (!this._marker) {
        var _marker = this._marker = new google.maps.Marker({
            position: (ll) ? ll : _map.getCenter(),
            map: _map,
            draggable: true,
            title: 'Click to zoom'
        });
        _map.setCenter(_marker.getPosition());

        google.maps.event.addListener(_marker, 'click', function() {
            _map.setZoom(12);
            _map.setCenter(_marker.getPosition());

            //self._infoWindow.open(_map, _marker);
        });
        google.maps.event.addListener(_marker, 'dragend', function(e) {
            Mps.log('marker dragged', e);

            var data = {
                lat: e.latLng.A,
                lng: e.latLng.k
            };
            _socket.emit('user.marker.update', data);
            Mps.log('marker emit', data);
        });
    } else {
        if (ll) {
            this._marker.setPosition(ll);
        } else {
            //Mps.log('setMyself, coords is null.');
        }
    }
};

$(function() {
    var mps = Mps();
    if (Mps.DEBUG) {
        window.mps = mps;
    }
});
