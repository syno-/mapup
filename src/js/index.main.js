
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
    var socket = this._socket;
    var _refs = this._refs;

    // init my location
    _refs.spin.show();
    Mps.Geo.current().done(function(pos) {
        Mps.log('detected: ', pos);
        putMyself(pos.coords);
    }).fail(function(e) {
        Mps.log('Geolocation: ' + e.message, e);
        putMyself(null);
    }).always(function(e) {
        _refs.spin.hide();
    });

    // socket.io
    socket.on('connect', function(msg) {
        console.log("connect");

        $('#connectId').text("あなたの接続ID::" + socket.socket.transport.sessid);
        $('#type').text("接続方式::" + socket.socket.transport.name);
    });

    socket.on('message', function(msg) {
        $('#receiveMsg').text(msg.value);
    });

    $('#socket-send-msg').click(function(e) {
        var msg = $('#message');
        // メッセージを発射する
        socket.emit('message', {
            value: msg.val()
        });
    });
    $('#socket-send-disconnect').click(function(e) {
        var msg = socket.socket.transport.sessid + "は切断しました。";
        // メッセージを発射する
        socket.emit('message', {
            value: msg
        });
        // socketを切断する
        socket.disconnect();
    });

    var _map = this._map;
    function putMyself(coords) {
        var ll = (coords) ?
            new google.maps.LatLng(coords.latitude, coords.longitude) :
            _map.getCenter();
        this._marker = new google.maps.Marker({
            position: ll,
            map: __map,
            draggable: true,
            title: 'Click to zoom'
        });
        __map.setCenter(marker.getPosition());

        google.maps.event.addListener(marker, 'click', function() {
            _map.setZoom(12);
            _map.setCenter(marker.getPosition());

            infoWindow.open(_map, marker);
        });
        google.maps.event.addListener(marker, 'dragend', function(e) {
            Mps.log('marker dragged', e);

            socket.emit({
                value: {
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng()
                }
            });
            //marker.setPosition(new google.maps.LatLng(e.latLng.lat(), e.latLng.lng()));
        });
    }
};

$(function() {
    var mps = Mps();
});
