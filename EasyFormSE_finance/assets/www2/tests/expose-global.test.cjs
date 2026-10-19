const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// A function declared by another script is a non-configurable global. Redefining it with
// Object.defineProperty threw "Cannot redefine property" and stopped the copy loop, so every
// later page function (module list, tabs, greeting) was left undefined on Home.
const files = ['selection.js', 'viewsitelist_pm.js', 'viewsitelist_pm_grouplist.js', 'selection_survey.js',
    'viewsitelist_pm_on.js', 'Upload_Option_Get_List.js'];
const statement = /try \{ Object\.defineProperty\(w, name, Object\.getOwnPropertyDescriptor\(legacy, name\)\); \} catch \(error\) \{ w\[name\] = legacy\[name\]; \}/;

test('every page script copies its controller with a fallback for names already declared as globals', () => {
    for (const f of files) {
        const text = fs.readFileSync(path.join(__dirname, '../EFSE_Js', f), 'utf8');
        assert.ok(statement.test(text), f + ' must fall back to assignment');
        assert.ok(!/Object\.defineProperty\(w, name, Object\.getOwnPropertyDescriptor\(legacy, name\)\)(?!; \} catch)/.test(text), f + ' has an unguarded defineProperty');
    }
});

test('the copy statement keeps going past a name that is already a global function', () => {
    const context = vm.createContext({});
    vm.runInContext('function exit_app() { return "old"; }', context);
    const real = fs.readFileSync(path.join(__dirname, '../EFSE_Js/selection.js'), 'utf8')
        .match(/try \{ Object\.defineProperty\(w, name, Object\.getOwnPropertyDescriptor\(legacy, name\)\); \} catch \(error\) \{ w\[name\] = legacy\[name\]; \}/)[0];
    vm.runInContext('var w = globalThis; var legacy = { exit_app: function () { return "new"; }, home_tab_click: function () { return "tab"; }, crossToLMS: function () { return "lms"; } };' +
        'Object.keys(legacy).forEach(function (name) { ' + real + ' });', context);
    assert.equal(vm.runInContext('exit_app()', context), 'new', 'the controller version wins');
    assert.equal(vm.runInContext('home_tab_click()', context), 'tab', 'names after the clash are still defined');
    assert.equal(vm.runInContext('crossToLMS()', context), 'lms');
});
