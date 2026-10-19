const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../js/app_frame_pages.js'), 'utf8');

function load(shell) {
    const registered = {};
    const w = { jQuery: {}, console, AppShell: { register: (name, def) => { registered[name] = def; } } };
    if (shell === false) delete w.AppShell;
    vm.runInContext(source, vm.createContext({ window: w, document: {}, Promise }));
    return { w, registered };
}

test('every page except Login and the two list pages registers with the shell', () => {
    const { registered } = load();
    const names = Object.keys(registered);
    assert.equal(names.length, 24);
    for (const n of ['Login.html', 'selection_survey.html', 'viewsitelist_pm_grouplist.html']) assert.equal(names.includes(n), false, n);
    for (const n of ['selection.html', 'LMS_Dashboard.html', 'viewsitedata.html']) assert.equal(names.includes(n), true, n);
    for (const def of Object.values(registered)) assert.equal(typeof def.load, 'function');
});

test('the page may load without a shell (a form running inside a frame)', () => {
    const { w, registered } = load(false);
    assert.deepEqual(Object.keys(registered), []);
    assert.equal(typeof w.AppFramePages.prepare, 'function');
});

test('prepare removes the page\'s own Cordova tags and nothing else', () => {
    const { w } = load();
    const p = w.AppFramePages.prepare;
    assert.equal(p('<script src="cordova.js"></script><p>x</p>'), '<p>x</p>');
    assert.equal(p("<script type='text/javascript' src='../cordova.js?v=2'></script>"), '');
    assert.equal(p('<script src="js/cordova_plugins.js"></script>'), '');
    assert.equal(p('<script src="EFSE_Js/not_cordova.js"></script>'), '<script src="EFSE_Js/not_cordova.js"></script>');
    assert.equal(p('<script src="cordova-extra.js"></script>'), '<script src="cordova-extra.js"></script>');
    assert.equal(p('<script src="a.js"></script>\n<script src="cordova.js"></script>\n<script src="b.js"></script>'),
        '<script src="a.js"></script>\n\n<script src="b.js"></script>');
});

test('the shell scripts are not loaded again inside a form frame', () => {
    const text = fs.readFileSync(path.join(__dirname, '../EFSE_Js/common-functions.js'), 'utf8');
    const start = text.indexOf('var inShellFrame');
    const block = text.slice(start, text.indexOf('}', text.indexOf('document.write', start)) + 1);
    assert.ok(block.includes("classList.contains('app-frame')"));
    assert.ok(/inShellFrame \? ''/.test(block), 'the shell scripts are skipped inside a frame');
    assert.ok(block.includes('js/phase1_ui.js'), 'notices and press feedback still load in the frame');
});

test('every Java object injected into the web page is shared with the frame', () => {
    const java = fs.readFileSync(path.join(__dirname, '../../../../CordovaLib/src/org/apache/cordova/CordovaActivity.java'), 'utf8');
    const injected = [...java.matchAll(/addJavascriptInterface\([\s\S]*?\},\s*"(\w+)"\)/g)].map(m => m[1]);
    assert.ok(injected.length >= 1, 'found the injected objects in the Java source');
    const { w } = load();
    for (const name of injected) assert.ok(w.AppFramePages.native.includes(name), name + ' must be shared into the frame');
    assert.ok(w.AppFramePages.native.includes('_cordovaNative'));
});
