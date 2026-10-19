const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/app_chrome.js'), 'utf8');

function load(storage = {}) {
    const w = { localStorage: { getItem: key => (key in storage ? storage[key] : null) }, console };
    w.window = w;
    vm.runInContext(source, vm.createContext({ window: w, document: {}, Object, Array, String, Math }));
    return w;
}

test('icon characters are read from the computed content value, whichever way Chrome writes it', () => {
    const { glyphText } = load().AppChrome;
    assert.equal(glyphText('""'), '');
    assert.equal(glyphText('"" / ""'), '');
    assert.equal(glyphText("''"), '');
    assert.equal(glyphText('"\\f021"'), '');
    assert.equal(glyphText('none'), '');
    assert.equal(glyphText('normal'), '');
    assert.equal(glyphText(''), '');
    assert.equal(glyphText('counter(x)'), '');
});

test('the shared bars can be switched off on a phone', () => {
    assert.equal(load().AppChrome.enabled(), true);
    assert.equal(load({ mwfm_chrome_off: '1' }).AppChrome.enabled(), false);
    const off = load({ mwfm_chrome_off: '1' }).AppChrome.attach({}, {});
    assert.equal(typeof off.detach, 'function');
});

test('the shell loads the bars and the frame adapter hands each page to them', () => {
    const common = fs.readFileSync(path.join(root, 'EFSE_Js/common-functions.js'), 'utf8');
    assert.match(common, /js\/app_chrome\.js/);
    const adapter = fs.readFileSync(path.join(root, 'js/app_frame_pages.js'), 'utf8');
    assert.match(adapter, /AppChrome\.attach\(win, frame\)/);
    assert.match(adapter, /chrome\.detach\(\)/);
});

test('a bar with live controls in it is left to the page', () => {
    assert.match(source, /LIVE = 'input,textarea,select/);
    assert.match(source, /source\.querySelector\(LIVE\)\) return null/);
});

test('the upload badge reads "N waiting to upload" and is empty when nothing is waiting', () => {
    const { syncLabel } = load().AppChrome;
    assert.equal(syncLabel({ total: 3 }), '3 waiting to upload');
    assert.equal(syncLabel({ total: 1 }), '1 waiting to upload');
    for (const none of [{ total: 0 }, {}, null, undefined, { total: 'x' }, { total: -2 }]) assert.equal(syncLabel(none), '');
});
