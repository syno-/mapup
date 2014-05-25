
/**
 *
 * Usage: 
 * var spin = Mps.Dialog('spin');
 * spin.show();
 *
 */
Mps.Dialog = (function() {
    "use strict";

    var _dialogRefs = {};

    var ctr = function Dialog(obj) {
        var dlgId;
        if (obj instanceof jQuery) {
            dlgId = obj.attr('id');
        } else {
            // 文字列
            dlgId = obj;
        }

        var d = _dialogRefs[dlgId];
        if (!d) {
            var Dlg = dialogs[dlgId];
            if (Dlg) {
                d = new Dlg(dlgId);
            } else {
                d = new DialogProto(dlgId);
            }
            _dialogRefs[dlgId] = d;
        }

        return d;
    };

    var DialogProto = Mps.EventObserver.extend({
        init: function(dlgId) {
            this._super.apply(this, arguments);
            this._dlgId = dlgId;
        },
        initBootstrap: function() {
            this._$ = $('#' + this._dlgId);
        },
    });

    var BootstrapDialogProto = DialogProto.extend({
        init: function(dlgId) {
            this._super.apply(this, arguments);
            this._$ = $('#' + this._dlgId);
        },
        show: function() {
            this._$.modal();
        },
        modal: function() {
            this._$.modal.apply(this._$, arguments);
        },
    });

    var dialogs = {
        /**
         * 非同期プログレスを出すダイアログです。
         *
         * @extends DialogProto
         */
        spin: DialogProto.extend({
            width: 260,
            height: 260,
            opts : {
                lines: 13, // The number of lines to draw
                length: 23, // The length of each line
                width: 14, // The line thickness
                radius: 30, // The radius of the inner circle
                corners: 1, // Corner roundness (0..1)
                rotate: 0, // The rotation offset
                direction: 1, // 1: clockwise, -1: counterclockwise
                //color: '#fff', // #rgb or #rrggbb or array of colors
                speed: 2.2, // Rounds per second
                trail: 100, // Afterglow percentage
                shadow: false, // Whether to render a shadow
                hwaccel: false, // Whether to use hardware acceleration
                className: 'spinner', // The CSS class to assign to the spinner
                zIndex: 2e9, // The z-index (defaults to 2000000000)
                //top: 'auto', // Top position relative to parent in px
                //left: 'auto' // Left position relative to parent in px
            },
            show: function() {
                //this._center();
                this._$.show();
                return this;
            },
            hide: function() {
                this._$.hide();
                return this;
            },
            init: function(dlgId) {
                this._super.apply(this, arguments);

                var $body = $('body');
                this._spinner = new Spinner(this.opts).spin($body[0]);
                var $spinner = $(this._spinner.el).attr('id', dlgId);

                DialogProto.prototype.initBootstrap.apply(this, arguments);
                this.hide();
            }
        }),
        'dlg-photo': BootstrapDialogProto.extend({
            init: function(dlgId) {
                this._super.apply(this, arguments);
                this._maxWidth = 640;
                this._maxHeight = 480;
                var self = this;
                //this._$.on('hide.bs.modal', function(e) {
                //});
                var $dlg = this._$.find('.modal-dialog');
                var $body = this._$.find('.modal-body');
                this.$start = $('#photo-start').click(function(e) {
                    self.stopVideo();
                });
                this.$onemore = $('#photo-onemore').click(function(e) {
                    self.startVideo();
                });
                this.$ok = $('#photo-ok').click(function(e) {
                    self.emit('ok', [e, self.$video.width(), self.$video.height()]);
                    self.stopVideo();
                    self._$.modal('hide');
                });
                this.$video = $('#photo-video');
                var padding = parseInt($body.css('padding-left'), 10);
                $dlg.css({
                    width: (this._maxWidth + padding * 2) + 'px'
                });

                self.startVideo();
            },
            isVisible: function() {
                return this._$.is(':visible');
            },
            startVideo: function() {
                var self = this;
                if (!self.stream) {
                    var userMedia = Mps.getUserMedia({
                        // http://tools.ietf.org/html/draft-alvestrand-constraints-resolution-00#page-4
                        video: {
                            mandatory: {
                                maxWidth: this._maxWidth,
                                maxHeight: this._maxHeight
                            },
                        },
                        audio: false, 
                    }, function(stream) {
                        if (self.isVisible()) {
                            self.stream = stream;
                            var url = window.URL.createObjectURL(self.stream);
                            self.$video.attr('src', url);
                        } else {
                            stream.stop();
                            stream = null;
                        }
                    }, function(error) {
                        // TODO: エラーを通知する
                        console.error("getUserMedia error: ", error.code);
                    });
                    Mps.log('userMedia', userMedia);
                }
            },
            capture: function(canvasContext, width, height) {
                //console.log(canvasContext, width, height);
                canvasContext.drawImage(this.$video[0], 0, 0, width, height);
            },
            toDataURL: function(w, h) {
                var $c = $('<canvas/>').attr('width', w).attr('height', h);
                var context = $c[0].getContext('2d');
                context.drawImage(this.$video[0], 0, 0, w, h);
                var url = $c[0].toDataURL();
                return url;
            },
            stopVideo: function() {
                var self = this;
                if (self.stream) {
                    self.stream.stop();
                    self.stream = null;
                }
            },
        }),
        'rtc': BootstrapDialogProto.extend({
            init: function(dlgId) {
                this._super.apply(this, arguments);
                this._users = [];

                this.$title = this._$.find('#rtc-title');
                this.$selfUsername = this._$.find('#rtc-self-username');
                this.$btnMute = this._$.find('#rtc-btn-mute');
                this.$btnVideo = this._$.find('#rtc-btn-video');
                //this._$.on('', function(e) {
                //});
            },
            /** レイアウト作るためのやつ。消す。 */
            test: function() {
                this.$title.text('タイトル');
                this.$selfUsername.text('ほげほげ');
                this.$btnMute.text('Mute');
                this.$btnVideo.text('stopVideo');

                return this;
            },
            setSelf: function(user) {
                this.$selfUsername.text(user.displayUsername());

                return this;
            },
            addUser: function(user) {
                this._users.push(user);
                this.$title.text(user.displayUsername());

                return this;
            },
            begin: function() {
                this.initSimpleWebRTC();

                return this;
            },
            end: function() {
            },
            removeUser: function(user) {
                // TODO
            },
            initSimpleWebRTC: function() {
                if (this._webrtc) {
                    return;
                }
                var webrtc = this._webrtc = new SimpleWebRTC({
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
                    // TODO
                    webrtc.joinRoom('your awesome room name');
                });
                webrtc.on('joinedRoom', function () {
                    webrtc.sendDirectlyToAll("text chat", "chat", ""); // omajinai
                });
                webrtc.on('channelMessage', function (peer, label, data, ch, ev) {
                    if (label == 'text chat' && data.type == 'chat') {
                        document.getElementById("chatLog").innerHTML += data.payload;
                    }
                });

                // 
                this.$btnMute.text('Mute');
                //webrtc.on('audioOff', function (event) {
                //});
                //webrtc.on('audioOn', function (event) {
                //});

                // 
                this.$btnVideo.text('stopVideo');
                //webrtc.on('videoOff', function (event) {
                //});
                //webrtc.on('videoOn', function (event) {
                //});
            },
            /**
             * @param {HTMLElement} _text
             */
            sendChat: function(_text) {
                var context = document.getElementById("snap").getContext("2d");
                context.beginPath();
                context.rect(15, 0, 90, 90);
                context.clip();
                context.drawImage(document.getElementById("localVideo"),0, 0, 120, 90);
                var snap = document.getElementById("snap").toDataURL();
                var html = '<div class=chatText><img width="60" src="' + snap + '">' + _text.value + '</div>';
                this._webrtc.sendDirectlyToAll("text chat", "chat", html);
                document.getElementById("chatLog").innerHTML += html;
                _text.value = '';
            },
        }),
        disconnected: DialogProto.extend({
            init: function(dlgId) {
                this._super.apply(this, arguments);
            }
        }),
    };

    return ctr;
})();
