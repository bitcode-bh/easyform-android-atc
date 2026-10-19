#!/usr/bin/env node
// Synthetic local data only. Every browser request is fulfilled locally or blocked.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve('EasyFormSE_finance/assets/www2');
const common = fs.readFileSync(path.join(root, 'EFSE_Js/common-functions.js'), 'utf8');
const preInit = common.match(/function pre_init_F7\(\) \{[\s\S]*?\n\}/)[0];
const viewer = common.slice(common.indexOf('var imageViewerZoom ='), common.indexOf('// for safety passport view from profile menu'));
const navigation = fs.readFileSync(path.join(root, 'js/changeurl.js'), 'utf8');
const profileViewer = navigation.match(/function get_full_view_profile_pic\(\) \{[\s\S]*?\n\}/)[0];
const fixtures = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<script>
window.MWFMPhase1Config=true;
window.values={company_id:1,user_id:2,role_id:3,global_wcf_url:'https://example.invalid/',list_json:JSON.stringify([{survey_mode:'offline'}]),flow_Array:[],tab_index:0,survey_type:1};
window.storage={getItem:function(k){return JSON.stringify(values[k]===undefined?null:values[k]);},setItem:function(k,v){values[k]=JSON.parse(v);}};
window.limit_range=20;window.default_range=20;window.opened=[];window.apiCalls=[];
window.form_flag=0;window.curr_page_flag='viewsitedata';
window.cordova={exec:function(ok,fail,plugin,action,args){apiCalls.push({plugin:plugin,action:action,args:args,callback:typeof ok});}};
window.myApp={popup:function(selector){opened.push(selector);}};
window.alert1=function(message){AppPhase1.notice(message);};
</script><script src="/Plugin_Js/jquery-3.5.1.min.js"></script>
<script src="/js/phase1_ui.js"></script><script src="/js/phase1_lists.js"></script>
</head><body><ul id="site_list"></ul><input id="inv_item_code_Search_x"><input id="inv_item_name_Search_x">
<div id="product_list"></div><video id="preview_video_src"></video></body></html>`;

(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || undefined });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const requests = {};
    const handleRoute = async route => {
        const url = new URL(route.request().url());
        if (url.hostname !== 'mwfm-phase1.test') return route.abort();
        if (url.pathname === '/selection_survey.html') return route.fulfill({ contentType: 'text/html', body: fixtures });
        if (url.pathname === '/framework-controls.html') {
            const platform = url.searchParams.get('platform') === 'ios' ? 'ios' : 'android';
            return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html class="phase1-motion"><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/Framework7-1.4.2/dist/css/Css_f7.css">
<link rel="stylesheet" href="/css/phase1_ui.css">
<script src="/Plugin_Js/jquery-3.5.1.min.js"></script>
<script src="/Framework7-1.4.2/dist/js/framework7.min.js"></script>
<script>var F7_device=${JSON.stringify(platform)},username='Synthetic',myPhotoBrowser;
window.AppPhase1={enabled:()=>true};function check_and_init_F7_theme(){}
function get_profile_pic_path_android_ios(){return 'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2264%22%20height=%2264%22%3E%3C/svg%3E';}
${profileViewer}</script></head><body>
<div class="panel-overlay"></div>
<div id="fixture-panel" class="panel panel-left panel-cover"><a id="profile-photo" onclick="get_full_view_profile_pic()" style="display:block;height:64px">Profile photo</a><a id="menu-close" href="#" class="close-panel" style="display:block;height:48px">Close menu</a></div>
${url.searchParams.has('duplicate') ? '<div class="panel panel-left panel-cover" style="width:0"></div>' : ''}
<div class="views"><div class="view view-main"><div class="pages navbar-fixed"><div class="page" data-page="list-view">
<div class="navbar"><div class="navbar-inner"><div class="left"><a id="menu-toggle" href="#" class="open-panel link">Menu</a></div></div></div>
<div class="page-content"><div id="lblusername"></div></div></div></div></div></div>
<script>${preInit};pre_init_F7();</script></body></html>` });
        }
        if (url.pathname === '/framework-init.html') {
            const platform = url.searchParams.get('platform') === 'ios' ? 'ios' : 'android';
            const enabled = url.searchParams.get('enabled') !== 'false';
            const view = name => `<div class="view ${name}"><div class="pages"><div class="page" data-page="list-view"><div class="page-content"></div></div></div></div>`;
            return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="/Plugin_Js/jquery-3.5.1.min.js"></script>
<script src="/Framework7-1.4.2/dist/js/framework7.min.js"></script>
<script src="/Plugin_Js/pinch-zoom.umd.js"></script>
<style>.pinch-zoom-container{position:fixed!important;inset:0;height:100%;width:100%;z-index:10000}#pinch_close{position:absolute;top:12px;left:12px;z-index:1}</style>
<script>var F7_device=${JSON.stringify(platform)},username='Synthetic';window.AppPhase1={enabled:()=>${enabled}};window.cordova={exec:function(ok){ok();}};function check_and_init_F7_theme(){}</script>
</head><body><div id="lblusername"></div>${view('view-main')}${url.searchParams.has('right') ? view('view-right') : ''}
<a id="app-back" class="back link icon-only" onclick="window.backCalls=(window.backCalls||0)+1">Back</a>
<img id="reference" width="64" height="64" alt="Synthetic reference" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3C/svg%3E" onclick="open_pinch_zoom_div(this.src)">
<script>${viewer};${preInit};pre_init_F7();</script></body></html>` });
        }
        const file = path.resolve(root, '.' + url.pathname);
        if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.abort();
        requests[url.pathname] = (requests[url.pathname] || 0) + 1;
        return route.fulfill({ path: file });
    };
    await page.route('**/*', handleRoute);
    try {
        await page.goto('http://mwfm-phase1.test/selection_survey.html');
        await page.evaluate(() => AppPhase1Lists.response('site_list', function () {
            localStorage.setItem('filter_ddl_Array', '["generated option"]');
            document.getElementById('site_list').innerHTML = '<li id="task-a"><a id="open-a" onclick="opened.push(\'old\')">Task A</a></li>';
        })());
        await page.waitForFunction(() => localStorage.getItem('mwfm_phase1_lists'));
        await page.reload();
        assert.equal(await page.locator('#site_list').getAttribute('aria-busy'), 'true');
        await page.locator('#open-a').click();
        assert.deepEqual(await page.evaluate(() => opened), [], 'cached tap cannot run old metadata');
        await page.evaluate(() => AppPhase1Lists.response('site_list', function () {
            document.getElementById('site_list').innerHTML = '<li id="task-a"><a id="open-a" onclick="opened.push(\'fresh\')">Task A updated</a></li>';
        })());
        await page.waitForFunction(() => opened.length === 1);
        assert.deepEqual(await page.evaluate(() => opened), ['fresh']);
        assert.equal(await page.locator('#site_list>li').count(), 1);
        // The legacy tab initializer clears and can move #site_list after DOM ready.
        await page.evaluate(() => {
            const previous = document.getElementById('site_list');
            previous.removeAttribute('id');
            const active = document.createElement('ul'); active.id = 'site_list'; document.body.appendChild(active);
            window.nextRefresh = AppPhase1Lists.response('site_list', function () {
                active.innerHTML = '<li id="task-a"><a id="open-a" onclick="opened.push(\'new-root\')">Fresh active tab</a></li>';
            });
        });
        assert.equal(await page.locator('#site_list').getAttribute('aria-busy'), 'true', 'request restores after tab initialization');
        await page.locator('#site_list #open-a').click();
        assert.deepEqual(await page.evaluate(() => opened), ['fresh'], 'new tab root also blocks cached handlers');
        await page.evaluate(() => nextRefresh());
        await page.waitForFunction(() => opened.length === 2);
        assert.deepEqual(await page.evaluate(() => opened), ['fresh', 'new-root']);
        await page.evaluate(() => document.querySelector('ul:not([id])').remove());
        const startupReset = await page.evaluate(() => {
            const root = document.getElementById('site_list'); root.innerHTML = '';
            values.survey_type = ''; // Home clears this before opening the task page.
            const waitsForContext = !AppPhase1Lists.restore('site_list');
            values.survey_type = 1; // Existing deviceready initialization.
            const restoresBeforeRequest = AppPhase1Lists.restore('site_list') && root.children.length > 0;
            return { waitsForContext, restoresBeforeRequest };
        });
        assert.ok(startupReset.waitsForContext && startupReset.restoresBeforeRequest);
        await page.evaluate(() => AppPhase1Lists.response('site_list', function () {
            document.getElementById('site_list').innerHTML = '<li id="task-a"><a id="open-a" onclick="opened.push(\'startup\')">Refreshed startup</a></li>';
        })());
        await page.waitForFunction(() => !document.getElementById('site_list').hasAttribute('aria-busy'));
        await page.evaluate(() => {
            limit_range = 40;
            AppPhase1Lists.response('site_list', function () {
                document.getElementById('site_list').insertAdjacentHTML('beforeend', '<li id="task-b">Task B</li>');
            })();
        });
        await page.waitForFunction(() => document.querySelectorAll('#site_list>li').length === 2);
        assert.equal(await page.locator('#site_list>li').count(), 2, 'pagination appends');
        await page.waitForFunction(() => JSON.parse(localStorage.getItem('mwfm_phase1_lists')).some(e => e.html.includes('task-b')));
        const discardedOldTap = await page.evaluate(async () => {
            limit_range = 20;
            AppPhase1Lists.restore('site_list');
            document.querySelector('#site_list #open-a').click();
            values.tab_index = 1;
            AppPhase1Lists.response('site_list', function () {
                document.getElementById('site_list').innerHTML = '<li id="task-a"><a id="open-a" onclick="opened.push(\'wrong-tab\')">Same ID in another tab</a></li>';
            })();
            await new Promise(resolve => setTimeout(resolve, 30));
            const dropped = opened.length === 2;
            values.tab_index = 0;
            AppPhase1Lists.restore('site_list');
            return dropped;
        });
        assert.equal(discardedOldTap, true, 'changing tabs discards a queued cached tap');
        const slowRefresh = await page.evaluate(async () => {
            const root = document.getElementById('site_list');
            const delay = window.setTimeout;
            window.setTimeout = function (fn, ms) { return delay(fn, ms === 10000 ? 20 : ms); };
            try {
                AppPhase1Lists.restore('site_list');
                document.querySelector('#site_list #open-a').click();
                const before = opened.length;
                AppPhase1Lists.response('site_list', function () {
                    root.innerHTML = '';
                    delay(() => { root.innerHTML = '<li id="task-a"><a id="open-a" onclick="opened.push(\'slow-fresh\')">Delayed fresh row</a></li>'; }, 40);
                })();
                await new Promise(resolve => delay(resolve, 70));
                const queuedTapExpired = opened.length === before;
                document.querySelector('#site_list #open-a').click();
                return { queuedTapExpired, freshRowInteractive: opened.length === before + 1 && opened.at(-1) === 'slow-fresh' };
            } finally { window.setTimeout = delay; }
        });
        assert.ok(slowRefresh.queuedTapExpired && slowRefresh.freshRowInteractive, 'slow refresh cannot leave fresh rows blocked');
        const renderFailure = await page.evaluate(async () => {
            const root = document.getElementById('site_list');
            const before = opened.length;
            AppPhase1Lists.response('site_list', function () {
                root.innerHTML = '<li></li>';
                AppPhase1Lists.failed('site_list', new Error('Synthetic renderer failure'));
            })();
            await new Promise(resolve => setTimeout(resolve, 30));
            const fullSnapshotRetained = root.children.length === 2 && root.getAttribute('aria-busy') === 'true';
            document.querySelector('#site_list #open-a').click();
            const staleActionBlocked = opened.length === before;
            AppPhase1Lists.response('site_list', function () {
                root.innerHTML = '<li id="task-a"><a id="open-a" onclick="opened.push(\'retry\')">Successful retry</a></li>';
            })();
            await new Promise(resolve => setTimeout(resolve, 30));
            return { fullSnapshotRetained, staleActionBlocked, failedTapNotReplayed: opened.length === before };
        });
        Object.entries(renderFailure).forEach(([key, value]) => assert.equal(value, true, key));
        const isolation = await page.evaluate(() => {
            limit_range = 20;
            let called = false;
            const old = AppPhase1Lists.response('site_list', function () { called = true; });
            values.tab_index = 2; // No saved data in this tab (tab 1 was exercised above).
            old();
            const differentTab = !called && !AppPhase1Lists.restore('site_list');
            values.tab_index = 0;
            values.user_id = 99;
            const differentUser = !AppPhase1Lists.restore('site_list');
            values.user_id = 2;
            localStorage.setItem('searchCol_obj', '[{"value":"different filter"}]');
            const differentFilter = !AppPhase1Lists.restore('site_list');
            localStorage.removeItem('searchCol_obj');
            document.getElementById('site_list').innerHTML = '';
            const failedRefreshRetainsData = AppPhase1Lists.keep('site_list') && document.getElementById('site_list').children.length > 0;
            localStorage.setItem('mwfm_phase1_lists', '{bad json');
            const corruptSafe = !AppPhase1Lists.restore('site_list');
            return { differentTab, differentUser, differentFilter, failedRefreshRetainsData, corruptSafe };
        });
        Object.entries(isolation).forEach(([key, value]) => assert.equal(value, true, key));

        const rollout = await page.evaluate(() => {
            MWFMPhase1Config = undefined;
            const defaultOff = !AppPhase1.enabled('press');
            const failureFallback = !AppPhase1Lists.failed('site_list', new Error('Disabled feature'));
            AppPhase1.configure({ press: true, notices: 'false' });
            const typedServerConfig = AppPhase1.enabled('press') && !AppPhase1.enabled('notices');
            values.user_id = 99;
            const isolatedAccount = !AppPhase1.enabled('press');
            values.user_id = 2;
            AppPhase1.preview(false);
            const previewOverride = !AppPhase1.enabled('press');
            const preview = JSON.parse(sessionStorage.getItem('mwfm_phase1_preview'));
            preview.expires = Date.now() - 1;
            sessionStorage.setItem('mwfm_phase1_preview', JSON.stringify(preview));
            const previewExpires = AppPhase1.enabled('press');
            AppPhase1.preview(null);
            AppPhase1.configure(null);
            const omittedFlagsReset = !AppPhase1.enabled('press');
            MWFMPhase1Config = true;
            AppPhase1.sync();
            return { defaultOff, failureFallback, typedServerConfig, isolatedAccount, previewOverride, previewExpires, omittedFlagsReset };
        });
        Object.entries(rollout).forEach(([key, value]) => assert.equal(value, true, key));

        const form = fs.readFileSync(path.join(root, 'viewsitedata.html'), 'utf8');
        const registrations = [...form.matchAll(/AppPhase1\.register\((.*?)\);/g)].map(m => m[0]);
        for (const registration of registrations) await page.addScriptTag({ content: registration });
        assert.equal(requests['/EFSE_Js/get_scanner.js'], undefined, 'scanner is not eager');
        await page.evaluate(() => {
            get_qr_and_search_data('field', 'table', 'join', 7);
            get_qr_and_search_data('field', 'table', 'join', 7);
        });
        await page.waitForFunction(() => apiCalls.length === 2);
        assert.equal(requests['/EFSE_Js/get_scanner.js'], 1, 'concurrent first use loads once');
        const scanner = await page.evaluate(() => ({ calls: apiCalls.slice(), params: JSON.parse(storage.getItem('type20_qr_data')) }));
        assert.equal(scanner.calls[0].plugin, 'scanner_plug');
        assert.equal(scanner.calls[0].args[0].photo_type, 'qr');
        assert.equal(scanner.params[0].Checksheet_id, 7);
        assert.equal(scanner.params[0].t_new_id, 'field');
        await page.evaluate(() => select_file('doc', 8, 'document', 'base', 'pdf'));
        await page.waitForFunction(() => apiCalls.length === 3);
        assert.equal(await page.evaluate(() => apiCalls[2].plugin), 'choose_file_plug');
        await page.evaluate(() => Download_PDFFile('https://example.invalid/report.pdf', 'report.pdf'));
        await page.waitForFunction(() => apiCalls.length === 4);
        assert.equal(await page.evaluate(() => apiCalls[3].plugin), 'pdf_download');
        await page.evaluate(() => preview_video('file:///synthetic.mp4'));
        await page.waitForFunction(() => opened.includes('.popup-preview-video'));
        assert.equal(await page.locator('#preview_video_src').getAttribute('src'), 'file:///synthetic.mp4');
        await page.evaluate(() => change_search_type(1, 'x'));
        await page.waitForFunction(() => getComputedStyle(document.getElementById('inv_item_code_Search_x')).display === 'none');
        assert.equal(await page.locator('#inv_item_name_Search_x').isVisible(), true);
        assert.equal(await page.evaluate(() => typeof get_type22_ans), 'undefined', 'print-only return-value helpers are not asynchronous stubs');
        assert.ok(form.includes('src="EFSE_Js/get_calculator.js"') && form.includes('src="EFSE_Js/get_inv_calculation.js"'), 'calculator and type22 remain eager');

        const notices = [];
        for (const width of [320, 390, 800]) {
            await page.setViewportSize({ width, height: 844 });
            await page.evaluate(() => AppPhase1.notice('Please select a site first.'));
            notices.push(await page.locator('.phase1-notice').evaluate(el => {
                const rect = el.getBoundingClientRect(), css = getComputedStyle(el);
                return { fits: rect.left >= 0 && rect.right <= innerWidth, avoidsBottomControls: rect.bottom < innerHeight - 100,
                    nonBlocking: css.pointerEvents === 'none', text: el.textContent };
            }));
        }
        notices.forEach(n => assert.ok(n.fits && n.avoidsBottomControls && n.nonBlocking));
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.evaluate(() => {
            const content = document.createElement('div'); content.className = 'page-content premium-fade-in'; document.body.appendChild(content);
        });
        assert.equal(await page.locator('.premium-fade-in').evaluate(el => getComputedStyle(el).animationName), 'none');
        const frameworkErrors = [];
        page.on('pageerror', error => frameworkErrors.push(error.message));
        for (const platform of ['android', 'ios']) {
            for (const right of [false, true]) {
                frameworkErrors.length = 0;
                await page.goto(`http://mwfm-phase1.test/framework-init.html?platform=${platform}${right ? '&right=1' : ''}`);
                await page.waitForFunction(() => window.mainView && document.querySelector('.view-main').f7View);
                assert.equal(await page.evaluate(() => !!window.rightView), right);
                assert.equal(await page.evaluate(() => !!myApp.params.material), platform === 'android');
                assert.equal(await page.evaluate(() => Array.from(document.scripts).some(s => s.src.includes('kitchen-sink'))), false);
                await page.locator('#app-back').click();
                assert.equal(await page.evaluate(() => window.backCalls), 1, 'app Back runs once without Framework7 routing a missing href');
                await page.locator('#reference').click();
                await page.waitForSelector('.pinch-zoom-container');
                await page.locator('#pinch_close').click();
                assert.equal(await page.locator('.pinch-zoom-container').count(), 0);
                assert.deepEqual(frameworkErrors, [], 'eager core init must not depend on a demo right-hand view');
            }
        }
        for (const platform of ['android', 'ios']) for (const right of [false, true]) {
            frameworkErrors.length = 0;
            await page.goto(`http://mwfm-phase1.test/framework-init.html?platform=${platform}&enabled=false${right ? '&right=1' : ''}`);
            await page.waitForFunction(() => window.mainView && Array.from(document.scripts).some(s => s.src.includes('kitchen-sink')));
            assert.equal(await page.evaluate(() => !!window.rightView), right);
            await page.locator('#app-back').click();
            assert.equal(await page.evaluate(() => window.backCalls), 1);
            assert.deepEqual(frameworkErrors, [], 'disabled switch keeps a working legacy initializer and app Back');
        }
        const touchErrors = [];
        for (const platform of ['android', 'ios']) {
            const userAgent = platform === 'android'
                ? 'Mozilla/5.0 (Linux; Android 17; Test Phone) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/154.0.0.0 Mobile Safari/537.36'
                : 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
            const touchPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent });
            await touchPage.route('**/*', handleRoute);
            touchPage.on('pageerror', error => touchErrors.push(error.message));
            for (const duplicate of [false, true]) {
                await touchPage.emulateMedia({ reducedMotion: duplicate ? 'reduce' : 'no-preference' });
                await touchPage.goto(`http://mwfm-phase1.test/framework-controls.html?platform=${platform}${duplicate ? '&duplicate=1' : ''}`);
                await touchPage.waitForFunction(() => window.mainView && myApp.allowPanelOpen);
                await touchPage.locator('#menu-toggle').tap();
                await touchPage.waitForSelector('#fixture-panel.active');
                for (let attempt = 0; attempt < 2; attempt++) {
                    await touchPage.locator('#profile-photo').tap();
                    await touchPage.waitForSelector('.photo-browser-popup.modal-in');
                    await touchPage.locator('.photo-browser-close-link').tap();
                    try {
                        await touchPage.waitForFunction(() => {
                            const popup = document.querySelector('.photo-browser-popup');
                            return !popup || getComputedStyle(popup).display === 'none';
                        }, null, { timeout: 5000 });
                    } catch (error) {
                        const state = await touchPage.evaluate(() => {
                            const popup = document.querySelector('.photo-browser-popup'), css = popup && getComputedStyle(popup);
                            return { opened: myPhotoBrowser.opened, classes: popup && popup.className,
                                display: css && css.display, transform: css && css.transform,
                                transition: css && css.transition, body: document.body.className };
                        });
                        console.error(JSON.stringify({ platform, duplicate, photoPopupState: state }));
                        throw error;
                    }
                }
                await touchPage.locator('#menu-close').tap();
                try {
                    await touchPage.waitForFunction(() => !document.querySelector('.panel.active') && myApp.allowPanelOpen, null, { timeout: 5000 });
                } catch (error) {
                    console.error(JSON.stringify({ platform, duplicate, panelState: await touchPage.evaluate(() => ({
                        allowed: myApp.allowPanelOpen, body: document.body.className,
                        panels: Array.from(document.querySelectorAll('.panel')).map(e => ({ classes: e.className,
                            width: e.getBoundingClientRect().width, transform: getComputedStyle(e).transform })),
                        hit: document.elementFromPoint(365, 400)?.className, width: innerWidth
                    })) }));
                    throw error;
                }
                await touchPage.locator('#menu-toggle').tap();
                await touchPage.waitForSelector('#fixture-panel.active');
            }
            await touchPage.close();
        }
        assert.deepEqual(touchErrors, [], 'menu and photo popup remain usable with the eager shared initializer');
        console.log(JSON.stringify({ cachedLists: isolation, rollout, startupReset, discardedOldTap, slowRefresh, renderFailure, tabRootRestore: true, queuedTapUsesFreshRow: true, pagination: true,
            lazyScannerAndNativeArguments: true, lazyDocuments: true, lazyPdf: true, lazyVideoPreview: true,
            lazyInvoiceControl: true, noticeWidths: [320, 390, 800], nonBlockingNotices: true, reducedMotion: true,
            frameworkInit: { android: true, ios: true, optionalRightView: true, appBackWithoutHref: true, referenceViewer: true, legacyRollbackInitAndBack: true },
            touchControls: { menuReopens: true, profileViewerReopens: true, duplicatePanel: true, reducedMotion: true, android: true, ios: true } }));
    } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
