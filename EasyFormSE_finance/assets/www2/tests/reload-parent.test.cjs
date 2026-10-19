const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const common = fs.readFileSync(path.join(__dirname, '../EFSE_Js/common-functions.js'), 'utf8');
const helper = common.slice(common.indexOf('function reload_parent_page'), common.indexOf('function alert1'));

function run(holder) {
    const context = vm.createContext({ window: { parent: holder } });
    vm.runInContext(helper + '; reload_parent_page();', context);
}

test('a page in an ordinary frame reloads its parent as before', () => {
    let reloaded = 0;
    run({ location: { reload: () => reloaded++ } });
    assert.equal(reloaded, 1);
});

test('a parent that runs in a shell frame is reopened through the shell, not reloaded', () => {
    const opened = []; let reloaded = 0;
    run({ frameElement: { classList: { contains: c => c === 'app-frame' } },
        parent: { changeurl: url => opened.push(url) },
        location: { pathname: '/android_asset/www2/selection.html', search: '?x=1', reload: () => reloaded++ } });
    assert.deepEqual(opened, ['selection.html?x=1']);
    assert.equal(reloaded, 0);
});

test('no page script reloads its parent directly any more', () => {
    for (const f of ['EFSE_Js/online_checksheet.js', 'EFSE_Js/EF_User_List.js']) {
        const text = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
        assert.ok(!/^[^/\n]*window\.parent\.location\.reload\(\)/m.test(text), f);
    }
});
