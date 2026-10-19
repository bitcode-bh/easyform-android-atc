/* Eager app/view setup without the unused kitchen-sink demo widgets. */
(function (w, d) {
    'use strict';
    var material = w.F7_device === 'android';
    var options = material ? {
        modalTitle: 'Framework7', material: true, animationPages: false,
        materialRipple: true, tapHold: true, fastClicks: false
    } : { modalTitle: 'Framework7', animateNavBackIcon: true };
    // App Back controls use onclick/changeurl without href. Let their existing
    // handler run without Framework7 also trying to route a null URL.
    options.ajaxLinks = 'a[href]';
    w.myApp = new w.Framework7(options);
    w.$$ = w.Dom7;
    function addView(selector) {
        return d.querySelector(selector) ? w.myApp.addView(selector, material ? {} : { dynamicNavbar: true }) : undefined;
    }
    w.mainView = addView('.view-main');
    w.rightView = addView('.view-right');
})(window, document);
