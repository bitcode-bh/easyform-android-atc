const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const common = fs.readFileSync(path.join(root, 'EFSE_Js/common-functions.js'), 'utf8');
const login = fs.readFileSync(path.join(root, 'EFSE_Js/login.js'), 'utf8');
function fn(source, name) {
    const start = source.indexOf('function ' + name + '(');
    const end = source.indexOf('\n}', start) + 2;
    return source.slice(start, end);
}
const dialogs = [], effects = [];
const context = vm.createContext({
    myApp: {alert: (message, title) => dialogs.push({message, title}), closeModal: name => effects.push(name)},
    loading_hide: () => effects.push('hide-loader'),
    alert1: message => dialogs.push({message})
});
vm.runInContext(fn(common, 'show_request_failure'), context);
vm.runInContext(fn(common, 'onfail_logout_on_click_online'), context);
vm.runInContext(fn(login, 'onfail'), context);
for (const callback of [context.onfail, context.onfail_logout_on_click_online]) {
    for (const [error, title, message] of [
        [{type: 'network', reason: 'offline'}, 'Network Error', 'No internet'],
        [{type: 'network', reason: 'dns'}, 'Network Error', 'could not find'],
        [{type: 'network', reason: 'connection'}, 'Network Error', 'interrupted'],
        [{type: 'server', reason: 'http', httpStatus: 503}, 'Server Communication Error', 'HTTP 503'],
        [{type: 'server', reason: 'timeout'}, 'Server Communication Error', 'timed out'],
        [{type: 'server', reason: 'tls'}, 'Server Communication Error', 'secure connection'],
        [{type: 'server', reason: 'response'}, 'Server Communication Error', 'invalid response'],
        [{type: 'authentication', reason: 'validation'}, 'Login Error', 'sign-in confirmation'],
        [{type: 'request', reason: 'internal'}, 'Request Error', 'could not be completed'],
        [null, 'Server Communication Error', 'Unable to communicate'],
        ['legacy failure payload', 'Server Communication Error', 'Unable to communicate'],
        [JSON.stringify({type: 'network', reason: 'offline'}), 'Network Error', 'No internet']
    ]) {
        dialogs.length = 0;
        effects.length = 0;
        callback(error);
        assert.equal(dialogs.length, 1, 'Only one popup per failure');
        assert.equal(dialogs[0].title, title);
        assert.ok(dialogs[0].message.includes(message));
        assert.equal(effects.filter(e => e === 'hide-loader').length, 1);
    }
}
context.show_request_failure({type: 'server', reason: 'http', httpStatus: '<private>', message: 'sensitive payload'});
assert.ok(!dialogs.at(-1).message.includes('sensitive'));
assert.ok(!dialogs.at(-1).message.includes('<private>'));
console.log('Login/logout error categories, safe messages, loader cleanup and single-popup checks passed');
