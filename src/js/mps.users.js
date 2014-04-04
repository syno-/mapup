
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
