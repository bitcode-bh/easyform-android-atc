#!/usr/bin/env node
// Real shell/core assets, synthetic adapters only. All requests stay local.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve('EasyFormSE_finance/assets/www2');
const shell = fs.readFileSync(path.join(root, 'app-shell.html'), 'utf8');
const seed = `
Object.entries({company_id:1,user_id:2,username:'Synthetic',global_wcf_url:'https://example.invalid/api/',F7_device:'android',list_json:null,
profile_pic_path:'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22/%3E'}).forEach(([key,value])=>storage.setItem(key,JSON.stringify(value)));
window.qa={hooks:[],late:0,nativeCalls:[],nativeReadCallbacks:[],nativeReplies:0,nativeFailures:0,allowLeave:true};
AppPhase1.preview({press:true,motion:true,notices:true,lazyScripts:true,savedLists:true});
`;
const adapters = `
AppShell.preview({enabled:true,pages:{'selection.html':true,'selection_survey.html':true}});
['selection.html','selection_survey.html'].forEach(function(name){AppShell.register(name,{
create:function(d,ctx){var root=d.createElement('div');root.className='navbar-fixed toolbar-fixed';
root.appendChild(AppComponents.topBar({title:'Synthetic page',scope:ctx.scope,actions:[{label:'Settings',icon:'fa fa-user',action:function(){myApp.openPanel('left');}}]}));
var content=d.createElement('div');content.className='page-content';
content.appendChild(AppComponents.search({label:'Search fixture',stateKey:'search',placeholder:'Search',scope:ctx.scope,onInput:function(){qa.searchChanges=(qa.searchChanges||0)+1;}}));
var next=d.createElement('button');next.textContent='Next fixture';next.className='button';ctx.scope.on(next,'click',function(){changeurl('selection_survey.html')});content.appendChild(next);
content.appendChild(AppComponents.placeholder());for(var i=0;i<40;i++){var row=d.createElement('p');row.textContent='Synthetic row '+i;content.appendChild(row);}root.appendChild(content);
root.appendChild(AppComponents.bottomTabs({stateKey:'bucket',value:'pending',scope:ctx.scope,items:[{id:'pending',title:'Pending',icon:'fa fa-list'},{id:'completed',title:'Completed',icon:'fa fa-check'}]}));return root;},
reset:function(ctx){qa.hooks.push(['reset',ctx.route]);},
open:function(ctx){qa.hooks.push(['open',ctx.route]);ctx.scope.on(window,'qa-late',function(){qa.late++});ctx.scope.timeout(function(){qa.late++},60000);ctx.services.cordova.exec(function(){qa.nativeReplies++},function(){qa.nativeFailures++},'ShellLifetimeFixture','read',[]);},
canLeave:function(){return qa.allowLeave;},leave:function(ctx){qa.hooks.push(['leave',ctx.route]);},dispose:function(ctx){qa.hooks.push(['dispose',ctx.route]);}
});});
`;
function fixture(migrated) {
    return shell.replace('// Existing shared helpers', seed + (migrated ? adapters : 'AppShell.preview({enabled:true,pages:{}});') + '\n// Existing shared helpers');
}
const mime = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };

(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
    try {
        for (const reducedMotion of ['no-preference', 'reduce']) {
            for (const migrated of [false, true]) {
                const context = await browser.newContext({ viewport: { width: reducedMotion === 'reduce' ? 320 : 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion, colorScheme: 'dark',
                    userAgent: 'Mozilla/5.0 (Linux; Android 17) AppleWebKit/537.36 Chrome/154 Mobile Safari/537.36' });
                const requests = [], external = [], missing = [], errors = [];
                await context.route('**/*', async route => {
                    const url = new URL(route.request().url());
                    if (url.protocol === 'data:') return route.continue();
                    if (url.origin !== 'http://mwfm.test') { external.push(url.origin); return route.abort(); }
                    const name = decodeURIComponent(url.pathname).replace(/^\//, ''); requests.push(name);
                    if (name === 'app-shell.html') return route.fulfill({ contentType: 'text/html', body: fixture(migrated) });
                    if (name === 'cordova.js') return route.fulfill({ contentType: 'application/javascript', body: `window.cordova={exec:function(success,failure,service){if(service==='ShellLifetimeFixture'){qa.nativeReadCallbacks.push([success,failure]);return;}qa.nativeCalls.push('unexpected');throw new Error('Unexpected native request')}};document.addEventListener('DOMContentLoaded',function(){document.dispatchEvent(new Event('deviceready'));});` });
                    if (name === 'selection.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body>Legacy Home fallback fixture</body></html>' });
                    if (migrated && name === 'js/app_pages.js') return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(root,name),'utf8').replace('    w.AppShell.register(taskPage, { load: loadTasks });','') });
                    const file = path.resolve(root, name);
                    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { missing.push(name); return route.fulfill({ status: 404, body: '' }); }
                    return route.fulfill({ body: fs.readFileSync(file), contentType: mime[path.extname(file)] || 'application/octet-stream' });
                });
                const page = await context.newPage(); page.setDefaultTimeout(8000); page.on('pageerror', error => errors.push(error.message));
                await page.goto('http://mwfm.test/app-shell.html?route=selection.html');
                if (!migrated) {
                    await page.waitForURL('**/selection.html');
                    const last = await page.evaluate(() => JSON.parse(sessionStorage.getItem('mwfm_shell_last_boot')));
                    assert.equal(last.ready, true); assert.equal(last.registeredPages, 2);
                    assert.equal(last.reason, 'page-disabled'); assert.ok(Object.values(last.core).every(Boolean));
                } else {
                    await page.waitForFunction(() => AppShell.diagnostics().active === 'selection.html' && !document.querySelector('.app-shell-enter'));
                    assert.equal(await page.locator('#nav_main').count(), 1, 'existing shared menu is loaded once');
                    assert.equal(await page.evaluate(() => { qa.nativeReadCallbacks[0][0](); return qa.nativeReplies; }), 1);
                    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--app-primary').trim()), '#2a3086');
                    const design = await page.evaluate(() => {
                        const center = document.querySelector('.app-shell-topbar .center').getBoundingClientRect();
                        return { menu: getComputedStyle(document.querySelector('#nav_main')).backgroundColor,
                            photoWidth: getComputedStyle(document.querySelector('#nav_main #img_profile')).width,
                            page: getComputedStyle(document.querySelector('.app-shell-page')).backgroundColor,
                            titleCentered: Math.abs(center.left + center.width / 2 - innerWidth / 2) < 1 };
                    });
                    assert.deepEqual(design, { menu: 'rgb(244, 245, 247)', photoWidth: '64px', page: 'rgb(252, 252, 252)', titleCentered: true });
                    await page.getByRole('searchbox', { name: 'Search fixture' }).fill('helmet');
                    await page.getByRole('tab', { name: 'Completed' }).tap();
                    await page.evaluate(() => { window.qaOldSearch = document.querySelector('.app-shell-page input[type=search]'); document.querySelector('.app-shell-page .page-content').scrollTop = 300; });
                    await page.evaluate(() => changeurl('selection_survey.html'));
                    await page.waitForFunction(() => AppShell.diagnostics().active === 'selection_survey.html' && !document.querySelector('.app-shell-enter'));
                    assert.deepEqual(await page.evaluate(() => { qa.nativeReadCallbacks[0][0](); qa.nativeReadCallbacks[0][1](); qa.nativeReadCallbacks[1][0](); return [qa.nativeReplies, qa.nativeFailures]; }), [2, 0], 'departed native callbacks retire while current replies still work');
                    await page.getByRole('button', { name: 'Back', exact: true }).tap();
                    await page.waitForFunction(() => AppShell.diagnostics().active === 'selection.html' && !document.querySelector('.app-shell-enter'));
                    assert.deepEqual(await page.evaluate(() => { qa.nativeReadCallbacks.slice(0, 2).forEach(callbacks => callbacks.forEach(fn => fn())); qa.nativeReadCallbacks[2][0](); return [qa.nativeReplies, qa.nativeFailures]; }), [3, 0], 'Back gets a fresh native callback lifetime');
                    assert.equal(await page.getByRole('searchbox', { name: 'Search fixture' }).inputValue(), 'helmet');
                    assert.equal(await page.getByRole('tab', { name: 'Completed' }).getAttribute('aria-selected'), 'true');
                    assert.equal(await page.evaluate(() => document.querySelector('.app-shell-page .page-content').scrollTop), 300);
                    assert.equal(await page.evaluate(() => qa.hooks.filter(x => x[0] === 'dispose').length), 2);
                    assert.equal(await page.evaluate(() => { var before = qa.searchChanges; qaOldSearch.dispatchEvent(new Event('input')); return qa.searchChanges === before; }), true, 'departed component callbacks are released');
                    assert.equal(await page.evaluate(() => { dispatchEvent(new Event('qa-late')); return qa.late; }), 1, 'only the current page listener survives');
                    await page.evaluate(() => { qa.allowLeave = false; changeurl('selection_survey.html'); });
                    await page.waitForTimeout(30);
                    assert.equal(await page.evaluate(() => AppShell.diagnostics().active), 'selection.html');
                    await page.evaluate(() => { qa.allowLeave = true; });
                    await page.getByRole('button', { name: 'Settings', exact: true }).tap();
                    await page.waitForSelector('#nav_main.active');
                    await page.evaluate(() => { qa.input = []; ['touchend', 'click'].forEach(type => document.addEventListener(type, e => qa.input.push({ type, tag: e.target.tagName, classes: String(e.target.className) }), true)); });
                    for (let i = 0; i < 2; i++) {
                        await page.locator('#nav_main #img_profile').tap();
                        await page.waitForSelector('.photo-browser-popup.modal-in');
                        assert.equal(await page.locator('.photo-browser-popup').count(), 1);
                        if (i === 0) await page.evaluate(() => back_button('selection'));
                        else await page.locator('.photo-browser-close-link').tap();
                        await page.waitForSelector('.photo-browser-popup', { state: 'detached' });
                        await page.waitForFunction(() => Array.from(document.querySelectorAll('.popup-overlay')).every(e => getComputedStyle(e).visibility === 'hidden'));
                    }
                    await page.touchscreen.tap(page.viewportSize().width - 12, 300);
                    await page.waitForFunction(() => !document.querySelector('.panel.active')).catch(async error => {
                        console.error(JSON.stringify(await page.evaluate(() => ({
                            classes: document.body.className, allowPanelOpen: myApp.allowPanelOpen, outside: myApp.params.panelsCloseByOutside,
                            hit: String(document.elementFromPoint(innerWidth - 12, 300)?.className),
                            overlays: Array.from(document.querySelectorAll('.panel-overlay,.modal-overlay,.popup-overlay')).map(e => ({ classes: e.className, display: getComputedStyle(e).display, visibility: getComputedStyle(e).visibility, pointer: getComputedStyle(e).pointerEvents, z: getComputedStyle(e).zIndex })),
                            input: qa.input.slice(-10)
                        })))); throw error;
                    });
                    // No transitionend is emitted when a close is coalesced
                    // into the opening paint, or the popup has no transition.
                    await page.evaluate(() => {
                        const popup = document.createElement('div'); popup.id = 'qa-fast-close';
                        popup.className = 'popup remove-on-close'; popup.style.transition = 'none';
                        document.body.appendChild(popup); myApp.popup(popup); myApp.closeModal(popup);
                    });
                    await page.waitForSelector('#qa-fast-close', { state: 'detached' });
                    await page.evaluate(() => {
                        const popup = document.createElement('div'); popup.id = 'qa-reopened';
                        popup.className = 'popup'; popup.style.transition = 'none';
                        document.body.appendChild(popup); myApp.popup(popup); myApp.closeModal(popup); myApp.popup(popup);
                    });
                    await page.waitForTimeout(120);
                    assert.equal(await page.locator('#qa-reopened.modal-in').isVisible(), true, 'an older close fallback cannot hide the reopened popup');
                    await page.evaluate(() => myApp.closeModal('#qa-reopened'));
                    await page.waitForFunction(() => getComputedStyle(document.getElementById('qa-reopened')).display === 'none');
                    await page.evaluate(() => document.getElementById('qa-reopened').remove());
                    await page.evaluate(() => AppComponents.alert('<img src=x onerror=alert(1)>', 'Fixture'));
                    await page.waitForSelector('.modal.modal-in');
                    assert.equal(await page.locator('.modal-text img').count(), 0);
                    assert.match(await page.locator('.modal-text').textContent(), /<img/);
                    await page.evaluate(() => document.dispatchEvent(new Event('backbutton')));
                    await page.waitForSelector('.modal.modal-in', { state: 'detached' });
                    assert.equal(await page.evaluate(() => AppShell.diagnostics().historyDepth), 1);
                    const theme = await page.evaluate(() => {
                        AppComponents.theme('atc', 'light'); const atc = getComputedStyle(document.documentElement).getPropertyValue('--app-primary').trim();
                        AppComponents.theme('vodafone', 'light'); const vodafone = getComputedStyle(document.documentElement).getPropertyValue('--app-primary').trim();
                        AppComponents.theme('default', 'dark'); const dark = getComputedStyle(document.querySelector('.app-shell-page')).backgroundColor;
                        AppComponents.theme('default', 'light'); return { atc, vodafone, dark, nativeCalls: qa.nativeCalls.length };
                    });
                    assert.deepEqual(theme, { atc: '#d21242', vodafone: '#e60000', dark: 'rgb(8, 11, 23)', nativeCalls: 0 });
                    assert.equal(new URL(page.url()).pathname, '/app-shell.html', 'registered routes stay in the same document');
                }
                for (const core of ['cordova.js', 'Plugin_Js/jquery-3.5.1.min.js', 'Framework7-1.4.2/dist/js/framework7.min.js', 'EFSE_Js/common-functions.js', 'js/Storagefile.js', 'js/webservicecall_REST.js', 'js/app_components.js', 'f7_navbar.html']) {
                    assert.equal(requests.filter(name => name === core).length, 1, core + ' loads once per shell document');
                }
                assert.deepEqual(errors, [], 'no uncaught browser exceptions');
                assert.deepEqual(external, [], 'no external requests');
                assert.deepEqual(missing, [], 'required local assets exist');
                console.log(JSON.stringify({ migratedFixture: migrated, reducedMotion, coreLoadedOnce: true, fallbackOrBackChecksPassed: true }));
                await context.close();
            }
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
