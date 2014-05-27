
Mps.rtc = (function() {
    "use strict";

    var instance = null;
    var WebRTC = function() {
        this.init.apply(this, arguments);
    };

    $.extend(WebRTC.prototype, {
        init: function() {
            var self = this;
            this._isReadyToCall = false;
            this._webrtc = new SimpleWebRTC({
                //url: 'http://syno.in:8887',
                url: location.origin,
                localVideoEl: 'localVideo',
                remoteVideosEl: 'remoteVideos',
                autoRequestMedia: true,
                media: {
                    video: {
                        mandatory: {
                            maxWidth: 320,
                            maxHeight: 240,
                            maxFrameRate: 8
                        }
                    },
                    audio: false
                },
            });
            webrtc.on('readyToCall', function () {
                self._isReadyToCall = true;
                // TODO
            });
        },
        joinRoom: function(roomId) {
            // TODO: readyToCallされていることが前提。
            webrtc.joinRoom(roomId);
            //if (this._isReadyToCall) {
            //} else {
            //}
        },
        getRTC: function() {
            return this._webrtc;
        }
    });

    return {
        get: function() {
            if (!instance) {
                instance = new WebRTC();
            }

            return instance;
        },
    };
})();
