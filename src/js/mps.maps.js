
/**
 *
 * TODO
 *
 */
Mps.Maps = (function() {
    "use strict";

    function createIconImages(colors) {
        var r = [];
        colors.forEach(function(color) {
            var url = 'http://www.google.com/intl/en_us/mapfiles/ms/micons/' + color + '-dot.png';
            var image = new google.maps.MarkerImage(
                url,
                new google.maps.Size(32, 32),
                new google.maps.Point(0,0),
                new google.maps.Point(16, 32)
            );
            r.push(image);
        });

        return r;
    }

    /**
     * Queue (FIFO)
     */
    var Maps = Class.extend({
        init: function() {
            this._users = [];

            this._icons = createIconImages(['red']);
            this._iconShadow = new google.maps.MarkerImage(
                //'http://maps.google.com/mapfiles/ms/micons/msmarker.shadow.png',
                new google.maps.Size(59, 32),
                new google.maps.Point(0,0),
                new google.maps.Point(16, 32)
            );
            this._iconShape = {
                coord: [19,0, 24,5, 24,12, 23,13, 23,14, 20,17, 20,18, 19,19, 
                    19,20, 18,21, 18,22, 17,23, 17,26, 16,27, 16,31, 14,31, 14,26, 13,25, 
                    13,23, 12,22, 12,20, 10,18, 10,17, 7,14, 7,13, 6,12, 6,6, 7,5, 7,4, 11,0],
                    type: 'poly'
            };
        },
    });

    // statics
    $.extend(Maps, {
        createInfoWindowMessage: function(user) {
            var $root = $('<div/>').addClass('infowindow');
            if (user.username) {
                $('<p>').text(user.username).appendTo($root);
            }
            if (user.tags) {
                var msg;
                if (user.tags.length > 0) {
                    msg = 'タグ: ' + user.tags.join(',');
                } else {
                    msg = 'タグ: (なし)';
                }
                $('<p>').text(msg).appendTo($root);
            }
            Mps.log('createInfoWindowMessage, roomId=', user.roomId);
            if (user.roomId) {
                $('<p>').text('通話中!').appendTo($root);
            }
            if (!user.private) {
                $('<button>').attr('type', 'button')
                .addClass('btn btn-danger')
                .text('ビデオチャットに招待する')
                .attr('onclick', 'onClickInviteVideoOnInfoWindow(this, "' + user.socketId + '")')
                .appendTo($root);
                //var rtc = Mps.Dialog('rtc');
                //rtc.setSelf(user);
                //rtc.addUser(user);
                //rtc.show();
            }

            var html = $root[0].outerHTML;
            //console.log('html', html);
            return html;
        },
        inviteVideoCallback: null,
    });
    window.onClickInviteVideoOnInfoWindow = function(btnEl, socketId) {
        console.log('onMapInfoWindow');
        if (Maps.inviteVideoCallback) {
            Maps.inviteVideoCallback(btnEl, socketId);
        }
    };

    //function createMarker(map, latlng, label, html, color) {
    //    var contentString = '<b>'+label+'</b><br>'+html;
    //    var marker = new google.maps.Marker({
    //        position: latlng,
    //        map: map,
    //        shadow: iconShadow,
    //        icon: getMarkerImage(color),
    //        shape: iconShape,
    //        title: label,
    //        zIndex: Math.round(latlng.lat()*-100000)<<5
    //    });

    //    google.maps.event.addListener(marker, 'click', function() {
    //        infowindow.setContent(contentString); 
    //        infowindow.open(map,marker);
    //    });
    //}

    return Maps;
})();

