/* Real legacy/current online renderers, synthetic data, no external requests. */
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), assert = require('node:assert/strict');
const { chromium } = require('playwright'), acorn = require('acorn');
const root = path.resolve('EasyFormSE_finance/assets/www2');
const relative = 'EFSE_Js/viewsitelist_pm_on.js';
function renderer(source) {
    let node;function visit(n){if(!n||typeof n!=='object'||node)return;if(n.type==='FunctionDeclaration'&&n.id.name==='onsuccess_get_list_of_pm_sites_online')node=n;else Object.values(n).forEach(value=>Array.isArray(value)?value.forEach(visit):visit(value));}visit(acorn.parse(source,{ecmaVersion:'latest'}));
    return 'var w=window,state=window,actions=window,options={};function savedLists(){return window.AppPhase1Lists;}\n'+source.slice(node.start,node.end);
}
const sources = [renderer(cp.execFileSync('git', ['show', 'f6ae3a2:EasyFormSE_finance/assets/www2/' + relative], { encoding: 'utf8' })), renderer(fs.readFileSync(path.join(root, relative), 'utf8'))];
const fixture = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/Framework7-1.4.2/dist/css/Css_f7.css"><link rel="stylesheet" href="/css/form_style.css"><link rel="stylesheet" href="/css/task_list_theme.css"><script src="/Plugin_Js/jquery-3.5.1.min.js"></script></head><body><div id="tab1"><ul id="site_list"></ul></div><div id="div_bulk_btn"></div><button id="btn_Create_Task"></button><button id="btn_SeeAll"></button><button id="btn_SeeMore"></button><span id="tabCount_0"></span><button id="btn_Submit"></button></body></html>`;
(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
    try {
        const page = await browser.newPage({ viewport: { width: 390, height: 844 } }), external = [];
        await page.route('**/*', route => {
            const url = new URL(route.request().url());
            if (url.origin !== 'http://mwfm-render.test') { external.push(url.origin); return route.abort(); }
            if (url.pathname === '/fixture') return route.fulfill({ contentType: 'text/html', body: fixture });
            const file = path.resolve(root, '.' + url.pathname);
            return file.startsWith(root + path.sep) && fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
        });
        for (const config of [
            { name: 'online-dynamic' }, { name: 'online-single-row', count: 1 }, { name: 'online-single-static', count: 1, staticdata: 'Tenant' }, { name: 'online-static', staticdata: 'Tenant' },
            { name: 'online-400-rows', count: 400 }, { name: 'online-switch-off', indexed: false },
            { name: 'online-pending-first-match', pending: true }, { name: 'online-static-pending', staticdata: 'Tenant', pending: true },
            { name: 'online-pending-switch-off', pending: true, indexed: false },
            { name: 'online-id-equality', pending: true, ids: ['001', 1, '1'] },
            { name: 'online-actions-media', actions: true, pending: true, media: true },
            { name: 'online-status-tints', actions: true, tints: true },
            { name: 'online-api-columns', api: true }, { name: 'online-shortcuts', buttons: true },
            { name: 'online-pagination', pagination: true }, { name: 'online-bulk', bulk: true },
            { name: 'online-bulk-switch-off', bulk: true, indexed: false },
            { name: 'online-no-shell', pending: true, shellMissing: true },
            { name: 'online-disabled', pending: true, enabled: false },
            { name: 'online-missing-page-flag', pending: true, missingFlag: true },
            { name: 'online-100-pending', pending: true, count: 100 },
            { name: 'online-small-viewport', viewport: 320, actions: true },
            { name: 'online-large-viewport', viewport: 800, actions: true },
            { name: 'online-malformed-last', pending: true, malformed: true }, { name: 'online-malformed-first', count: 1, pending: true, malformed: true },
            { name: 'online-empty', status: 2 }, { name: 'online-server-message', status: 0 },
            { name: 'online-aggregate', aggregate: true }
        ]) {
            const results = [];
            await page.setViewportSize({ width: config.viewport || 390, height: 844 });
            for (const source of sources) {
                await page.goto('http://mwfm-render.test/fixture');
                await page.addScriptTag({ url: '/EFSE_Js/common-functions.js' });
                await page.evaluate(config => {
                    const fields = [{ header: 'Site', header_view: 'true', ans: '', position: 1, align: 'left', qid: 1, checksheetID: 100, step: 1, ctrl_type: 1, font_size: 11, format: 'normal', color: '#000000', system_var: 'false', is_hide: 'false' }, { header: 'Asset', header_view: 'true', ans: '', position: 2, align: 'right', qid: 2, checksheetID: 100, step: 1, ctrl_type: 1, font_size: 11, format: 'normal', color: '#000000', system_var: 'false', is_hide: 'false' }];
                    const flow = { task: 'false', staticdata: config.staticdata || '', status: [0, 1], columndata: fields, geofence: [{ value: 'false', show_distance: 'false' }], task_clickable: 'true', weather_display: 'false', task_removable: config.actions ? 'true' : 'false', task_editable: config.actions ? 'true' : 'false', customer_info: config.actions ? 'true' : 'false', CommentUI: config.actions ? 'true' : 'false', site_route: 'false', navigation: 'false', approval_status: 2, rejection_status: 3, task_layout: 'cardview', colwise_align: 'true', taskview_label: 'true', user_column: '', color_column: '', bulk_approval: config.bulk ? 'true' : 'false', bulk_approval_status: [{ name: 'Approve', status: 2 }], buttons: config.buttons ? [{ placement: 'task', view_dependancy: 'always', checksheet_id: 0, status: 1, name: 'Action', submit_message: 'Synthetic' }] : [], view_submit_button: 'false', task_listing_url: config.api ? 'synthetic' : '', sub_task_limit: 1000, main_task_limit: 1000 };
                    const values = { list_json: JSON.stringify([flow]), company_id: 1, tab_index: 0, flow_Array: [{ wayflow: 1 }], curr_btn_mode: '', udf_id: config.aggregate ? 2404 : 1, role_id: 1 };
                    window.storage = { getItem: key => JSON.stringify(values[key] ?? null), setItem: (key, value) => values[key] = JSON.parse(value) };
                    window.resultValues = values;
                    window.AppShell = config.shellMissing ? undefined : { settings: () => ({ enabled: config.enabled !== false, pages: config.missingFlag ? {} : { 'selection_survey.html': config.indexed !== false } }) };
                    Object.assign(window, { user_lat: 28, user_long: 77, user_accuracy: 1, F7_device: 'android', active_Tab: 0, limit_range: 3, label_timer: null, online_task_refresh_timer: null, aggregate_sum: 30, aggregate_min: 1, aggregate_max: 20, system_var_Array: {}, glob_statusName_ary: { 0: 'Open', 2: 'Complete', 3: 'Rejected' }, glob_statusColor_ary: { Open: '#ecedef' }, glob_textColor_ary: { Open: '#0d1829' } });
                    window.trip_New_Array = []; window.errors = []; window.alert1 = e => errors.push(String(e)); window.alert = alert1;
                    window.loading_hide = () => {}; window.get_list_of_UP_sites_count = () => {};
                    window.check_type_for_pdf_report = () => 'new'; window.cordova = { exec: () => { throw Error('Unexpected native request'); } };
                    window.clockTimers = new Map(); let timerId = 0;
                    window.setTimeout = (fn, ms) => { clockTimers.set(++timerId, { fn, ms, interval: false }); return timerId; };
                    window.setInterval = (fn, ms) => { clockTimers.set(++timerId, { fn, ms, interval: true }); return timerId; };
                    window.clearTimeout = window.clearInterval = id => clockTimers.delete(id);
                    window.holdCalls = 0; window.get_selected_chk_count = () => holdCalls++; window.show_bulk_approval_panel = () => {};
                    window.expireHolds = () => { for (const [id, timer] of Array.from(clockTimers)) if (timer.ms === 1000) { if (!timer.interval) clockTimers.delete(id); timer.fn.call(window); } };
                    window.scrollCalls = 0; window.see_more_site_list_common = () => scrollCalls++;
                    window.testRows = Array.from({ length: config.status === undefined ? config.count || 3 : 1 }, (_, i) => ({ status: config.status ?? 1, message: 'Synthetic server message', server_task_id: config.ids ? config.ids[i] : i % 2 ? String(i + 100) : i + 100, Customer_id: i + 1, siteid: 'Site ' + i, lat: 28, long1: 77, survey_date: '2026-10-18', millisecond: '1000', moduleid: 1, module_name: 'Demo', status1: config.tints ? [0, 2, 3][i] : 0, task_setting: '', bgcolor: config.tints ? ['red', 'yellow', 'green'][i] : '', global_var: '', columndata: config.api ? fields.map(f => ({ ...f, ans: f.header + ' ' + i })) : [{ Site: 'Site ' + i, Asset: 'Asset ' + i }], site_address: 'Synthetic' }));
                    window.upload_pending_Array = [];
                    if (config.pending) {
                        for (const row of testRows) upload_pending_Array.push([row.server_task_id, 1000, config.media ? JSON.stringify([{ c_name: 'Synthetic', s_name: 'Photo', checksheet_type: 0 }]) : '', '', '', '']);
                        // First local match owns the media state. A later duplicate must not replace it.
                        upload_pending_Array.push([testRows[0].server_task_id, 999, '[{}]', '[{}]', '[{}]', '[{}]']);
                    }
                    if (config.malformed) upload_pending_Array[testRows.length - 1][2] = '{';
                    window.pendingReads = 0;
                    upload_pending_Array.forEach(row => { const id = row[0]; Object.defineProperty(row, '0', { get: () => { pendingReads++; return id; } }); });
                    localStorage.setItem('is_subflow', 'false');
                    if (config.pagination) $('#site_list').append('<li id="existing">Previous page</li>');
                    if (config.aggregate) document.body.insertAdjacentHTML('beforeend', '<div class="card_Aggregate"><span id="lbl_Avg"></span><span id="lbl_Min"></span><span id="lbl_Max"></span></div>');
                }, config);
                await page.addScriptTag({ content: source });
                results.push(await page.evaluate(config => {
                    const mutations = new MutationObserver(() => {}), list = document.getElementById('site_list');
                    mutations.observe(list, { childList: true });
                    let heightReads = 0; const originalHeight = $.fn.height;
                    $.fn.height = function () { heightReads++; return originalHeight.apply(this, arguments); };
                    onsuccess_get_list_of_pm_sites_online({ responseText: JSON.stringify(testRows) });
                    $.fn.height = originalHeight;
                    const pendingInspections = pendingReads;
                    const insertions = mutations.takeRecords().filter(r => r.addedNodes.length).length; mutations.disconnect();
                    const output = { html: $('#site_list').html(), count: $('#site_list > li').length, countText: $('#tabCount_0').text(), bulk: $('#div_bulk_btn').html(), errors: errors.slice(), values: resultValues, aggregate: $('.card_Aggregate').html() || '' };
                    const icon = document.querySelector('.cls_task_ico');
                    const handlers = icon ? ($._data(icon, 'events')?.click?.length || 0) : null;
                    const gesture = {};
                    if (config.bulk) {
                        const first = $('#site_list > li:first'), checkbox = first.find('input[name=li_chk]');
                        first.trigger('touchstart'); expireHolds(); gesture.heldSelected = checkbox.prop('checked'); gesture.heldCalls = holdCalls;
                        first.trigger('touchend'); checkbox.prop('checked', false); holdCalls = 0;
                        for (const event of ['touchend', 'touchcancel', 'touchmove']) { first.trigger('touchstart').trigger(event); expireHolds(); gesture[event] = { selected: checkbox.prop('checked'), calls: holdCalls }; }
                        first.trigger('touchend');
                    }
                    onsuccess_get_list_of_pm_sites_online({ responseText: JSON.stringify(testRows) });
                    const scrollHandlers = $._data(document.getElementById('tab1'), 'events')?.scroll?.length || 0;
                    if (config.bulk) {
                        const first = $('#site_list > li:first'); first.find('input[name=li_chk]').prop('checked', false); holdCalls = 0;
                        first.trigger('touchstart'); expireHolds(); gesture.afterRefresh = { selected: first.find('input[name=li_chk]').prop('checked'), calls: holdCalls };
                        first.trigger('touchend');
                        const row = $('#site_list > li:last'); holdCalls = 0; row.trigger('touchstart').detach(); expireHolds(); gesture.detachedCalls = holdCalls;
                        gesture.activeHoldTimers = Array.from(clockTimers.values()).filter(t => t.ms === 1000).length;
                    }
                    return { output, insertions, handlers, scrollHandlers, gesture, heightReads, pendingInspections };
                }, config));
            }
            console.log(JSON.stringify({ case: config.name, beforeCount: results[0].output.count, afterCount: results[1].output.count, beforeInsertions: results[0].insertions, afterInsertions: results[1].insertions, beforeErrors: results[0].output.errors, afterErrors: results[1].output.errors, beforeHeightReads: results[0].heightReads, afterHeightReads: results[1].heightReads, beforePendingReads: results[0].pendingInspections, afterPendingReads: results[1].pendingInspections }));
            assert.deepEqual(results[1].output, results[0].output, config.name + ': preserve markup, actions, status, count, aggregate and stored state');
            if (config.malformed) assert.equal(results[1].output.errors.length, 1); else assert.deepEqual(results[1].output.errors, config.status === 0 ? ['Synthetic server message'] : []);
            const batched = config.indexed !== false && !config.shellMissing && config.enabled !== false && !config.missingFlag;
            assert.equal(results[1].insertions, batched && !(config.malformed && config.count === 1) ? 1 : results[0].insertions);
            if (!batched) assert.equal(results[1].pendingInspections, results[0].pendingInspections, 'disabled path keeps its first-match scan without unused indexing');
            if (config.count === 100) assert.ok(results[1].pendingInspections < results[0].pendingInspections / 5, 'enabled upload join avoids full scans');
            if (batched && !config.staticdata) assert.ok(results[1].heightReads <= 1, 'one read-more layout measurement per response');
            if (config.actions && !config.staticdata) assert.equal(results[1].handlers, 1);
            if (config.bulk) {
                assert.equal(results[0].gesture.heldSelected, false, 'original interval loses its row receiver');
                assert.equal(results[1].gesture.heldSelected, true); assert.equal(results[1].gesture.heldCalls, 1);
                for (const event of ['touchend', 'touchcancel', 'touchmove']) assert.deepEqual(results[1].gesture[event], { selected: false, calls: 0 }, event + ' cancels the hold');
                assert.deepEqual(results[1].gesture.afterRefresh, { selected: true, calls: 1 }, 'refresh does not duplicate gesture handlers');
                assert.equal(results[1].gesture.detachedCalls, 0); assert.equal(results[1].gesture.activeHoldTimers, 0);
            }
            if (!config.malformed && config.status === undefined) assert.equal(results[1].scrollHandlers, config.count === 1 ? 0 : 1, 'pagination binds once only when more rows are available');
        }
        assert.deepEqual(external, [], 'never contact external services');
    } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
