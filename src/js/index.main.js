
/**
 *
 */
Mps.prototype.init = function() {

    // init maps
    this._refs = {
        $map: $('#map_canvas'),
        spin: Mps.Dialog('spin')
    };

    this.initMaps();
    this.initSocketio();
    this.initFinished();
};

Mps.prototype.initMaps = function() {
    this._map = new google.maps.Map(this._refs.$map[0], {
        // Osaka
        center: new google.maps.LatLng(34.701909, 135.494977),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    this._infoWindow = new google.maps.InfoWindow({
        content: 'Info Window',
        size: new google.maps.Size(50,50)
    });
};

Mps.prototype.initSocketio = function() {
    Mps.log('socketio');

    this._socket = io.connect(location.protocol + '//' + location.host + '/');
};

Mps.prototype.initFinished = function() {
    var self = this;
    var _socket = this._socket;
    var _refs = this._refs;
    var _map = this._map;

    // init my location
    //_refs.spin.show();
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
    //    _refs.spin.hide();
    //});

    //google.maps.event.addListener(_map, 'click', function(e) {
    //    self.setMyself({
    //        lat: e.latLng.lat(),
    //        lng: e.latLng.lng()
    //    });
    //});

    // socket.io
    _socket.on('connect', function(msg) {
        console.log("connect");
        self.setMyself(null);

        $('#connectId').text("あなたの接続ID::" + _socket.socket.transport.sessid);
        $('#type').text("接続方式::" + _socket.socket.transport.name);
    });

    _socket.on('message', function(msg) {
        $('#receiveMsg').text(msg.value);
    });

    $('#socket-send-msg').click(function(e) {
        var msg = $('#message');
        // メッセージを発射する
        _socket.emit('message', {
            value: msg.val()
        });
    });
    $('#socket-send-disconnect').click(function(e) {
        var msg = _socket.socket.transport.sessid + "は切断しました。";
        // メッセージを発射する
        _socket.emit('message', {
            value: msg
        });
        // socketを切断する
        _socket.disconnect();
    });

};
Mps.prototype.setMyself = function(coords) {
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

            infoWindow.open(_map, _marker);
        });
        google.maps.event.addListener(_marker, 'dragend', function(e) {
            Mps.log('marker dragged', e);

            _socket.emit({
                value: {
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng()
                }
            });
            //_marker.setPosition(new google.maps.LatLng(e.latLng.lat(), e.latLng.lng()));
        });
    } else {
        if (ll) {
            this._marker.setPosition(ll);
        } else {
            Mps.log('setMyself, coords is null.');
        }
    }
};

$(function() {
    var mps = Mps();
});
