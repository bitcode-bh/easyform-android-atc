const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Saved list rows are plain HTML in localStorage. Logout must remove them, not wait for the next login.
test('logout success removes the saved list rows before leaving the page', () => {
    const text = fs.readFileSync(path.join(__dirname, '../EFSE_Js/common-functions.js'), 'utf8');
    const start = text.indexOf('function onsuccess_logout_on_click_online');
    const body = text.slice(start, text.indexOf('function onfail_logout_on_click_online'));
    assert.ok(body.includes("localStorage.removeItem('mwfm_phase1_lists')"));
    assert.ok(body.indexOf("removeItem('mwfm_phase1_lists')") < body.indexOf('changeurl("Login.html")'));
});

test('the saved-lists key used by the script is the one removed at logout', () => {
    const lists = fs.readFileSync(path.join(__dirname, '../js/phase1_lists.js'), 'utf8');
    assert.ok(lists.includes("key = 'mwfm_phase1_lists'"));
});
