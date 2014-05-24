
$.extend(Mps.prototype, {
    init: function() {

        // init maps
        this.r = {
            $map: $('#map'),
            $menu: $('#menu'),
            $menuContents: $('#menu-contents'),
            $btnFold: $('#btn-fold'),
            $socketDisconnect: $('#socket-disconnect'),
            $formUsername: $('#form-username'),
            $username: $('#form-username input[name="username"]'),
            $tagsFilter: $('#tags-filter'),
            $formFilterMenu: $('#form-filter .dropdown-menu'),
            $tags: $('#tags'),
            $tagsInput: $('#tags input[name="tags"]'),
            $formChat: $('#form-chat'),
            $chatInput: $('#chat-input'),
            $formTags: $('#form-tags'),
            //$log: $('#log'),
            log: new Mps.Log('log', {
                limit: 100
            }),
            spin: Mps.Dialog('spin'),
            dlgPhoto: Mps.Dialog('dlg-photo'),
            $photo: $('#photo'),
            photoContext: $('#photo')[0].getContext('2d'),
        };
        if (Mps.DEBUG) {
            window.r = this.r;
        }

        /**
         * ユーザの一覧
         */
        this._users = [];
        this._tagsFilter = [];

        this.initMaps();
        this.initSocketio();
        this.initFinished();
    },
    initMaps: function() {
        this._map = new google.maps.Map(this.r.$map[0], {
            // Osaka
            center: new google.maps.LatLng(34.701909, 135.494977),
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
    },
    initSocketio: function() {
        Mps.log('socketio');

        this._socket = io.connect(location.protocol + '//' + location.host + '/');
    },
    initFinished: function() {
        var self = this;
        var _socket = this._socket;

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

        this.r.dlgPhoto.on('ok', function(e, w, h) {
            this.capture(self.r.photoContext, self.r.$photo.width(), self.r.$photo.height());
            var url = this.toDataURL(64, 48);
            Mps.log('photo image url=', url);

            // send image
            Mps.net.reqSendMarkerImage(url).done(function(data) {
                Mps.log('reqSendMarkerImage', data);
                // TODO: ピン立て
                if (self._user) {
                    Mps.log('self._user', data);
                    self._user.setIcon(data.name);
                    self._socket.emit('user.update', {
                        socketId: self._user.socketId,
                        imageName: data.name
                    });
                } else {
                    Mps.log('自分がまだマップ上に無い。ネットワークの状態が悪い？');
                }
            }).fail(function(e) {
                Mps.log('reqSendMarkerImage, fail', e);
            });
        });
        this.r.dlgPhoto.show();

        function addUser(userdata) {
            Mps.log('addUser, userdata=', userdata);
            var user = self.getUserBySocketId(userdata.socketId);
            if (!user) {
                userdata.map = self._map;
                user = createUser(userdata);

                if (user.socketId === _socket.socket.transport.sessid) {
                    if (self._user) {
                        // 自分が既に存在する
                    } else {
                        self._user = user;
                        self.initMyself(user);
                        self.r.log.add('あなたのIDは' + user.socketId + 'です。');
                    }

                    var sendUserdata = user.toUserdata();
                    Mps.log('addUser, add myelf: ', sendUserdata);
                    self._socket.emit('user.connect', sendUserdata);
                } else {
                    Mps.log('addUser, other');
                    self.r.log.add('ID[' + userdata.socketId + '] さんが接続しました。');
                }

                self._users.push(user);
                //Mps.log('接続方式: ' + _socket.socket.transport.name);
            } else {
                // TODO: 自分自身が接続しなおしたとき。
                //if (user.socketId === _socket.socket.transport.sessid) {
                //    var updateUserdata = user.toUserdata();
                //    self._socket.emit('user.update', updateUserdata);
                //}
                // 自分自身
                //self.r.log.add('[' + userdata.socketId + '] 接続しました。');
                Mps.log('addUser, 重複するユーザが検出されました。', userdata);
            }

            return user;
        }

        function removeUser(user) {
            var idx = -1;
            self._users.forEach(function(user_, i) {
                if (user.socketId === user_.socketId) {
                    idx = i;
                    return false;
                }
            });
            if (idx >= 0) {
                user.destroy();
                if (user.socketId === _socket.socket.transport.sessid) {
                    self._user = null;
                }
                self._users.splice(idx, 1);
            }
        }

        function createInfoWindowMessage(user) {
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

            var html = $root[0].outerHTML;
            //console.log('html', html);
            return html;
        }

        function createUser(userdata) {
            var user = new Mps.User(userdata).on('marker.click', function(e) {
                //self._map.setZoom(12);
                //self._map.setCenter(this.marker.ref.getPosition());

                if (!user.infoWindow) {
                    user.infoWindow = new google.maps.InfoWindow({
                        //size: new google.maps.Size(250, 150)
                    });
                } else {
                    //google.maps.event.clearInstanceListeners(infoWindow);
                    //infoWindow.close();
                    //infoWindow = null;
                }
                user.infoWindow.setContent(createInfoWindowMessage(user));

                user.infoWindow.open(self._map, this.marker.ref);
            }).on('marker.dragend', function(e) {
                Mps.log('marker dragged', e);

                var data = {
                    socketId: user.socketId,
                    marker: {
                        lat: e.latLng.k,
                        lng: e.latLng.A
                    }
                };
                self._socket.emit('user.update', data);
            }).on('username.changed', function(value) {
                Mps.log('username.changed: ', value);
                if (this.private) {
                    // myself
                    self.r.$username.val(value);
                }
            });

            return user;
        }

        function removeAllUsers() {
            self._users.forEach(function(user) {
                user.destroy();
            });
            self._users = [];
        }

        // socket.io
        _socket.on('connect', function() {
            console.log('connect', arguments);

            if (self._users.length === 0) {
            }
        });

        _socket.on('user.list', function(userdataList) {
            Mps.log('user.list', arguments);

            removeAllUsers();
            userdataList.forEach(function(userdata) {
                addUser(userdata);
            });
            self.refreshTagList();
        });

        _socket.on('user.connect', function(userdata) {
            Mps.log('user.connect', arguments);

            addUser(userdata);
        });
        _socket.on('user.disconnect', function(connection) {
            console.log('user.disconnect', connection.id, self._users);
            self.r.log.add('ID[' + connection.id + '] さんが切断しました。');

            // delete user
            self._users.forEach(function(user_, i) {
                if (user_.socketId === connection.id) {
                    removeUser(user_);
                    return false;
                }
            });
        });

        _socket.on('user.update', function(userdata) {
            Mps.log('user.update', userdata);

            var user = self.getUserBySocketId(userdata.socketId);
            if (user) {
                if (userdata.marker) {
                    user.marker.latlng = userdata.marker;
                    self.r.log.add('ID[' + userdata.socketId + '] さんの位置が更新されました。');
                }
                if (userdata.username) {
                    user.username = userdata.username;
                    self.r.log.add('ID[' + userdata.socketId + '] さんの名前が' + userdata.username + 'に更新されました。');
                }
                if (userdata.tags) {
                    user.tags = userdata.tags;
                    self.r.log.add('ID[' + userdata.socketId + '] さんのタグが修正されました。');
                    self.refreshTagList();
                }
                if (userdata.imageName) {
                    user.imageName = userdata.imageName;
                    self.r.log.add('ID[' + userdata.socketId + '] さんの画像が修正されました。');
                }

                if (self._user === user) {
                    self._user.save();
                }
            }
        });

        this.r.$socketDisconnect.click(function(e) {
            _socket.disconnect();
        });

        this.r.$btnFold.click(function(e) {
            Mps.log('');

            setMenuShown(!self.r.$menuContents.is(':visible'));
        });
        this.r.$formChat.submit(function(e) {
            e.preventDefault();

            var val = self.r.$chatInput.val();
            self.r.$chatInput.focus().val('');

            if (self._user) {
                self._socket.emit('user.chat', {
                    to: {
                        //socketId: id,
                        text: val,
                    },
                    from: {
                        socketId: self._user.socketId,
                        username: self._user.username,
                    },
                });
            }
        });
        _socket.on('user.chat', function(chat) {
            Mps.log('user.chat', arguments);

            var user = self.getUserBySocketId(chat.from.socketId);
            var username;
            if (user) {
                if (user.username) {
                    username = user.username;
                } else {
                    username = user.socketId;
                }
            } else {
                username = '(???)';
            }
            self.r.log.add('[' + username + ']: ' + chat.to.text);
        });

        setMenuShown(true);
        function setMenuShown(isVisible) {
            var $i = $('<i/>').addClass('glyphicon');
            if (isVisible) {
                $i.addClass('glyphicon-minus');
                self.r.$btnFold.empty().append($i);
                self.r.$menuContents.show();
                self.r.$menu.css({
                    width: '259px'
                });
            } else {
                $i.addClass('glyphicon-plus');
                self.r.$btnFold.empty().append($i);
                self.r.$menuContents.hide();
                self.r.$menu.css({
                    width: '52px'
                });
            }
        }
    },
    initMyself: function(user) {
        var self = this;

        user.on('tags.init', function(value) {
            Mps.log('tags.init: ', value);
            if (this.private) {
                self.refreshTags(user);
            }
        }).on('user.update', function(userdata) {
            self.refreshTagsFilter();
        });

        user.private = true;
        var saved = Mps.User.loadMyself();
        if (saved) {
            Mps.log('  Restore myself');
            user.marker.latlng = saved.marker.latlng;
            user.username = saved.username;
            user.tags = saved.tags;
        } else {
            Mps.log('  new myself');
            user.marker.latlng = {
                lat: 34.701909 + Math.round(Math.random() * 100) / 10000, // TODO
                lng: 135.494977 + Math.round(Math.random() * 100) / 10000,
            };
        }

        // Username
        this.r.$formUsername.on('submit', function(e) {
            e.preventDefault();

            var $this = $(this);
            var $username = $this.find('*[name="username"]');
            var val = $username.val();
            Mps.log('submit, username=' + val);

            self._socket.emit('user.update', {
                socketId: user.socketId,
                username: val,
            });
        });

        this.r.$formTags.on('submit', function(e) {
            e.preventDefault();

            var tag = self.r.$tagsInput.val();
            self.r.$tagsInput.focus().val('');
            if (user.tags.indexOf(tag) === -1) {
                user.tags.push(tag);
                user.save();
                self.refreshTags(user);

                // addedtagcallback
                // update/delete時のサーバへの送信
                self._socket.emit('user.update', {
                    socketId: user.socketId,
                    tags: user.tags,
                });
                self.r.$tagsInput.focus();
            }
        });
    },
    refreshTags: function(user) {
        var self = this;
        this.r.$tags.empty();
        user.tags.forEach(function(tag) {
            var $span = self.createTagEl(tag, function(e, tag) {
                var idx = user.tags.indexOf(tag);
                if (idx >= 0) {
                    user.tags.splice(idx, 1);
                    user.save();

                    // tag removed callback
                    self._socket.emit('user.update', {
                        socketId: user.socketId,
                        tags: user.tags,
                    });
                }
            });
            $('<input type="hidden"/>').addClass('tag').text(tag).appendTo($span);
        });
        this.r.$tags.append(self.r.$tagsInput);

        this.refreshTagList();
    },
    refreshTagsFilter: function() {
        var self = this;
        this.r.$tagsFilter.empty();
        this._tagsFilter.forEach(function(tag) {
            var $span = self.createTagEl(tag, function(e, tag) {
                var idx = self._tagsFilter.indexOf(tag);
                if (idx >= 0) {
                    self._tagsFilter.splice(idx, 1);
                }
                self.refreshTagsFilter();
            });
            self.r.$tagsFilter.append($span);
        });
        console.log('self._tagsFilter', this._tagsFilter);
        this.refreshMaps();
    },
    // Mapの表示/非表示の切り替え
    refreshMaps: function() {
        var self = this;
        Mps.log('refreshMaps', 'tagsFilter', this._tagsFilter);
        var isEmpty = (this._tagsFilter.length === 0);
        this._users.forEach(function(user) {
            if (isEmpty) {
                user.marker.isVisible = true;
            } else {
                var isTagExists = false;
                user.tags.forEach(function(tag) {
                    if (self._tagsFilter.indexOf(tag) >= 0) {
                        isTagExists = true;
                    }
                });
                Mps.log('refreshMaps', 'user:', user.socketId, 'isTagExists:', isTagExists);
                if (isTagExists) {
                    user.marker.isVisible = true;
                } else {
                    user.marker.isVisible = false;
                }
            }
        });
    },
    /**
     * @param {String} tag
     * @param {Function} removeCallback
     * @return {jQuery} span element
     */
    createTagEl: function(tag, removeCallback) {
        var $span = $('<span/>').addClass('tag').appendTo(this.r.$tags);
        $('<span/>').addClass('name').text(tag).appendTo($span);
        $('<span/>').addClass('remove').text('×').appendTo($span)
        .on('click', function(e) {
            $span.remove();
            removeCallback.call(this, e, tag);
        });

        return $span;
    },
    refreshTagList: function() {
        var self = this;
        this.r.$formFilterMenu.empty();

        this._users.forEach(function(user) {
            user.tags.forEach(function(tag) {
                $('<li>').text(tag).click(function(e) {
                    var $this = $(this);
                    var tag = $this.text();
                    if (self._tagsFilter.indexOf(tag) === -1) {
                        self._tagsFilter.push(tag);
                        self.refreshTagsFilter();
                    }
                }).appendTo(self.r.$formFilterMenu);
            });
        });
    },
    getUserBySocketId: function(socketId) {
        var user = null;
        this._users.forEach(function(user_) {
            if (user_.socketId === socketId) {
                user = user_;
                return false;
            }
        });

        return user;
    },
});

$(function() {
    var mps = Mps();
    if (Mps.DEBUG) {
        window.mps = mps;
    }
});
