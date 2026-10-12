const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

// Run the real cache layer and listing callbacks without Cordova/network access.
// The event registry models jQuery's namespaced off/on delegation contract.
function setup(cache) {
    const handlers = new Map(), store = new Map(), requests = [];
    const document = { querySelectorAll: () => [], querySelector: () => null };
    const chain = {
        off(event, selector) { handlers.delete(event + '|' + selector); return this; },
        on(event, selector, fn) { handlers.set(event + '|' + selector, fn); return this; },
        not() { return this; }, html() { return this; }, empty() { return this; },
        hide() { return this; }, show() { return this; }, remove() { return this; },
        append() { return this; }, ready() { return this; }
    };
    const context = vm.createContext({ document, console, setTimeout,
        $: arg => arg && arg.tag ? { attr: () => arg.tag } : chain,
        localStorage: { getItem: key => store.has(key) ? store.get(key) : null,
            setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) },
        global_wcf_url_lms: '/',
        Webservicecall_REST: function(url, params, success) {
            this.callOtherDomain = () => requests.push(success);
        }
    });
    for (const file of ['lms_data.js', 'safety_modules.js', 'assessments.js']) {
        vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
    }
    for (const name of ['update_module_kpi', 'update_assessment_kpi', 'lms_compute_module_total_video_time']) context[name] = () => {};
    if (cache !== undefined) for (const kind of ['modules', 'assessments']) context.LmsData.setCache(kind + '_null', cache);
    return { context, handlers, requests };
}
const response = JSON.stringify([{ status: 1, data: JSON.stringify([
    { Tag: 'Safety', Module_Name: 'One', Name: 'One' },
    { Tag: 'Other', Module_Name: 'Two', Name: 'Two' }
]) }]);
for (const [scenario, cache, force] of [
    ['fresh login', undefined, true],
    ['retained cache login / page re-entry', response, true],
    ['normal cache-first load', response, false],
    ['malformed retained cache', '{broken', false],
    ['cached empty result', '[{"status":2}]', false]
]) {
    const { context: c, handlers, requests } = setup(cache);
    let moduleRenders = 0, assessmentRenders = 0;
    c.render_safety_module_cards = () => moduleRenders++;
    c.render_assessment_cards = () => assessmentRenders++;
    c.get_safety_module_listing(force);
    c.get_assessments_listing(force);
    requests.splice(0).forEach(success => success({ responseText: response }));
    // Repeat tab/navigation paints and API refreshes: exactly one delegated
    // callback must select the tag and render the corresponding list once.
    for (let i = 0; i < 10; i++) {
        c.render_safety_module_tags();
        c.render_assessment_tags();
        for (const [event, selector, selected, count] of [
            ['click.safetyModules', '.sample-safety-tabs:not(.assessment-tabs) .sample-safety-chip', 'selected_safety_tag', () => moduleRenders],
            ['click.assessments', '.assessment-tabs .sample-safety-chip', 'selected_assessment_tag', () => assessmentRenders]
        ]) {
            const fn = handlers.get(event + '|' + selector);
            assert.equal(typeof fn, 'function', scenario);
            const before = count();
            fn.call({ tag: 'Safety' });
            assert.equal(c[selected], 'Safety', scenario);
            assert.equal(count(), before + 1, scenario);
        }
        assert.equal(handlers.size, 8, 'no duplicate handlers or cross-list bindings');
        c.get_safety_module_listing(true);
        c.get_assessments_listing(true);
        requests.splice(0).forEach(success => success({ responseText: response }));
        assert.equal(c.selected_safety_tag, 'Safety');
        assert.equal(c.selected_assessment_tag, 'Safety');
    }
    console.log('PASS:', scenario);
}
