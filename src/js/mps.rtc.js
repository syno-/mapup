
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
            this._mute = false;
            this._videoEnabled = true;
            this._isLocalVideoEnabled = true;
            var rtc = this._webrtc = new SimpleWebRTC({
                //url: 'http://syno.in:8887',
                url: location.origin,
                localVideoEl: 'localVideo',
                remoteVideosEl: 'remoteVideos',
                autoRequestMedia: true,
                autoAdjustMic: true,
                media: {
                    video: {
                        mandatory: {
                            // CSS合わせておく
                            maxWidth: 320,
                            maxHeight: 240,
                            maxFrameRate: 8
                        }
                    },
                    audio: true
                },
            });
            rtc.on('readyToCall', function (e) {
                Mps.log('RTC, readyToCall');
                self._isReadyToCall = true;
                self.emit('readyToCall', arguments);
            });
            rtc.on('joinedRoom', function (roomId) {
                Mps.log('RTC, joinedRoom', arguments);
                rtc.mute();
                self.emit('joinedRoom', arguments);
            });
            rtc.on('leftRoom', function (roomId) {
                Mps.log('RTC, leftRoom');
                self.emit('leftRoom', [roomId]);
            });
            rtc.on('audioOff', function (event) {
                Mps.log('RTC, audioOff');
                self._mute = true;
                self.emit('audio.mute', [event, self._mute]);
            });
            rtc.on('audioOn', function (event) {
                Mps.log('RTC, audioOn');
                self._mute = false;
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

            rtc.on('channelMessage', function (peer, channelLabel, data, ch, ev) {
                self.emit('channelMessage', [peer, channelLabel, data, ch, ev]);
            });
            //rtc.on('localScreenStopped', function (stream) {
            //    self.emit('localScreenStopped', [stream]);
            //});
        },
        isReadyToCall: function() {
            return this._isReadyToCall;
        },
        //isLocalVideoEnabled: function() {
        //    return this._isLocalVideoEnabled;
        //},
        //setLocalVideoEnabled: function(is) {
        //    Mps.log('setLocalVideoEnabled, is=', is);
        //    if (is === this._isLocalVideoEnabled) {
        //        // 同じ場合何もしない
        //        return;
        //    }
        //    if (is) {
        //        this._webrtc.startLocalVideo();
        //    } else {
        //        this._webrtc.stopLocalVideo();
        //    }
        //    this._isLocalVideoEnabled = is;
        //},
        isVideoEnabled: function() {
            return this._videoEnabled;
        },
        setVideoEnabled: function(is) {
            Mps.log('setVideoEnabled, is=', is);
            if (is) {
                this._webrtc.resumeVideo();
            } else {
                this._webrtc.pauseVideo();
            }
        },
        isMuted: function() {
            return this._mute;
        },
        setMuted: function(is) {
            Mps.log('setMuted, is=', is);
            if (is) {
                this._webrtc.mute();
            } else {
                this._webrtc.unmute();
            }
        },
        getRTC: function() {
            return this._webrtc;
        }
    });

    var f = function() {
        if (!instance) {
            instance = new MyRTC();
        }

        return instance;
    };
    f.clear = function() {
        instance = null;
    };

    return f;
})();
