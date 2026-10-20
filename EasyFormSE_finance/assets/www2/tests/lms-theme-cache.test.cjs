const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const www = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(www, 'LMS_Dashboard.html'), 'utf8');

test('the shipped Framework7 theme is for the app\'s colours and loads after Framework7, before the app is made', () => {
    const f7 = page.indexOf('LMS/Framework7_9.0.3.js'), theme = page.indexOf('LMS/f7_theme_css.js'), made = page.indexOf('new Framework7(');
    assert.ok(f7 > 0 && theme > f7 && made > theme);
    const w = {};
    vm.runInNewContext(fs.readFileSync(path.join(www, 'LMS/f7_theme_css.js'), 'utf8'), { window: w });
    const keys = Object.keys(w.F7_THEME_CSS);
    assert.equal(keys.length, 1);
    assert.ok(keys[0].startsWith('[{"primary":"#007aff"'), 'the colours Framework7 starts with');
    assert.ok(w.F7_THEME_CSS[keys[0]].length > 10000 && w.F7_THEME_CSS[keys[0]].startsWith(':root{'));
});

test('setColors uses the known theme, then a kept one, and only works it out when neither exists', () => {
    const block = page.slice(page.indexOf('(function () {\n            if (typeof Framework7'), page.indexOf('var myApp = new Framework7('));
    let built = 0;
    const store = {};
    const styleNode = () => ({ textContent: '' });
    const doc = { createElement: styleNode, head: { prepend() { } } };
    function App() { this.colors = { primary: '#007aff' }; this.mdColorScheme = 'default'; }
    App.prototype.setColors = function () { built++; this.colorsStyleEl = styleNode(); this.colorsStyleEl.textContent = 'worked-out'; };
    const w = { F7_THEME_CSS: { [JSON.stringify([{ primary: '#007aff' }, 'default'])]: 'shipped' } };
    const ctx = { Framework7: App, window: w, document: doc, localStorage: { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; } } };
    vm.runInNewContext(block, ctx);
    const a = new App(); a.setColors();
    assert.equal(a.colorsStyleEl.textContent, 'shipped'); assert.equal(built, 0);
    // other colours: worked out once, kept, then reused
    const b = new App(); b.colors = { primary: '#123456' }; b.setColors();
    assert.equal(built, 1); assert.equal(b.colorsStyleEl.textContent, 'worked-out');
    const c = new App(); c.colors = { primary: '#123456' }; c.setColors();
    assert.equal(built, 1, 'second time comes from the kept copy'); assert.equal(c.colorsStyleEl.textContent, 'worked-out');
});
