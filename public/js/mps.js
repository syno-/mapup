
if (typeof Mps === "undefined") {
    Mps = function() {
        if (!(this instanceof Mps)) {
            return new Mps();
        }
        //console.log(this);
        this.init.apply(this, arguments);

        return this;
    };

    /** デバッグフラグ。有効だとログが出力されます。 */
    Mps.DEBUG = true;

    Mps.log = (function(d) {
        var l = null;
        if (window.console && window.console.log && d) {
            try {
                if (console.log.bind) {
                    l = console.log.bind(console);
                }
            } catch (e) {
                // IE8 Document Mode?
            }
            if (l === null) {
                l = function() {
                    var s = null;
                    for (var i = 0; i < arguments.length; i++) {
                        if (s === null) {
                            s = arguments[i];
                        } else {
                            s = ' ' + arguments[i];
                        }
                    }
                    console.log(s);
                };
            }
        }
        if (l === null) {
            l = function(){};
        }
        return l;
    })(window.Mps.DEBUG);

    Mps.Queries = (function() {
        var queryStr = window.location.search;
        var result = {};
        if (queryStr.length <= 1) {
            return result;
        }
        var queries = queryStr.substring(1, queryStr.length).split('&');
        for (var i=0; i<queries.length; i++) {
            var query = queries[i].split('=');
            var key = decodeURIComponent(query[0]);
            var value = (query.length === 1) ? null : decodeURIComponent(query[1]);
            result[key] = value;
        }
        return result;
    })();
    Mps.log('Queries:', Mps.Queries);
} else {
    throw new Error('Mps already defined.');
}

    

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
 
  // The base Class implementation (does nothing)
  this.Class = function(){};
 
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
   
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
   
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);        
            this._super = tmp;
           
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
   
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
   
    // Populate our constructed prototype object
    Class.prototype = prototype;
   
    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;
 
    // And make this class extendable
    Class.extend = arguments.callee;
   
    return Class;
  };
})();

;
/**
 *
 * Usage: 
 * var log= new Mps.Log('log-element-id', {
 *     limit: 100
 * });
 * log.add('message');
 * log.add([
 *     'multiple',
 *     'message'
 * ]);
 *
 */
Mps.Log = (function() {
    "use strict";

    /**
     * Queue (FIFO)
     */
    var Queue = Class.extend({
        init: function() {
            this.__a = [];
        },
        enqueue: function(o) {
            this.__a.push(o);
        },
        dequeue: function() {
            if( this.__a.length > 0 ) {
                return this.__a.shift();
            }
            return null;
        },
        size: function() {
            return this.__a.length;
        },
        toString: function() {
            return '[' + this.__a.join(',') + ']';
        }
    });

    var Log = Queue.extend({
        init: function(logElementId, options) {
            this._super.apply(this, arguments);

            var elm = document.getElementById(logElementId);
            if (!elm) {
                throw new Error('This ID had element is not attached on document. ID=' + logElementId);
            }
            this._$ = $(elm);

            // setup options
            if (!options) {
                options = {};
            }
            if (!options.limit) {
                options.limit = 100;
            }
            this._options = options;
        },
        get: function() {
            return this._$;
        },
        add: function(o) {
            var msgs;
            if (typeof o === 'string') {
                msgs = [o];
            } else {
                msgs = o;
            }

            var self = this;

            // enqueue
            msgs.forEach(function(msg) {
                self.enqueue({
                    date: new Date(),
                    msg: msg
                });
            });

            // dequeue
            if (this.size() > this._options.limit) {
                var overflow = this._options.limit - this.size();
                for (var i = 0; i < overflow; i++) {
                    this.dequeue();
                }
            }

            // show
            this._$.empty();
            var a = this.__a.slice();
            var log;
            while ((log = a.pop())) {
                var $p = $('<p/>').appendTo(self._$);
                $('<span/>').text('[' + log.date.toISOString() + '] ').appendTo($p);
                //$('<br/>').appendTo($p);
                $('<span/>').text(log.msg).appendTo($p);
            }
        },
    });

    return Log;
})();
;
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

    var DialogProto = Class.extend({
        init: function(dlgId) {
            this._dlgId = dlgId;
        },
        initBootstrap: function() {
            this._$ = $('#' + this._dlgId);
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
        disconnected: DialogProto.extend({
            init: function(dlgId) {
                this._super.apply(this, arguments);
            }
        }),
    };

    return ctr;
})();
;
/**
 *
 * Get User location.
 *
 * Usage: 
 *
 *     Mps.Geo.current().done(function(ll) {
 *     }).fail(function(e) {
 *     });
 */
Mps.Geo = (function() {
    "use strict";

    var instance;

    var ctr = function Geo() {
        if (instance) {
            return instance;
        }
        instance = this;

        // init

        return instance;
    };

    /**
     * http://www.w3.org/TR/geolocation-API/#position_error_interface
     */
    ctr.PERMISSION_DENIED = 1;
    ctr.POSITION_UNAVAILABLE = 2;
    ctr.TIMEOUT = 3;

    ctr.BROWSER_NOT_SUPPORTED = -1;

    /**
     * Obtain current location.
     *
     * @param {PositionOptions} options http://www.w3.org/TR/geolocation-API/#position-options
     */
    ctr.current = function(options) {
        var d = $.Deferred();

        if (!options) {
            options = {
                timeout: 7000
            };
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
                Mps.log('success');
                d.resolve.call(d, pos);
            }, function(err) {
                Mps.log('fail');
                d.reject.apply(d, arguments);
            }, options);
        } else {
            var err = new Error('This browser not supported geolocation API.');
            err.code = -1;
            d.reject.call(d, err);
        }

        return d.promise();
    };

    return ctr;
})();
;
/**
 *
 * ユーザ管理用
 *
 */
Mps.Users = (function() {
    "use strict";

    /**
     * Queue (FIFO)
     */
    var Users = Class.extend({
        init: function() {
            this._users = [];
        },
    });

    return Users;
})();
;
/**
 *
 * Usage: 
 *
 */
Mps.User = (function() {
    "use strict";

    var EventObserver = Class.extend({
        _events: null,

        emit: function(eventName, args) {
            // collect
            var fireEventName;
            var fireEvents = [];
            var e;
            for (var i = 0, iL = this._events.length; i < iL; i++) {
                e = this._events[i];
                if (e.name === eventName) {
                    fireEventName = eventName;
                    fireEvents.push(e);
                }
            }

            // fire
            if (fireEvents.length > 0) {
                var newArgs = this._fireHooks(fireEventName, args); // 複数回実行されてしまう
                for (var j = 0, jL = fireEvents.length; j < jL; j++) {
                    e = fireEvents[j];
                    //console.trace();
                    //Quiks.log('event fired:', fireEventName, newArgs);
                    e.func.apply(this, newArgs);
                }
            }
        },
        _fireHooks: function(eventName, args) {
            return args;
        },
        /**
         * @param {String} name event name
         * @param {Function} func event callback
         */
        on: function(name, func) {
            this._events.push({
                name: name,
                func: func
            });

            return this;
        },
        off: function(name, func) {
            this._events = this._events.filter(function(event, i) {
                if (event.func === func) {
                    return false;
                }
                if (event.name === name) {
                    return false;
                }
                return true;
            });

            return this;
        },
        init: function() {
            this._events = [];
        }
    }); 

    /**
     * Queue (FIFO)
     */
    var User = EventObserver.extend({
        init: function(userdata) {
            this._super.apply(this, arguments);
            this._tags = [];
            this._username = null;
            var self = this;
            self._latlng = null;
            self._marker = null;
            self._private = false;
            Object.defineProperties(this, {
                "username": {
                    set: function(newValue) {
                        self._username = newValue;
                        self.emit('username.changed', [newValue]);
                    },
                    get: function() {
                        return self._username;
                    }
                },
                "tags": {
                    set: function(newValue) {
                        self._tags = newValue;
                        self.emit('tags.init', [newValue]);
                    },
                    get: function() {
                        return self._tags;
                    }
                },
                "socketId": {
                    value: null,
                    writable: true
                },
                "marker": {
                    value: {},
                    writable: false
                },
                "infoWindow": {
                    value: null,
                    writable: true
                },
                /**
                 * 自分自身かどうか。
                 * ドラッグの判定や、地図のピンの色へ影響。
                 */
                "private": {
                    set: function(newValue) {
                        self._private = newValue;
                        if (this.marker.ref) {
                            this.marker.ref.setDraggable(newValue);
                        }
                    },
                    get: function() {
                        return self._private;
                    }
                },
            });
            Object.defineProperties(this.marker, {
                "latlng": {
                    set: function(newValue) {
                        self._latlng = newValue;
                        if (this.ref) {
                            if (newValue) {
                                this.ref.setPosition(new google.maps.LatLng(newValue.lat, newValue.lng));
                            } else {
                                this.ref.setPosition(null);
                            }
                        }
                    },
                    get: function() {
                        return self._latlng;
                    }
                },
                "isVisible":{
                    set: function(newValue) {
                        self._marker.setVisible(newValue);
                    },
                    get: function() {
                        return self._marker.getVisible();
                    }
                },
                "ref": {
                    set: function(newValue) {
                        self._marker = newValue;
                    },
                    get: function() {
                        return self._marker;
                    }
                },
            });

            if (userdata.username) {
                this.username = userdata.username;
            }
            if (userdata.socketId) {
                this.socketId = userdata.socketId;
            }
            if (typeof userdata.private !== 'undefined') {
                this.private = userdata.private;
            }

            this._marker = User.createMarker(this);
            if (userdata.map) {
                this._marker.setMap(userdata.map);
            }
            if (userdata.marker) {
                this.marker.latlng = userdata.marker;
            }
        },
        save: function() {
            var json = JSON.stringify({
                username: this.username,
                marker: {
                    latlng: this.marker.latlng,
                },
                tags: this._tags,
            });
            localStorage.setItem('mps.user.myself', json);
            Mps.log('Saved myself: json=', json);
        },
        toUserdata: function() {
            return {
                'username': this.username,
                'socketId': this.socketId,
                'marker': this.marker.latlng,
                'tags': this._tags,
            };
        },
    });

    /**
     *
     */
    User.createMarker = function(user) {
        var self = this;

        var options = {};
        if (user.latlng) {
            options.position = new google.maps.LatLng(user.latlng.lat, user.latlng.lng);
        }
        if (typeof user.private !== 'undefined') {
            options.draggable = user.private;
        }
        //map: this._map,
        //title: 'Click to zoom'
        var marker = new google.maps.Marker(options);

        google.maps.event.addListener(marker, 'click', function(e) {
            user.emit('marker.click', arguments);
        });
        google.maps.event.addListener(marker, 'dragend', function(e) {
            user.emit('marker.dragend', arguments);
        });

        return marker;
    };

    /**
     *
     */
    User.loadMyself = function() {
        var item = null;
        try {
            item = JSON.parse(localStorage.getItem('mps.user.myself'));
        } catch (e) {
            Mps.log('Illegal userdata', e);
            localStorage.removeItem('mps.user.myself');
        }
        return item;
    };

    return User;
})();
;
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
                if (userdata.tags) {
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
    },
    initMyself: function(user) {
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
                var $span = createTagEl(tag, function(e, tag) {
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

            refreshTagList();
        }
        function refreshTagsFilter() {
            self.r.$tagsFilter.empty();
            self._tagsFilter.forEach(function(tag) {
                var $span = createTagEl(tag, function(e, tag) {
                    var idx = self._tagsFilter.indexOf(tag);
                    if (idx >= 0) {
                        self._tagsFilter.splice(idx, 1);
                    }
                    refreshTagsFilter();
                });
                self.r.$tagsFilter.append($span);
            });
            console.log('self._tagsFilter', self._tagsFilter);
            refreshMaps();
        }
        // Mapの表示/非表示の切り替え
        function refreshMaps() {
            Mps.log('refreshMaps', 'tagsFilter', self._tagsFilter);
            var isEmpty = (self._tagsFilter.length === 0);
            self._users.forEach(function(user) {
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
        }
        /**
         * @param {String} tag
         * @param {Function} removeCallback
         * @return {jQuery} span element
         */
        function createTagEl(tag, removeCallback) {
            var $span = $('<span/>').addClass('tag').appendTo(self.r.$tags);
            $('<span/>').addClass('name').text(tag).appendTo($span);
            $('<span/>').addClass('remove').text('×').appendTo($span)
            .on('click', function(e) {
                $span.remove();

                removeCallback.call(this, e, tag);
            });
            return $span;
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

        function refreshTagList() {
            self.r.$formFilterMenu.empty();

            self._users.forEach(function(user) {
                user.tags.forEach(function(tag) {
                    $('<li>').text(tag).click(onClickTag).appendTo(self.r.$formFilterMenu);
                });
            });
        }
        function onClickTag(e) {
            var $this = $(this);
            var tag = $this.text();
            if (self._tagsFilter.indexOf(tag) === -1) {
                self._tagsFilter.push(tag);
                refreshTagsFilter();
            }
        }
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
