// Real checksheet template/controller inside the shell. Synthetic read-only data;
// all external requests blocked. No device/database writes or screenshots.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve('EasyFormSE_finance/assets/www2'), C = 'viewsitelist_pm_grouplist.html';
const shell = fs.readFileSync(path.join(root, 'app-shell.html'), 'utf8');
function seed(options) {
    return `
    window.qa={native:[],held:[],errors:[],requests:[],counter:0};
    const settings={status:[0,1],checklist_geofence:'false',gb_by_status:'true',dynamic_checklist:'false',tat:'false',status_checksheet_only:'false',completed_editable:'true',buttons:[],go_nogo:'false',${options.unsupported ? "punching:'true'" : ''}};
    const mapping=Array.from({length:${options.count || 3}},(_,i)=>({checksheetid:100+i,c_name:i===1?"Worker's checklist":'Check '+i,start_status:0,end_status:1,is_mandatory:1,is_submited:0,is_disabled:0,role_id:1,is_flow:0,sub_flow_id:0,last_step:1,Group_Name:'',order_id:i,is_online:0,is_icon_display:'true',Checksheet_Icon:'list'}));
    window.qa.mapping=JSON.stringify(mapping);
    Object.entries({company_id:1,user_id:2,username:'Synthetic',global_wcf_url:'https://example.invalid/api/',F7_device:'android',role_id:1,wayflow:10,flow_Array:[{wayflow:10}],list_json:JSON.stringify([settings]),task_data_column:mapping,tid:11,curr_btn_mode:'back',server_task_id:123,cust_flow_Array:[],profile_pic_path:'images/profile_pic.png'}).forEach(([key,value])=>storage.setItem(key,JSON.stringify(value)));
    AppPhase1.preview({press:true,motion:true,notices:true,lazyScripts:true,savedLists:true});
    AppShell.preview({enabled:true,pages:{'selection_survey.html':true,'${C}':${options.enabled}}});
    AppShell.register('selection_survey.html',{
      create(d,ctx){const node=d.createElement('div');node.innerHTML='<div class="page-content" data-shell-scroll><input type="search" data-shell-state="search"><div style="height:1600px">Synthetic task-list predecessor</div></div>';return node;},
      open(ctx){qa.counter++;}
    });
    `;
}
const mime = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
    try {
        for (const options of [{ width: 320, enabled: true }, { width: 390, enabled: true }, { width: 320, enabled: true, count: 400 }, { width: 390, enabled: true, count: 400 }, { width: 390, enabled: true, unsupported: true }, { width: 390, enabled: false }]) {
            const context = await browser.newContext({ viewport: { width: options.width, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: options.width === 320 ? 'reduce' : 'no-preference',
                userAgent: 'Mozilla/5.0 (Linux; Android 17) AppleWebKit/537.36 Chrome/154 Mobile Safari/537.36' });
            const requests = [], external = [], errors = [], missing = [];
            await context.route('**/*', route => {
                const url = new URL(route.request().url());
                if (url.protocol === 'data:') return route.continue();
                if (url.origin !== 'http://mwfm-pages.test') { external.push(url.origin); return route.abort(); }
                const name = decodeURIComponent(url.pathname).slice(1); requests.push(name);
                if (name === 'app-shell.html') return route.fulfill({ contentType: 'text/html', body: shell.replace('// Existing shared helpers', seed(options) + '\n// Existing shared helpers') });
                if (name === C && route.request().resourceType() === 'document') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body>Legacy checksheet fallback</body></html>' });
                if (name === 'cordova.js') return route.fulfill({ contentType: 'application/javascript', body: `
                    window.cordova={exec(success,failure,service,action,args){
                      if(service!=='SqlitePlugin'||action!=='showValues')throw Error('Unexpected native write or service');
                      const query=args[0].data;qa.native.push(query);
                      if(/from flow_master/i.test(query))setTimeout(()=>success(JSON.stringify([{data:qa.mapping}])),0);
                      else if(/select punch_flag/i.test(query))setTimeout(()=>success(JSON.stringify([{punch_flag:0,in_ms:0,out_ms:0,duration:0,site_name:'Synthetic',server_task_id:123,survey_date:'10/19/2026',global_var:null,Dynamic_Globalvar:'',status:0,upload_date:'10/19/2026',tower_type:''}])),0);
                      else if(/from task_master/i.test(query))qa.held.push([success,failure]);
                      else throw Error('Unexpected native query: '+query);
                    }};
                    document.addEventListener('DOMContentLoaded',()=>document.dispatchEvent(new Event('deviceready')));
                ` });
                if (name === 'js/app_pages.js') return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(root,name),'utf8').replace('    w.AppShell.register(taskPage, { load: loadTasks });','') });
                const file = path.resolve(root, name);
                if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { missing.push(name); return route.fulfill({ status: 404, body: '' }); }
                return route.fulfill({ body: fs.readFileSync(file), contentType: mime[path.extname(file)] || 'application/octet-stream' });
            });
            const page = await context.newPage(); page.setDefaultTimeout(10000); page.on('pageerror', error => errors.push(error.message));
            await page.goto('http://mwfm-pages.test/app-shell.html?route=selection_survey.html');
            await page.waitForFunction(() => AppShell.diagnostics().active === 'selection_survey.html' && !document.querySelector('.app-shell-enter'));
            await page.evaluate(() => {
                const input=document.querySelector('[data-shell-state=search]');input.value='Retained filter';document.querySelector('.app-shell-page .page-content').scrollTop=225;
                const outside=document.createElement('div');outside.id='unrelated-page';outside.innerHTML='<div class="list-block"><ul id="checksheet_list"><li>Unrelated page</li></ul></div>';document.body.appendChild(outside);
                window.qa.outsideRadius=getComputedStyle(outside.querySelector('li')).borderRadius;
                changeurl('viewsitelist_pm_grouplist.html');
            });
            if (!options.enabled || options.unsupported) {
                await page.waitForURL('**/' + C);
                assert.equal(await page.locator('body').innerText(), 'Legacy checksheet fallback');
                const reason = await page.evaluate(() => JSON.parse(sessionStorage.getItem('mwfm_shell_last_boot')).reason);
                assert.equal(reason, options.enabled ? 'page-unsupported' : 'page-disabled');
                if (!options.enabled) assert.equal(requests.includes('EFSE_Js/viewsitelist_pm_grouplist.js'), false, 'rollout off does not load the controller');
            } else {
                await page.waitForFunction(() => AppShell.diagnostics().active === 'viewsitelist_pm_grouplist.html' && !document.querySelector('.app-shell-enter'));
                const initial = await page.evaluate(() => {
                    const root=document.querySelector('.app-checksheet-page');const list=root.querySelector('#checksheet_list');
                    return { rows:list.children.length,text:list.children[1].textContent,inline:root.querySelectorAll('[onclick]').length,
                        outside:document.querySelector('#unrelated-page li').textContent,outsideRadius:getComputedStyle(document.querySelector('#unrelated-page li')).borderRadius,
                        expectedOutsideRadius:qa.outsideRadius,legacyExports:typeof window.check_old_task_for_checksheet,nativeCalls:qa.native.length,
                        readyBack:getComputedStyle(root.querySelector('#btn_page_back')).visibility,id:root.id };
                });
                if (options.count) { assert.ok(initial.rows < 80, 'long checksheet list has a bounded DOM'); assert.equal(await page.locator('.app-checksheet-page [aria-setsize]').first().getAttribute('aria-setsize'),String(options.count)); } else assert.equal(initial.rows,3);assert.match(initial.text,/Worker's checklist/);assert.equal(initial.inline,0);assert.equal(initial.outside,'Unrelated page');
                assert.equal(initial.outsideRadius,initial.expectedOutsideRadius);assert.equal(initial.legacyExports,'undefined');assert.equal(initial.nativeCalls,2);assert.equal(initial.readyBack,'visible');
                await page.locator('.app-checksheet-page #checksheet_list > li').nth(1).tap();
                assert.equal(await page.evaluate(() => JSON.parse(storage.getItem('check_type'))), '101');
                assert.equal(await page.evaluate(() => JSON.parse(storage.getItem('checksheet_name'))), "Worker's checklist");
                assert.equal(await page.evaluate(() => qa.held.length),1);
                await page.locator('.app-checksheet-page #btn_page_back').tap();
                await page.waitForFunction(() => AppShell.diagnostics().active === 'selection_survey.html' && !document.querySelector('.app-shell-enter'));
                assert.equal(await page.locator('[data-shell-state=search]').inputValue(),'Retained filter');
                assert.equal(await page.evaluate(() => document.querySelector('.app-shell-page .page-content').scrollTop),225);
                assert.equal(await page.evaluate(() => {const before=storage.getItem('tid');qa.held[0][0]('[{"tid":999,"task_id":999,"server_task_id":999}]');qa.held[0][1]('retired');return storage.getItem('tid')===before;}),true);
                await page.evaluate(() => changeurl('viewsitelist_pm_grouplist.html'));
                await page.waitForFunction(() => AppShell.diagnostics().active === 'viewsitelist_pm_grouplist.html' && !document.querySelector('.app-shell-enter'));
                const currentId=await page.locator('.app-checksheet-page').getAttribute('id');assert.notEqual(currentId,initial.id);
                assert.ok(await page.locator('.app-checksheet-page #checksheet_list > li').count() <= (options.count ? 80 : 3));
                if (options.count) {
                    await page.evaluate(() => { const scroller=document.querySelector('.app-checksheet-page .page-content'); scroller.scrollTop=scroller.scrollHeight; });
                    await page.waitForSelector('.app-checksheet-page #checksheet_499');
                    await page.locator('.app-checksheet-page #checksheet_499').tap();
                    assert.equal(await page.evaluate(() => JSON.parse(storage.getItem('check_type'))),'499');
                    assert.equal(await page.evaluate(() => document.querySelector('.app-checksheet-page #Chk_Back_399').value),'');
                    assert.ok(await page.locator('.app-checksheet-page #checksheet_list > li').count()<80);
                }
                assert.equal(requests.filter(name=>name==='EFSE_Js/viewsitelist_pm_grouplist.js').length,1);
                assert.equal(requests.filter(name=>name==='EFSE_Js/controls-ele.js').length,1);
                assert.equal(requests.filter(name=>name==='f7_navbar.html').length,1);
                await page.evaluate(() => document.dispatchEvent(new Event('backbutton',{cancelable:true})));
                await page.waitForFunction(() => AppShell.diagnostics().active === 'selection_survey.html' && !document.querySelector('.app-shell-enter'));
                assert.equal(await page.locator('.app-checksheet-page').count(),0);
            }
            assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(missing,[]);
            console.log(JSON.stringify({ ...options,passed:true,controllerLoads:requests.filter(name=>name==='EFSE_Js/viewsitelist_pm_grouplist.js').length }));
            await context.close();
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
