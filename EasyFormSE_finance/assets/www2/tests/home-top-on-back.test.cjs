const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const common = fs.readFileSync(path.join(__dirname, '../EFSE_Js/common-functions.js'), 'utf8');
const helper = common.slice(common.indexOf('function go_home_top'), common.indexOf('function alert1'));

test('going back to Home clears the remembered module level, then opens Home', () => {
    const written = {}, navigations = [];
    const context = vm.createContext({
        storage: { setItem: (k, v) => { written[k] = v; } },
        changeurl: (url, direction) => navigations.push([url, direction]), JSON,
    });
    vm.runInContext(helper + '; go_home_top();', context);
    for (const key of ['curr_btn_mode', 'id_Array', 'level_Array', 'list_json', 'cust_flow_Array']) {
        assert.equal(written[key], '""', key + ' is cleared');
    }
    assert.deepEqual(navigations, [['selection.html', 'back']]);
});

test('a failing storage write does not stop the navigation', () => {
    const navigations = [];
    const context = vm.createContext({ storage: { setItem: () => { throw new Error('full'); } },
        changeurl: (url, direction) => navigations.push([url, direction]), JSON });
    vm.runInContext(helper + '; go_home_top();', context);
    assert.deepEqual(navigations, [['selection.html', 'back']]);
});

test('every back-to-Home path in the common functions uses the helper', () => {
    const body = common.replace(helper, '');
    assert.ok(!/changeurl\("selection\.html", 'back'\)/.test(body), 'no direct back navigation to Home is left');
    assert.ok((body.match(/go_home_top\(\)/g) || []).length >= 8);
});

test('the shell falls back through the helper when its history is empty', () => {
    for (const f of ['js/app_shell.js', 'js/app_components.js']) {
        const text = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
        assert.ok(text.includes('w.go_home_top'), f);
    }
});
