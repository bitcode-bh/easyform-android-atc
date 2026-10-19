/* Home and the two form pages run in a frame of their own inside the shell.
 *
 * Their scripts keep about 70 variables of page state, so they cannot share a document with
 * other pages: a second form would open with the first one's answers. A frame is a separate
 * script world, and removing it when the page is left throws all of that state away, so the
 * form code needs no change.
 *
 * Cordova is already running in the shell and keeps the native callbacks in this window, so the
 * frame is given the shell's cordova object instead of starting a second copy. This app defines
 * no Cordova JavaScript plugins (every plugin is a native class reached through cordova.exec),
 * so that object is all the frame needs. Results that come back for a call made in the frame
 * still run the frame's own callbacks.
 */
(function (w, d) {
    'use strict';
    if (w.AppFramePages) return;
    // Home and the two form pages. Any page can be added here; each stays on its own page load
    // until the server turns it on in ui_shell.pages.
    var pages = ['selection.html', 'viewsitedata.html', 'viewsitedata_task.html'];
    var sources = Object.create(null), instances = new WeakMap();

    function text(url) {
        if (!sources[url]) sources[url] = Promise.resolve(w.jQuery.ajax({ url: url, dataType: 'text', cache: true }))
            .catch(function (error) { delete sources[url]; throw error; });
        return sources[url];
    }

    // The page's own cordova.js tag would start a second Cordova whose callbacks never arrive.
    var cordovaTag = /<script\b[^>]*\bsrc\s*=\s*(["'])(?:[^"']*\/)?cordova(?:_plugins)?\.js(?:\?[^"']*)?\1[^>]*>\s*<\/script>/gi;
    function prepare(source) { return String(source).replace(cordovaTag, ''); }

    function event(doc, name) {
        var created = doc.createEvent('Event');
        created.initEvent(name, true, true);
        return created;
    }

    function define(name) {
        return {
            load: function () {
                return text(name).then(function (source) {
                    var html = prepare(source);
                    return {
                        supports: function () { return !!w.cordova && typeof w.cordova.exec === 'function'; },
                        create: function (document) {
                            var root = document.createElement('div'), frame = document.createElement('iframe');
                            root.className = 'app-frame-page';
                            frame.className = 'app-frame';
                            frame.setAttribute('title', 'Form');
                            root.appendChild(frame);
                            instances.set(root, { frame: frame });
                            return root;
                        },
                        open: function (context) {
                            var entry = instances.get(context.root), frame = entry.frame, win = frame.contentWindow, doc = win.document;
                            return new Promise(function (resolve, reject) {
                                var finished = false, timer;
                                function done(error) {
                                    if (finished) return;
                                    finished = true; clearTimeout(timer);
                                    if (error) reject(error); else resolve();
                                }
                                timer = setTimeout(function () { done(new Error('Form page timed out')); }, 15000);
                                frame.addEventListener('load', function () {
                                    if (finished) return;
                                    try {
                                        // Navigation inside the form is the shell's job, not the frame's.
                                        win.changeurl = function (url, direction) { return w.changeurl(url, direction); };
                                        win.addEventListener('error', function (e) { w.console.error('MWFM form page:', e.message); });
                                        // Cordova fired this once, in the shell, before the form existed.
                                        doc.dispatchEvent(event(doc, 'deviceready'));
                                        done();
                                    } catch (error) { done(error); }
                                });
                                try {
                                    win.cordova = w.cordova; win.Cordova = w.Cordova; win.PhoneGap = w.PhoneGap; win.phonegap = w.phonegap;
                                    doc.open();
                                    // The page reads its own file name from the address, so the frame reports the page it is.
                                    try { win.history.replaceState(null, '', context.route); } catch (e) { }
                                    doc.write(html);
                                    doc.close();
                                } catch (error) { done(error); }
                            });
                        },
                        // The form decides what Back means (close a popup, ask about unsaved answers, leave).
                        onBack: function (context) {
                            var entry = instances.get(context.root);
                            if (!entry || !entry.frame.contentWindow) return false;
                            var doc = entry.frame.contentWindow.document;
                            doc.dispatchEvent(event(doc, 'backbutton'));
                            return true;
                        },
                        dispose: function (context) {
                            var entry = instances.get(context.root);
                            if (!entry) return;
                            instances.delete(context.root);
                            // Navigating the frame away stops its timers and requests before the shell removes it.
                            try { entry.frame.src = 'about:blank'; } catch (e) { }
                        }
                    };
                });
            }
        };
    }

    w.AppFramePages = { pages: pages, prepare: prepare };
    if (w.AppShell) pages.forEach(function (name) { w.AppShell.register(name, define(name)); });
})(window, document);
