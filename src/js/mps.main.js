
/**
 *
 */
Mps.prototype.init = function() {

    // init maps
    this.r = {
        $map: $('#map'),
        $menu: $('#menu'),
        $menuContents: $('#menu-contents'),
        $btnFold: $('#btn-fold'),
        $socketDisconnect: $('#socket-disconnect'),
        $formUsername: $('#form-username'),
        $username: $('#form-username input[name="username"]'),
        $tags: $('#tags'),
        $tagsInput: $('#tags input[name="tags"]'),
        $formTags: $('#form-tags'),
        //$log: $('#log'),
        log: new Mps.Log('log', {
            limit: 100
        }),
        spin: Mps.Dialog('spin')
    };
    if (Mps.DEBUG) {
        window.r = this.r;
    }

    /**
     * ユーザの一覧
     */
    this._users = [];

    this.initMaps();
    this.initSocketio();
    this.initFinished();
};

Mps.prototype.initMaps = function() {
    this._map = new google.maps.Map(this.r.$map[0], {
        // Osaka
        center: new google.maps.LatLng(34.701909, 135.494977),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
};

Mps.prototype.initSocketio = function() {
    Mps.log('socketio');

    this._socket = io.connect(location.protocol + '//' + location.host + '/');
};

Mps.prototype.initFinished = function() {
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

    function addUser(userdata) {
        Mps.log('userdata=', userdata);
        var user = self.getUserBySocketId(userdata.socketId);
        if (!user) {
            userdata.map = self._map;
            user = new Mps.User(userdata).on('marker.click', function(e) {
                //self._map.setZoom(12);
                self._map.setCenter(this.marker.ref.getPosition());

                if (!user.infoWindow) {
                    user.infoWindow = new google.maps.InfoWindow({
                        //size: new google.maps.Size(250, 150)
                    });
                } else {
                    //google.maps.event.clearInstanceListeners(infoWindow);
                    //infoWindow.close();
                    //infoWindow = null;
                }
                user.infoWindow.setContent('username: ' + user.username + '\nID[' + user.socketId + ']');

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

            if (user.socketId === _socket.socket.transport.sessid) {
                Mps.log('The user is myself.');
                if (self._user) {
                    // 自分が既に存在する
                } else {
                    self._user = user;
                    self.initMyself(user);
                    self.r.log.add('あなたのIDは' + user.socketId + 'です。');
                }

                var sendUserdata = user.toUserdata();
                self._socket.emit('user.connect', sendUserdata);
            } else {
                Mps.log('other');
                self.r.log.add('ID[' + userdata.socketId + '] さんが接続しました。');
            }
            self._users.push(user);
            //Mps.log('接続方式: ' + _socket.socket.transport.name);
        } else {
            // TODO: 自分自身が接続しなおしたとき。
            // 自分自身
            //self.r.log.add('[' + userdata.socketId + '] 接続しました。');
            Mps.log('重複するユーザが検出されました。', userdata);
        }

        return user;
    }

    function removeUser(user) {
        var marker = user.marker.ref;
        if (marker) {
            marker.setMap(null);
        }
    }

    function removeAllUsers() {
        self._users.forEach(function(user) {
            removeUser(user);
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
    });

    _socket.on('user.connect', function(userdata) {
        Mps.log('user.connect', arguments);

        addUser(userdata);
    });
    _socket.on('user.disconnect', function(connection) {
        console.log('user.disconnect', arguments);
        self.r.log.add('ID[' + connection.id + '] さんが切断しました。');

        // delete user
        self._users = self._users.filter(function(user) {
            if (user.socketId !== connection.id) {
                return true;
            }
            removeUser(user);
            return false;
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
};

/**
 * initialize
 */
Mps.prototype.initMyself = function(user) {
    var self = this;

    user.on('tags.init', function(value) {
        Mps.log('tags.init: ', value);
        if (this.private) {
            refreshTags();
        }
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

    // Tags
    function addedTagCallback(tag) {
        // update/delete時のサーバへの送信
        self._socket.emit('user.update', {
            socketId: user.socketId,
            tags: user.tags,
        });
    }
    function removedTagCallback(tag) {
        self._socket.emit('user.update', {
            socketId: user.socketId,
            tags: user.tags,
        });
    }
    function refreshTags() {
        self.r.$tags.empty();
        user.tags.forEach(function(tag) {
            var $span = $('<span/>').addClass('tag').appendTo(self.r.$tags);
            $('<span/>').addClass('name').text(tag).appendTo($span);
            $('<span/>').addClass('remove').text('×').appendTo($span)
            .on('click', function(e) {
                $span.remove();

                var idx = user.tags.indexOf(tag);
                if (idx >= 0) {
                    user.tags.splice(idx, 1);
                    user.save();

                    removedTagCallback(tag);
                }
            });
            $('<input type="hidden"/>').addClass('tag').text(tag).appendTo($span);
        });
        self.r.$tags.append(self.r.$tagsInput);
    }
    this.r.$formTags.on('submit', function(e) {
        e.preventDefault();

        var tag = self.r.$tagsInput.val();
        self.r.$tagsInput.focus().val('');
        if (user.tags.indexOf(tag) === -1) {
            user.tags.push(tag);
            user.save();
            refreshTags();

            addedTagCallback(tag);
            self.r.$tagsInput.focus();
        }
    });
};

Mps.prototype.getUserBySocketId = function(socketId) {
    var user = null;
    this._users.forEach(function(user_) {
        if (user_.socketId === socketId) {
            user = user_;
            return false;
        }
    });

    return user;
};

$(function() {
    var mps = Mps();
    if (Mps.DEBUG) {
        window.mps = mps;
    }
});
