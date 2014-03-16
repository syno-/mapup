
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
