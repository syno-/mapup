
/**
 *
 *
 */
Mps.prototype.init = function() {

    // init maps
    var _refs = {
        $map: $('#map_canvas')
    };
    var _map = this._map = new google.maps.Map(_refs.$map[0], {
        // Osaka
        center: new google.maps.LatLng(34.701909, 135.494977),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    var spin = Mps.Dialog('spin');
    spin.show();

    Mps.log('start spin');
    Mps.Geo.current().done(function(pos) {
        Mps.log('detected: ', pos);
        putMyself(pos.coords);
    }).fail(function(e) {
        Mps.log('Geolocation: ' + e.message, e);
        putMyself(null);
    }).always(function(e) {
        spin.hide();
    });

    function putMyself(coords) {
        var ll = (coords) ?
            new google.maps.LatLng(coords.latitude, coords.longitude) :
            _map.getCenter();
        var marker = new google.maps.Marker({
            position: ll,
            map: _map,
            title: 'Click to zoom'
        });
        _map.setCenter(marker.getPosition());

        var infoWindow = new google.maps.InfoWindow({
            content: 'Info Window',
            size: new google.maps.Size(50,50)
        });

        google.maps.event.addListener(marker, 'click', function() {
            _map.setZoom(12);
            _map.setCenter(marker.getPosition());

            infoWindow.open(_map, marker);
        });
    }
};

$(function() {
    var mps = Mps();
});
