
/**
 *
 * Usage: 
 *
 */
Mps.EventObserver = (function() {
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

    return EventObserver;
})();
