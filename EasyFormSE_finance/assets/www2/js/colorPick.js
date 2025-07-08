/*!
*
* ColorPick jQuery plugin
* https://github.com/philzet/ColorPick.js
*
* Copyright (c) 2017 Phil Zet (a.k.a. Philipp Zakharchenko)
* Licensed under the MIT License
*
*/

(function ($) {

    $.fn.colorPick = function (config) {

        return this.each(function () {
            new $.colorPick(this, config || {});
        });

    };

    $.colorPick = function (element, options) {
        options = options || {};
        this.options = $.extend({}, $.fn.colorPick.defaults, options);
        if (options.str) {
            this.options.str = $.extend({}, $.fn.colorpickr.defaults.str, options.str);
        }
        this.color = this.options.initialColor;
        this.element = $(element);
        return this.element.hasClass(this.options.pickrclass) ? this : this.init();
    };

    $.fn.colorPick.defaults = {
        'initialColor': '#3498db',
        'allowRecent': true,
        'recentMax': 10,
        // 'palette': ["#1abc9c", "#16a085", "#2ecc71", "#27ae60", "#3498db", "#2980b9", "#9b59b6", "#8e44ad", "#34495e", "#2c3e50", "#f1c40f", "#f39c12", "#e67e22", "#d35400", "#e74c3c", "#c0392b", "#ecf0f1", "#bdc3c7", "#95a5a6", "#7f8c8d"],
        palette: [
            "#EF5350", "#F44336", "#E53935", "#D32F2F", "#C62828", "#B71C1C", "#FF5252", "#FF1744", "#D50000", "#EC407A",
            "#E91E63", "#D81B60", "#C2185B", "#AD1457", "#880E4F", "#FF4081", "#F50057", "#C51162", "#BA68C8", "#AB47BC",
            "#9C27B0", "#8E24AA", "#7B1FA2", "#6A1B9A", "#4A148C", "#E040FB", "#D500F9", "#AA00FF", "#9575CD", "#7E57C2",
            "#673AB7", "#5E35B1", "#512DA8", "#4527A0", "#311B92", "#7C4DFF", "#651FFF", "#6200EA", "#7986CB", "#5C6BC0",
            "#3F51B5", "#3949AB", "#303F9F", "#283593", "#1A237E", "#536DFE", "#3D5AFE", "#304FFE", "#1E88E5", "#1976D2",
            "#1565C0", "#0D47A1", "#448AFF", "#2979FF", "#2962FF", "#0288D1", "#0277BD", "#01579B", "#0091EA", "#0097A7",
            "#00838F", "#006064", "#26A69A", "#00897B", "#00796B", "#00695C", "#004D40", "#43A047", "#388E3C", "#2E7D32",
            "#1B5E20", "#558B2F", "#33691E", "#827717", "#E65100", "#F4511E", "#E64A19", "#D84315", "#BF360C", "#FF3D00",
            "#DD2C00", "#A1887F", "#8D6E63", "#795548", "#6D4C41", "#5D4037", "#4E342E", "#3E2723", "#757575", "#616161",
            "#424242", "#212121", "#000000", "#78909C", "#607D8B", "#546E7A", "#455A64", "#37474F", "#444444", "#4c1130"
        ],
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': this.color, 'color': this.color });
        }
    };

    $.colorPick.prototype = {

        init: function () {
            var self = this;
            var o = this.options;

            $.proxy($.fn.colorPick.defaults.onColorSelected, this)();

            this.element.click(function (event) {
                event.preventDefault();
                self.show(event.pageX, event.pageY);

                $('.colorPickButton').click(function (event) {
                    self.color = $(event.target).attr('hexValue');
                    self.appendToStorage($(event.target).attr('hexValue'));
                    self.hide();
                    $.proxy(self.options.onColorSelected, self)();
                    return false;
                });

                return false;
            }).blur(function () {
                self.element.val(self.color);
                $.proxy(self.options.onColorSelected, self)();
                self.hide();
                return false;
            });

            $(document).click(function (event) {
                self.hide();
                return true;
            });

            return this;
        },

        appendToStorage: function (color) {
            if ($.fn.colorPick.defaults.allowRecent === true) {
                var storedColors = JSON.parse(localStorage.getItem("colorPickRecentItems"));
                if (storedColors == null) {
                    storedColors = [];
                }
                if ($.inArray(color, storedColors) == -1) {
                    storedColors.unshift(color);
                    storedColors = storedColors.slice(0, $.fn.colorPick.defaults.recentMax)
                    localStorage.setItem("colorPickRecentItems", JSON.stringify(storedColors));
                }
            }
        },

        show: function (left, top) {
            $("body").append('<div id="colorPick" style="display:none;top:' + top + 'px;left:' + left + 'px"><span>Default palette:</span></div>');
            jQuery.each($.fn.colorPick.defaults.palette, (index, item) => {
                $("#colorPick").append('<div class="colorPickButton" hexValue="' + item + '" style="background:' + item + '"></div>');
            });
            if ($.fn.colorPick.defaults.allowRecent === true) {
                $("#colorPick").append('<span style="margin-top:5px">Recent:</span>');
                if (JSON.parse(localStorage.getItem("colorPickRecentItems")) == null || JSON.parse(localStorage.getItem("colorPickRecentItems")) == []) {
                    $("#colorPick").append('<div class="colorPickButton colorPickDummy"></div>');
                } else {
                    jQuery.each(JSON.parse(localStorage.getItem("colorPickRecentItems")), (index, item) => {
                        $("#colorPick").append('<div class="colorPickButton" hexValue="' + item + '" style="background:' + item + '"></div>');
                    });
                }
            }
            $("#colorPick").fadeIn(200);
        },

        hide: function () {
            $("#colorPick").fadeOut(200, function () {
                $("#colorPick").remove();
                return this;
            });
        },

    };

}(jQuery));
