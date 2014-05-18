
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

    Mps.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia).bind(navigator);
    Mps.URL = (window.URL || window.webkitURL).bind(window);

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

