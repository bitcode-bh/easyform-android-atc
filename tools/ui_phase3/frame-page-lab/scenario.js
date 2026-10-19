(async function () {
    var out = {}, sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    var adapter = await registered['viewsitedata.html'].load();
    async function open(route) {
        var ctx = { route: route, root: null };
        var root = adapter.create(document, ctx); ctx.root = root;
        document.body.appendChild(root);
        await adapter.open(ctx);
        return ctx;
    }
    var a = await open('viewsitedata.html?task_id=7'), wa = a.root.querySelector('iframe').contentWindow;
    out.registeredBoth = Object.keys(registered).sort().join(',');
    out.supports = adapter.supports(a);
    out.cordovaShared = wa.cordova === window.cordova;
    out.pageOwnCordovaStripped = wa.secondCordova === undefined;
    out.pageDependencyLoaded = wa.depLoaded === true;
    out.pathSeen = wa.pathSeen; out.search = wa.location.search;
    out.deviceReady = wa.deviceReadySeen === true;
    await sleep(60); out.execResult = wa.execResult;
    out.onBackHandled = adapter.onBack(a); out.backSeen = wa.backSeen;
    wa.document.getElementById('leave').click();
    out.navigations = JSON.stringify(window.navigations);
    out.firstOpenedWith = wa.opened_with; out.firstAnswer = wa.formAnswer;
    adapter.dispose(a); a.root.remove();
    var b = await open('viewsitedata.html'), wb = b.root.querySelector('iframe').contentWindow;
    out.secondOpenedWith = wb.opened_with; out.secondIsolated = wb !== wa && wb.formAnswer === 'typed-in-viewsitedata.html';
    out.sharedStorage = (function () { localStorage.setItem('k', 'v'); return wb.localStorage.getItem('k'); })();
    adapter.dispose(b); b.root.remove();
    out.afterDisposeNoFrames = document.querySelectorAll('iframe').length;
    out.prepare = JSON.stringify([
        AppFramePages.prepare('<script src="cordova.js"></script><p>x</p>'),
        AppFramePages.prepare("<script type='text/javascript' src='../cordova.js?v=2'></script>"),
        AppFramePages.prepare('<script src="js/cordova_plugins.js"></script>'),
        AppFramePages.prepare('<script src="EFSE_Js/not_cordova.js"></script>'),
        AppFramePages.prepare('<script src="cordova-extra.js"></script>')]);
    return JSON.stringify(out);
})()
