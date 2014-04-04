
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
