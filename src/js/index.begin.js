


//reqLocation().done(function(ll) {
//}).fail(function(e) {
//});
function reqLocation() {
    var d = $.Deferred();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            d.done.apply(d, arguments);
        }, function() {
            d.fail.apply(d, arguments);
        });
    } else {
        d.fail();
    }

    return d.promise();
}

function init() {
    var mapOptions = {
        center: new google.maps.LatLng(34.701909, 135.494977),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map($('#map_canvas')[0], mapOptions);

    var marker = new google.maps.Marker({
        position: map.getCenter(),
        map: map,
        title: 'Click to zoom'
    });

    var infowindow = new google.maps.InfoWindow({
        content: 'Info Window',
        size: new google.maps.Size(50,50)
    });

    google.maps.event.addListener(marker, 'click', function() {
        map.setZoom(12);
        map.setCenter(marker.getPosition());

        infowindow.open(map, marker);
    });
}

$(function() {
    init();
    reqLocation().done(function(pos) {
        alert('detected: ' + pos);
    }).fail(function() {
        alert('detect fail');
    });
});
