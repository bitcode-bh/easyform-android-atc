const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup({ online = false, insertFails = false } = {}) {
    const rows = [], requests = [], store = new Map();
    const context = vm.createContext({
        navigator: { onLine: online },
        document: { addEventListener() {}, querySelector() { return null; } },
        localStorage: { getItem: key => store.get(key) || null,
            setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) },
        cordova: { exec(ok, fail, plugin, action, args) {
            const sql = args[0].data;
            if (sql.startsWith('INSERT')) {
                if (insertFails) return fail('disk full');
                rows.push({ id: rows.length + 1 });
            } else if (sql.startsWith('DELETE')) {
                const id = Number(sql.split('=')[1]);
                const index = rows.findIndex(row => row.id === id);
                if (index >= 0) rows.splice(index, 1);
            }
            ok(sql.startsWith('SELECT COUNT') ? JSON.stringify([{ c: rows.length }]) : JSON.stringify(rows));
        } },
        Webservicecall_REST: function (url, payload, success, failure) {
            this.callOtherDomain = () => requests.push({ success, failure });
        }
    });
    for (const name of ['lms_state.js', 'lms_data.js']) {
        vm.runInContext(fs.readFileSync(path.join(__dirname, '..', name), 'utf8'), context);
    }
    return { context, rows, requests };
}

for (const insertFails of [false, true]) {
    const { context, rows } = setup({ insertFails });
    let saved = 0, failed = 0;
    context.LmsData.postAction('/save', '[]', 'skill_videolog', () => saved++, () => failed++);
    assert.equal(saved, insertFails ? 0 : 1);
    assert.equal(failed, insertFails ? 1 : 0);
    assert.equal(rows.length, insertFails ? 0 : 1);
}

// A drop during an online request must apply the same persistence requirement.
for (const insertFails of [false, true]) {
    const { context, rows, requests } = setup({ online: true, insertFails });
    let saved = 0, failed = 0;
    context.LmsData.postAction('/save', '[]', 'skill_videolog', () => saved++, () => failed++);
    context.navigator.onLine = false;
    requests[0].failure('network dropped');
    assert.equal(saved, insertFails ? 0 : 1);
    assert.equal(failed, insertFails ? 1 : 0);
    assert.equal(rows.length, insertFails ? 0 : 1);
}

for (const responseText of ['[{"status":0}]', '[{"status":2}]', '{}', 'invalid']) {
    const { context, rows, requests } = setup({ online: true });
    rows.push({ id: 1 });
    context.LmsData.processOfflineQueue([{ id: 1, payload: '{"url":"/save","payload":"[]"}' }]);
    requests[0].success({ responseText });
    assert.equal(rows.length, 1, 'unacknowledged action must remain queued');
}

const { context, rows, requests } = setup({ online: true });
const records = [1, 2].map(id => ({ id, payload: '{"url":"/save","payload":"[]"}' }));
rows.push(...records);
context.LmsData.processOfflineQueue(records);
assert.equal(requests.length, 1, 'replay must remain sequential');
requests[0].success({ responseText: '[{"status":1}]' });
assert.deepEqual(rows.map(row => row.id), [2]);
assert.equal(requests.length, 2);
requests[1].success({ responseText: '[{"status":"1"}]' });
assert.equal(rows.length, 0);
console.log('LMS offline persistence and replay checks passed');
