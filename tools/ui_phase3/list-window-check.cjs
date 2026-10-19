const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve('EasyFormSE_finance/assets/www2');
const taskPageStyles = [...fs.readFileSync(path.join(root, 'selection_survey.html'), 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]).join('\n');
const fixture = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/Framework7-1.4.2/dist/css/Css_f7.css"><link rel="stylesheet" href="/css/styles_low.css"><link rel="stylesheet" href="/css/form_style.css"><link rel="stylesheet" href="/css/task_list_theme.css"><style>${taskPageStyles}</style>
<style>.page-content{position:static;height:100vh;overflow:auto;padding:0}li.task_cardview{list-style:none}.cls_search{white-space:normal}ul{padding:0;margin:0}</style>
<script>var flag=false;var AppShell={settings:()=>({enabled:true,pages:{'selection_survey.html':flag}})};</script>
<script src="/Plugin_Js/jquery-3.5.1.min.js"></script><script src="/js/app_list_window.js"></script>
</head><body class="task-list-screen"><div class="page-content"><div class="list-block"><ul id="site_list"></ul></div></div></body></html>`;
(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
    try {
        for (const width of [320, 390, 800]) {
            const context = await browser.newContext({ viewport: { width, height: width === 800 ? 480 : 844 }, deviceScaleFactor: width === 390 ? 3 : (width === 800 ? 2 : 1), hasTouch: true, isMobile: true });
            const errors = [], external = [];
            await context.route('**/*', route => {
                const url = new URL(route.request().url());
                if (url.origin !== 'http://mwfm-local.test') { external.push(url.origin); return route.abort(); }
                if (url.pathname === '/selection_survey.html') return route.fulfill({ contentType: 'text/html', body: fixture });
                const file = path.resolve(root, '.' + url.pathname);
                if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.abort();
                return route.fulfill({ path: file });
            });
            const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
            await page.goto('http://mwfm-local.test/selection_survey.html');
            const result = await page.evaluate(async () => {
                const root = document.getElementById('site_list');
                const rows = n => Array.from({ length: n }, (_, i) => `<li class="task_cardview" id="row-${i}"><label class="label-checkbox item-content"><input class="myChecksheet" type="checkbox" value="${i}" onchange="window.lastSelection=this.value"><div class="item-inner item-no-pad"><div class="item-title" style="width:100%"><div class="readmore"><table style="width:100%"><tr><td class="cls_search">Task ${i} — Site ${i} — ${'Variable content '.repeat(i % 4 + 1)}</td></tr></table></div></div></div></label><details><summary>Details</summary><p>Same existing expandable content</p></details></li>`).join('');
                const metrics = row => { const r = row.getBoundingClientRect(), s = getComputedStyle(row); return { width: r.width, height: r.height, color: s.color, padding: s.padding, radius: s.borderRadius }; };
                root.innerHTML = rows(400);
                const handle = AppListWindow.mount(root);
                handle.refresh();
                const defaultOff = !root.classList.contains('app-list-windowed');
                const before = metrics(root.firstElementChild);
                const visibleBefore = $('#site_list > li:not(:hidden)').length;
                flag = true; handle.refresh();
                const enabled = root.classList.contains('app-list-windowed');
                await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
                const after = metrics(root.firstElementChild);
                const visibleAfter = $('#site_list > li:not(:hidden)').length;
                $('#site_list .myChecksheet').prop('checked', true);
                const allChecked = $('#site_list .myChecksheet:checked').length;
                const target = document.getElementById('row-399');
                target.scrollIntoView(); await new Promise(requestAnimationFrame);
                target.querySelector('input').click();
                const selectedLast = window.lastSelection === '399' && !target.querySelector('input').checked;
                target.querySelector('details').open = true;
                const expanded = target.getBoundingClientRect().height;
                target.querySelector('details').open = false;
                const collapsed = target.getBoundingClientRect().height;
                root.querySelectorAll('li').forEach((row, i) => { row.style.display = i === 399 ? '' : 'none'; });
                const filtered = $('#site_list > li:not(:hidden)').length;
                root.innerHTML = rows(200); handle.refresh();
                const shortListNormal = !root.classList.contains('app-list-windowed');
                root.insertAdjacentHTML('beforeend', rows(1));
                await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
                const appendedActivates = root.classList.contains('app-list-windowed');
                flag = false; handle.refresh();
                const killed = !root.classList.contains('app-list-windowed');
                let cleanups = [];
                const scoped = document.createElement('ul'); document.body.appendChild(scoped);
                for (let i = 0; i < 400; i++) {
                    const h = AppListWindow.mount(scoped, { enabled: () => true, scope: { defer: fn => cleanups.push(fn) } });
                    h.dispose();
                }
                const allCleanupIdempotent = cleanups.every(fn => { fn(); return true; });
                scoped.remove(); handle.dispose();
                const originalSupports = CSS.supports.bind(CSS); CSS.supports = () => false;
                root.innerHTML = rows(201); flag = true;
                const unsupported = AppListWindow.mount(root); unsupported.refresh();
                const unsupportedNormal = !root.classList.contains('app-list-windowed');
                unsupported.dispose(); CSS.supports = originalSupports;
                return { defaultOff, enabled, before, after, visibleBefore, visibleAfter, allChecked, selectedLast,
                    detailsExpand: expanded > collapsed, filtered, shortListNormal, appendedActivates, killed, allCleanupIdempotent, unsupportedNormal };
            });
            console.log(JSON.stringify({ width, ...result }));
            assert.equal(result.defaultOff, true); assert.equal(result.enabled, true);
            assert.deepEqual(result.after, result.before, 'visible row layout and styling are unchanged');
            assert.equal(result.visibleBefore, 400); assert.equal(result.visibleAfter, 400);
            assert.equal(result.allChecked, 400); assert.equal(result.selectedLast, true);
            assert.equal(result.detailsExpand, true); assert.equal(result.filtered, 1);
            for (const key of ['shortListNormal', 'appendedActivates', 'killed', 'allCleanupIdempotent', 'unsupportedNormal']) assert.equal(result[key], true, key);
            await page.evaluate(() => { flag = true; AppListWindow.mount(document.getElementById('site_list')).refresh(); });
            await page.emulateMedia({ media: 'print' });
            assert.equal(await page.locator('#site_list > li').first().evaluate(el => getComputedStyle(el).contentVisibility), 'visible', 'print draws all rows');
            assert.deepEqual(errors, []); assert.deepEqual(external, []);
            if (width === 390) {
                await page.addScriptTag({ url: '/EFSE_Js/common-functions.js' });
                await page.evaluate(() => { window.originalAutofill = autofill_data_by_class; window.originalPdfPreview = redirect_page_pdf_preview; });
                await page.addScriptTag({ url: '/EFSE_Js/get_dynamic_dropdown.js' });
                await page.addScriptTag({ url: '/EFSE_Js/get_upload_pdf.js' });
                const shared = await page.evaluate(() => {
                    const node = document.createElement('div'); node.className = 'photoField'; node.id = 'div_cbtn_test'; node.setAttribute('que_id', '42');
                    const img = document.createElement('img'); img.id = 'cbtn_test'; node.appendChild(img); document.body.appendChild(node);
                    window.storage = { getItem: () => '0' }; window.photoAutofill = [];
                    window.check_photo_entry_for_autofill = (...args) => photoAutofill.push(args);
                    const src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22/%3E';
                    autofill_data_by_class('photoField', [src]);
                    return { sameAutofill: originalAutofill === autofill_data_by_class, samePdf: originalPdfPreview === redirect_page_pdf_preview,
                        photoFilled: img.src === src, nativeDelegate: photoAutofill.length === 1 && photoAutofill[0][2] === '42' && photoAutofill[0][3] === 'cbtn_test' };
                });
                assert.deepEqual(shared, { sameAutofill: true, samePdf: true, photoFilled: true, nativeDelegate: true });
                console.log(JSON.stringify({ sharedHelpers: shared }));
            }
            assert.deepEqual(errors, []);
            await context.close();
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
