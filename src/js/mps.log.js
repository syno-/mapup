
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
