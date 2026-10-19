const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Page controllers fall back to the global jQuery when none is passed in. That fallback was a
// bare function, so $.isArray and the other helpers did not exist and the online task list
// failed with "$.isArray is not a function" the first time it drew a row.
const files = ['EFSE_Js/viewsitelist_pm.js', 'EFSE_Js/selection.js', 'EFSE_Js/viewsitelist_pm_grouplist.js',
    'EFSE_Js/viewsitelist_pm_on.js', 'EFSE_Js/selection_survey.js', 'EFSE_Js/Upload_Option_Get_List.js',
    'EFSE_Js_Server/server_viewsitelist.js'];
const line = /var \$ = options\.\$ \|\| new Proxy\([^\n]*\);/;

test('every controller defaults to a $ that still has jQuery helpers', () => {
    for (const f of files) {
        const text = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
        assert.ok(line.test(text), f + ' must use the forwarding default');
        assert.ok(!/options\.\$ \|\| function/.test(text), f + ' still has the bare-function default');
    }
});

test('the forwarding default calls jQuery and exposes its helpers, even if jQuery is replaced later', () => {
    const text = fs.readFileSync(path.join(__dirname, '../EFSE_Js/viewsitelist_pm_on.js'), 'utf8');
    const statement = text.match(line)[0];
    const calls = [];
    const w = { $: Object.assign(function (selector) { calls.push(selector); return { selected: selector }; },
        { isArray: Array.isArray, each: (a, fn) => a.forEach(fn) }) };
    const context = vm.createContext({ w, Proxy });
    const $ = vm.runInContext('(function (options) { ' + statement + ' return $; })({})', context);
    assert.deepEqual($('#list'), { selected: '#list' });
    assert.equal($.isArray([1]), true);
    assert.equal($.isArray('x'), false);
    const seen = []; $.each([1, 2], v => seen.push(v)); assert.deepEqual(seen, [1, 2]);
    w.$ = Object.assign(function () { return 'new'; }, { isArray: () => 'replaced' });
    assert.equal($(), 'new', 'follows the current global jQuery');
    assert.equal($.isArray(), 'replaced');
});
