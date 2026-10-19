const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve('EasyFormSE_finance/assets/www2');
const files = ['EFSE_Js/common-functions.js', 'EFSE_Js/selection.js', 'EFSE_Js/SubmitSurveyData.js',
    'EFSE_Js/online_checksheet.js', 'EFSE_Js/group_task.js', 'EFSE_Js/viewsitelist_pm_CommentUI.js',
    'EFSE_Js/get_numeric_box.js', 'EFSE_Js/login.js', 'EFSE_Js/EF_Custom_Reports.js', 'EFSE_Js/feature_kyff.js',
    'EFSE_Js/ReadCheckSheet.js', 'EFSE_Js/SubmitFlow_PM.js', 'EFSE_Js/viewsitelist_pm.js', 'EFSE_Js/EF_Control_Comment.js',
    'EFSE_Js/CapturePhoto.js', 'EFSE_Js/capture_button_signature.js', 'EFSE_Js/get_upload_video.js', 'EFSE_Js/get_upload_pdf.js'];
function harness(order) {
    const noop = () => {};
    const chain = new Proxy(function () {}, { get: (_, key) => key === 'length' ? 0 : chain, apply: () => chain });
    const notices = [], native = [];
    const document = { readyState: 'loading', addEventListener: noop, write: noop, querySelector: () => null,
        querySelectorAll: () => [], documentElement: { className: '' }, body: {} };
    const context = vm.createContext({ document, console, navigator: {}, addEventListener: noop,
        localStorage: { getItem: () => null, setItem: noop }, storage: { getItem: () => 'null', setItem: noop },
        MutationObserver: function () { this.observe = noop; }, setTimeout: noop, setInterval: noop, clearTimeout: noop,
        clearInterval: noop, $: chain, jQuery: chain, location: { pathname: '/selection.html' },
        cordova: { exec: (...args) => native.push(args) } });
    context.window = context;
    for (const file of order) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
    context.alert1 = message => notices.push(message);
    context.loading_hide = () => { context.hides = (context.hides || 0) + 1; };
    return { context, notices, native };
}
for (const reverse of [false, true]) {
    test('database and native failures remain isolated in ' + (reverse ? 'reverse' : 'normal') + ' load order', () => {
        const { context: c, notices, native } = harness(reverse ? [...files].reverse() : files);
        assert.equal(typeof c.onfail, 'undefined', 'there is no ambiguous shared callback');
        c.onfail_home_values('database unavailable');
        assert.match(String(notices.pop()), /selection_showValuesFailCallBack/);
        c.step_Array = [8]; c.storage.getItem = () => '123';
        c.onfail_survey_values('database unavailable');
        assert.match(String(notices.pop()), /Checksheet ID: 123, Step ID: 8/);
        c.onfail_request('request unavailable');
        assert.equal(notices.pop(), 'request unavailable');
        assert.ok(c.hides >= 3);
        c.get_ar_measurement('height', 'cm', '');
        assert.equal(native.at(-1)[1], c.onfail_numeric_plugin);
        assert.equal(native.at(-1)[2], 'ARMeasure');
        assert.notEqual(c.onfail_numeric_plugin, c.onfail_plugin);
        for (const name of ['onfail_login', 'onfail_custom_report', 'onfail_kyff', 'onfail_group_task', 'onfail_online_checksheet', 'onfail_task_comment']) {
            assert.equal(typeof c[name], 'function', name + ' retains its owner');
            assert.notEqual(c[name], c.onfail_request);
        }
    });
}

for (const reverse of [false, true]) {
    test('shared helpers and weather recovery survive ' + (reverse ? 'reverse' : 'normal') + ' load order', () => {
        const { context: c, native } = harness(reverse ? [...files].reverse() : files);
        assert.equal(c.getFormattedDate(new Date(2026, 9, 18)), '2026/10/18');
        assert.equal(c.isEmpty({}), true); assert.equal(c.isEmpty({ answer: 1 }), false);
        assert.equal(c.isEmpty([]), false);
        const writes = []; c.storage.setItem = (key, value) => writes.push([key, value]);
        c.view_weather_for_site(28, 77);
        const request = native.at(-1);
        assert.equal(request[2], 'weather_plug');
        assert.equal(request[1], c.onfail_view_weather_for_site);
        request[1]('user cancelled');
        assert.deepEqual(writes.at(-1), ['crash_status', '"0"']);
        assert.equal(typeof c.isTaskCommentEmail, 'function');
        assert.equal(c.isTaskCommentEmail('user@example.invalid'), true);
        assert.equal(c.IsEmail('invalid'), false);
        assert.notEqual(c.formatControlCommentTime, c.formatAMPM);
    });
}

for (const reverse of [false, true]) {
    test('interleaved media callbacks keep their own insert/update state in ' + (reverse ? 'reverse' : 'normal') + ' load order', () => {
        const { context: c } = harness(reverse ? [...files].reverse() : files);
        c.onPhotoDataSuccess = () => {}; c.onPhotoDataSuccess_sign = () => {}; c.onsuccess_capture_video = () => {};
        c.onsuccess_check_photo_entry(100);
        c.onfail_check_photo_entry('new photo');
        c.onsuccess_check_photo_entry_sign(200);
        c.onsuccess_check_video_entry(300);
        assert.equal(c.curr_photo_id, 100); assert.equal(c.curr_query_type, 'insert');
        assert.equal(c.signature_photo_id, 200); assert.equal(c.signature_query_type, 'update');
        assert.equal(c.curr_video_id, 300); assert.equal(c.video_query_type, 'update');
        c.onfail_check_video_entry('new video');
        assert.equal(c.signature_query_type, 'update'); assert.equal(c.video_query_type, 'insert');
        const values = { list_json: JSON.stringify([{ pdf_type: 1 }]), global_url: 'https://example.invalid/services/', role_id: 1, company_id: 1, user_id: 2, username: 'Synthetic', uniqcode: 'Synthetic' };
        c.storage.getItem = key => JSON.stringify(values[key] ?? null);
        let ios = 0, browser = 0; c.redirect_on_HTML_PDF_preview_ios = () => ios++; c.open = () => browser++;
        c.F7_device = 'ios'; c.redirect_page_pdf_preview(1, 2, 'list');
        assert.equal(ios, 1); assert.equal(browser, 0);
        c.F7_device = 'android'; c.redirect_page_pdf_preview(1, 2, 'list');
        assert.equal(browser, 1);
    });
}
