/**
 * Created by balor on 16-01-15.
 */
jQuery.fn.contentChange = function (callback) {
    var elms = jQuery(this);
    elms.each(
        function (i) {
            var elm = jQuery(this);
            elm.data("lastContents", elm.html());
            window.watchContentChange = window.watchContentChange ? window.watchContentChange : [];
            window.watchContentChange.push({
                "element": elm,
                "callback": callback
            });
        }
    );
    return elms;
};

jQuery.fn.classChange = function (callback) {
    var elms = jQuery(this);
    elms.each(
        function (i) {
            var elm = jQuery(this);
            elm.data("lastClass", elm.attr('class'));
            window.watchClassChange = window.watchClassChange ? window.watchClassChange : [];
            window.watchClassChange.push({
                "element": elm,
                "callback": callback
            });
        }
    );
    return elms;
};

setInterval(function () {
    if (window.watchContentChange) {
        for (i in window.watchContentChange) {
            if (window.watchContentChange[i].element.data("lastContents") != window.watchContentChange[i].element.html()) {
                window.watchContentChange[i].callback.apply(window.watchContentChange[i].element);
                window.watchContentChange[i].element.data("lastContents", window.watchContentChange[i].element.html())
            }
            ;
        }
    }
    if (window.watchClassChange) {
        for (i in window.watchClassChange) {
            if (window.watchClassChange[i].element.data("lastClass") != window.watchClassChange[i].element.attr('class')) {
                window.watchClassChange[i].callback.apply(window.watchClassChange[i].element);
                window.watchClassChange[i].element.data("lastClass", window.watchClassChange[i].element.attr('class'))
            }
            ;
        }
    }
}, 500);