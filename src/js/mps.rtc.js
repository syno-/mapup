
Mps.rtc = (function() {
    "use strict";

    var instance = null;
    var MyRTC = function() {
        this.init.apply(this, arguments);
    };

    $.extend(MyRTC.prototype, Mps.EventObserver.prototype, {
        init: function() {
            Mps.EventObserver.prototype.init.apply(this, arguments);

            var self = this;
            this._isReadyToCall = false;
            this._mute = true;
            this._videoEnabled = true;
            var rtc = this._webrtc = new SimpleWebRTC({
                //url: 'http://syno.in:8887',
                url: location.origin,
                localVideoEl: 'localVideo',
                remoteVideosEl: 'remoteVideos',
                autoRequestMedia: true,
                media: {
                    video: {
                        mandatory: {
                            // CSS合わせておく
                            maxWidth: 320,
                            maxHeight: 240,
                            maxFrameRate: 8
                        }
                    },
                    audio: false
                },
            });
            rtc.on('readyToCall', function (e) {
                Mps.log('RTC, readyToCall');
                self._isReadyToCall = true;
                self.emit('readyToCall', arguments);
            });
            rtc.on('joinedRoom', function () {
                Mps.log('RTC, joinedRoom');
                rtc.sendDirectlyToAll("text chat", "chat", ""); // omajinai
                self.emit('joinedRoom', arguments);
            });
            rtc.on('audioOff', function (event) {
                Mps.log('RTC, audioOff');
                self._mute = false;
                self.emit('audio.mute', [event, self._mute]);
            });
            rtc.on('audioOn', function (event) {
                Mps.log('RTC, audioOn');
                self._mute = true;
                self.emit('audio.mute', [event, self._mute]);
            });

            rtc.on('videoOff', function (event, isEnabled) {
                self._videoEnabled = false;
                self.emit('video', [event, self._videoEnabled]);
            });
            rtc.on('videoOn', function (event, isEnabled) {
                self._videoEnabled = true;
                self.emit('video', [event, self._videoEnabled]);
            });
        },
        isReadyToCall: function() {
            return this._isReadyToCall;
        },
        isVideoEnabled: function() {
            return this._videoEnabled;
        },
        isMuted: function() {
            return this._mute;
        },
        getRTC: function() {
            return this._webrtc;
        }
    });

    return function() {
        if (!instance) {
            instance = new MyRTC();
        }

        return instance;
    };
})();
