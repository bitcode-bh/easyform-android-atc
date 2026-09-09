const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise dashboard data callbacks and filter handlers with asynchronous chart
// operations, without requiring Cordova or the authenticated LMS service.
const chartEl = {
    innerHTML: '', style: {},
    contains(el) { return el === this; },
    querySelector() { return this.innerHTML === 'chart' ? {} : null; }
};
let requests = [], skeletons = 0, instances = 0;
const readyCallbacks = [];
const statusEl = { textContent: '' };
const tick = () => new Promise(resolve => setImmediate(resolve));
class ApexCharts {
    constructor(el, options) {
        this.el = el;
        this.options = options;
        this.ready = false;
        instances++;
    }
    async render() {
        await tick();
        this.el.innerHTML = 'chart';
        this.ready = true;
    }
    async updateOptions(options) {
        assert.ok(this.ready, 'updates must wait for initial render');
        assert.equal(this.el.innerHTML, 'chart', 'chart DOM must remain attached');
        await tick();
        this.options = options;
    }
    destroy() { this.el.innerHTML = ''; }
}
const jquery = arg => {
    if (typeof arg === 'function') readyCallbacks.push(arg);
    return { on() {}, removeClass() { return this; }, addClass() { return this; } };
};
const context = vm.createContext({
    console: { error(...args) { throw new Error(args.join(' ')); } },
    Promise, Date, ApexCharts, $: jquery,
    document: { getElementById(id) {
        return id === 'lms-trend-chart' ? chartEl : id === 'lms-trend-status' ? statusEl : null;
    } },
    global_wcf_url_lms: '/',
    LmsData: {
        getCache() { return null; },
        showSkeletons() { skeletons++; chartEl.innerHTML = 'loading'; },
        showError(selector) {
            assert.fail('Dashboard must not insert the full-page retry card');
        },
        fetch(key, url, params, success, error) { requests.push({ success, error }); }
    }
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../dashboard.js'), 'utf8'), context);
const response = JSON.stringify([{ status: 1, data: '[]' }]);
const flush = () => context.lms_trend_chart_work;
const days = () => context.lms_trend_chart_instance.options.xaxis.categories.length;

(async () => {
    readyCallbacks.forEach(fn => fn());
    await flush();
    assert.equal(chartEl.innerHTML, 'chart');
    assert.equal(days(), 7, 'DOM ready renders Week before any request or click');
    context.get_dashboard_data(true);
    await flush();
    assert.equal(chartEl.innerHTML, 'chart', 'pending first request leaves Week visible');
    assert.equal(statusEl.textContent, 'Updating chart…');
    requests.shift().success(response);
    await flush();
    assert.equal(statusEl.textContent, '');
    assert.equal(chartEl.innerHTML, 'chart');
    assert.equal(days(), 7, 'default Week renders on data arrival without clicks');

    context.get_dashboard_data(true);
    assert.equal(skeletons, 0, 'refresh must not detach an existing chart');
    requests.shift().success(response);
    await flush();

    context.set_lms_trend_range('month');
    await flush();
    assert.ok(days() >= 28, 'first Month click updates the chart');
    context.set_lms_trend_range('week');
    await flush();
    assert.equal(days(), 7, 'first Week click updates the chart');

    // Simulate a placeholder/DOM replacement from an earlier lifecycle.
    chartEl.innerHTML = 'loading';
    context.set_lms_trend_range('month');
    await flush();
    assert.equal(instances, 2, 'detached chart is recreated on the first click');
    assert.ok(days() >= 28);

    context.lms_trend_chart_instance.destroy();
    context.lms_trend_chart_instance = null;
    context.set_lms_trend_range('week');
    await Promise.resolve(); // initial render is now pending
    context.set_lms_trend_range('month');
    context.set_lms_trend_range('week');
    await flush();
    assert.equal(days(), 7, 'rapid switches during render finish at the latest range');
    context.set_lms_trend_range('week');
    await flush();
    assert.equal(days(), 7, 'repeated selection is safe');

    context.get_dashboard_data(true);
    requests.shift().error(new Error('offline'));
    await flush();
    assert.equal(chartEl.innerHTML, 'chart', 'failed refresh preserves the chart');
    assert.equal(statusEl.textContent, 'Could not refresh chart data. Pull down to retry.');

    for (const invalid of ['invalid JSON', '[]', '[{"status":0}]', '[{"status":1,"data":"invalid"}]']) {
        context.get_dashboard_data(true);
        requests.shift().success(invalid);
        await flush();
        assert.equal(chartEl.innerHTML, 'chart');
        assert.equal(statusEl.textContent, 'Could not refresh chart data. Pull down to retry.',
            'invalid responses must finish loading with compact feedback');
    }
    for (const data of [[], null, '[]', '', '   ']) {
        context.get_dashboard_data(true);
        requests.shift().success(JSON.stringify([{ status: 1, data }]));
        await flush();
        assert.equal(statusEl.textContent, '');
        assert.equal(days(), 7);
    }
    for (const status of [2, '2']) {
        context.dashboard_kpi_data = [{ Module_Id: 'previous-result' }];
        context.get_dashboard_data(true);
        requests.shift().success(JSON.stringify([{ status, data: 'No records found' }]));
        await flush();
        assert.equal(statusEl.textContent, '', 'status 2 must clear loading/error feedback');
        assert.equal(context.dashboard_kpi_data.length, 0, 'status 2 clears stale results');
        assert.equal(chartEl.innerHTML, 'chart');
        assert.equal(days(), 7);
    }
    console.log('LMS dashboard chart lifecycle checks passed');
})().catch(err => { console.error(err); process.exitCode = 1; });
