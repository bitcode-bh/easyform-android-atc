#!/usr/bin/env node
// Actual shared popup/F7 code, synthetic options, and no external requests.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve('EasyFormSE_finance/assets/www2');
const source = fs.readFileSync(path.join(root, 'viewsitedata.html'), 'utf8');
const start = source.indexOf('<div class="popup popup-type20-dropdown"');
const popup = source.slice(start).match(/^[\s\S]*?<!--\s*Type20 dropdown popup End\s*-->/i)[0];
function formBindings(task) {
    const html = fs.readFileSync(path.join(root, task ? 'viewsitedata_task.html' : 'viewsitedata.html'), 'utf8');
    return html.match(/\/\/to get confirmation on back btn while editing form([\s\S]*?)bind_scroll_to_bottom_event/)[1] +
        html.match(/\$\(document\)\.on\('change', 'input\[id\^=cal\]'[\s\S]*?\n\s*\}\);/)[0];
}
function fixture(platform, legacy) {
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/Framework7-1.4.2/dist/css/Css_f7.css"><link rel="stylesheet" href="/css/shared_listing.css"><link rel="stylesheet" href="/css/form_style.css">
<script src="/Plugin_Js/jquery-3.5.1.min.js"></script><script src="/Framework7-1.4.2/dist/js/framework7.min.js"></script>
<script>var F7_device=${JSON.stringify(platform)};</script><script src="/EFSE_Js/get_search_control.js"></script>
</head><body><div class="views"><div class="view view-main"><div class="pages"><div class="page" data-page="list-view"><div class="page-content"><div class="list-block list-block-search"><ul id="other-list"><li><div class="item-title">Other existing list</div></li></ul></div></div></div></div></div><div class="view view-right"><div class="pages"></div></div></div>
<select id="ddl_search_type20_test" multiple hidden><option value="0">Select Value</option><option value="1" selected>Alpha Helmet</option><option value="2">Beta Footwear</option><option value="3">Alpha Gloves</option></select>${popup}
<script src="/${legacy ? `Framework7-1.4.2/kitchen-sink-${platform === 'android' ? 'material' : 'ios'}/js/kitchen-sink.js` : 'js/framework7_app.js'}"></script>
<script>
window.new_id_G='test';window.serverCalls=0;window.nativeInputEvents=0;
window.rows=function(titles,append){var list=document.getElementById('type20_ddl_list');if(!append)list.innerHTML='';
list.insertAdjacentHTML('beforeend',titles.map((title,i)=>'<li class="item-content" value="'+(i+1)+'"><div class="item-inner"><div class="item-title">'+title+'</div></div></li>').join(''));sync_type20_popup_selection();};
window.openOptions=function(){reset_type20_popup_search();myApp.popup('.popup-type20-dropdown');rows(['Select Value','Alpha Helmet','Beta Footwear','Alpha Gloves']);};
// A representative existing page debounce. Filtering must not synthesize input
// events or duplicate server requests; the server implementation is not called.
var pendingSearch;
$('#F7_type20_ddl_Search input').on('input',function(){nativeInputEvents++;clearTimeout(pendingSearch);pendingSearch=setTimeout(function(){serverCalls++;},150);});
openOptions();</script></body></html>`;
}
(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
    try {
        for (const platform of ['android', 'ios']) for (const legacy of [false, true]) {
            const page = await browser.newPage({ viewport: { width: legacy ? 320 : 390, height: 844 }, deviceScaleFactor: legacy ? 1 : 3, hasTouch: true, isMobile: true });
            const errors = [], external = [];
            page.on('pageerror', e => errors.push(e.message));
            await page.route('**/*', route => {
                const url = new URL(route.request().url());
                if (url.origin !== 'http://mwfm-search.test') { external.push(url.origin); return route.abort(); }
                if (url.pathname === '/fixture') return route.fulfill({ contentType: 'text/html', body: fixture(platform, legacy) });
                const file = path.resolve(root, '.' + url.pathname);
                return file.startsWith(root + path.sep) && fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
            });
            await page.goto('http://mwfm-search.test/fixture');
            // Load the real shared listener after parsing, without booting the app.
            await page.addScriptTag({ url: '/EFSE_Js/common-functions.js' });
            await page.addScriptTag({ content: 'window.form_has_changed="false";'+formBindings(legacy) });
            await page.locator('.t20-search-toggle').click();
            await page.evaluate(() => {
                const input = document.querySelector('#F7_type20_ddl_Search input');
                input.focus(); input.blur(); input.focus();
            });
            await page.waitForTimeout(180);
            assert.equal(await page.locator('#F7_type20_ddl_Search').isVisible(), true, 'an old blur must not fold a newly focused search');
            const input = page.locator('#F7_type20_ddl_Search input');
            const visible = () => page.locator('#type20_ddl_list > li:visible').count();
            await input.fill('aLpHa'); // input-only: mobile IME, paste, speech/autofill
            await page.waitForFunction(() => $('#type20_ddl_list > li:visible').length === 2);
            assert.equal(await visible(), 2);
            assert.equal(await page.evaluate(() => form_has_changed), 'false', 'typing in popup search must not mark real answers unsaved');
            assert.equal(await page.locator('#other-list li.hidden-by-searchbar').count(), 0, 'popup search must not filter another list');
            await page.waitForTimeout(190);
            assert.equal(await page.evaluate(() => serverCalls), 1, 'one original debounced request');
            assert.equal(await page.evaluate(() => nativeInputEvents), 1, 'no synthesized input events');
            const before = await page.evaluate(() => $('#ddl_search_type20_test').val());
            await input.fill('ALPHA HELMET');
            await page.waitForFunction(() => $('#type20_ddl_list > li:visible').length === 1);
            assert.deepEqual(await page.evaluate(() => $('#ddl_search_type20_test').val()), before, 'filtering does not alter selection');
            await input.fill('missing option');
            await page.waitForFunction(() => $('#type20_ddl_list > li.hidden-by-searchbar').length === 4);
            assert.equal(await page.locator('.searchbar-not-found').isVisible(), true);
            // Server/pagination redraws must keep the active query, including an
            // unchanged query: Framework7 otherwise skips its cached last value.
            await page.evaluate(() => rows(['Missing Option A', 'Unrelated', 'Missing Option B']));
            await page.waitForFunction(() => $('#type20_ddl_list > li:visible').length === 2);
            await page.evaluate(() => rows(['Other row', 'Missing Option C'], true));
            await page.waitForFunction(() => $('#type20_ddl_list > li:visible').length === 3);
            assert.equal(await page.locator('.searchbar-not-found').isVisible(), false);
            await input.fill('not found');
            await page.waitForFunction(() => $('#type20_ddl_list > li.hidden-by-searchbar').length === 5);
            await page.evaluate(() => $('#type20_ddl_list').append('<li class="item-content no-record"><div class="item-title">No Data Found !</div></li><li class="item-content li-new-cust"><a>Create</a></li>'));
            await page.waitForFunction(() => $('#type20_ddl_list > li:visible').length === 2);
            assert.equal(await page.locator('.no-record').isVisible(), true, 'server empty-state survives filtering');
            assert.equal(await page.locator('.li-new-cust').isVisible(), true, 'server Create action survives filtering');
            await page.locator('.searchbar-clear').click();
            await page.waitForFunction(() => !document.getElementById('F7_type20_ddl_Search').f7Searchbar.query);
            assert.equal(await input.inputValue(), '');
            assert.equal(await visible(), 6, 'clear removes the old no-record message as before');
            await input.pressSequentially('Unrelated');
            await page.waitForFunction(() => $('#type20_ddl_list > li:not(.searchbar-ignore):visible').length === 1);
            await page.evaluate(() => { myApp.closeModal('.popup-type20-dropdown'); });
            await page.waitForTimeout(450);
            await page.evaluate(() => openOptions());
            await page.waitForFunction(() => $('#type20_ddl_list > li:visible').length === 3);
            await page.locator('.t20-search-toggle').click();
            assert.equal(await input.inputValue(), '', 'reopen clears old query');
            await input.fill('Beta');
            await page.waitForFunction(() => $('#type20_ddl_list > li:visible').length === 1);
            await page.setViewportSize({ width: 800, height: 480 });
            assert.equal(await visible(), 1, 'orientation change preserves filtering');
            // The same adapter covers other F7 search inputs, not just type20.
            await page.evaluate(() => {
                var area=document.createElement('div');area.className='page';area.id='secondary';
                area.innerHTML='<form class="searchbar searchbar-init" data-search-list="#secondary-list" data-search-in=".item-title"><input type="search"></form><ul id="secondary-list"><li><span class="item-title">North</span></li><li><span class="item-title">South</span></li></ul>';
                document.body.appendChild(area);myApp.initSearchbar(area);
                var input=area.querySelector('input');input.value='South';input.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste'}));
            });
            await page.waitForFunction(() => $('#secondary-list li.hidden-by-searchbar').length === 1);
            assert.equal(await page.evaluate(() => form_has_changed), 'false', 'search clear/reopen/other filters remain navigation only');
            for (const [tag, type, eventType] of [['input','text','input'],['textarea','','input'],['select','','change'],['input','text','change']]) {
                const tracked = await page.evaluate(([tag,type,eventType]) => {
                    const wrapper=document.createElement('div');wrapper.className='cntrl_main_div';wrapper.style.border='1px solid red';
                    const field=document.createElement(tag);if(type)field.type=type;if(eventType==='change'&&tag==='input')field.id='cal_dirty_fixture';
                    wrapper.appendChild(field);document.body.appendChild(wrapper);form_has_changed='false';field.dispatchEvent(new Event(eventType,{bubbles:true}));
                    const result={dirty:form_has_changed,borderCleared:getComputedStyle(wrapper).borderTopStyle==='none'};wrapper.remove();return result;
                }, [tag,type,eventType]);
                assert.deepEqual(tracked,{dirty:'true',borderCleared:true},'real answer edit remains tracked: '+tag+'/'+eventType);
            }
            const readmore = await page.evaluate(() => {
                const label=document.createElement('label');label.innerHTML='<input type="checkbox"><div class="readmore"><span class="readmore-link" onclick="show_more_task_data(this);event.cancelBubble=true;"><i>Details</i></span></div>';
                document.body.appendChild(label);const link=label.querySelector('.readmore-link'),checkbox=label.querySelector('input');
                link.firstElementChild.click();const expanded=link.classList.contains('expand'),selectedOnOpen=checkbox.checked;
                link.firstElementChild.click();const result={expanded,collapsed:!link.classList.contains('expand'),selectedOnOpen,selectedOnClose:checkbox.checked};label.remove();return result;
            });
            assert.deepEqual(readmore,{expanded:true,collapsed:true,selectedOnOpen:false,selectedOnClose:false},'read-more keeps task selection unchanged');
            assert.deepEqual(errors, []); assert.deepEqual(external, []);
            console.log(JSON.stringify({ platform, initializer: legacy ? 'legacy' : 'minimal', inputOnly: true, keyboard: true, unchangedQueryRedraw: true, append: true, clearReopen: true, serverFeedback: true, selectionUnchanged: true, oneDebounce: true, otherSearchbars: true, popupIsolation: true, searchDoesNotDirtyForm: true, answerEditsTracked: true, readmorePreservesSelection: true, widths: [legacy ? 320 : 390, 800] }));
            await page.close();
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
