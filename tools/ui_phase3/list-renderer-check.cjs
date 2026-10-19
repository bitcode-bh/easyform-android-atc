const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),acorn=require('acorn');
const root=path.resolve('EasyFormSE_finance/assets/www2'),relative='EFSE_Js/viewsitelist_pm.js';
const old=cp.execFileSync('git',['show','f6ae3a2:EasyFormSE_finance/assets/www2/'+relative],{encoding:'utf8'});
const next=fs.readFileSync(path.join(root,relative),'utf8');
function fn(source){
 let match;function visit(node){if(!node||typeof node!=='object'||match)return;if(node.type==='FunctionDeclaration'&&node.id.name==='onsuccess_get_list_of_pm_sites')match=node;else Object.values(node).forEach(value=>Array.isArray(value)?value.forEach(visit):visit(value));}
 visit(acorn.parse(source,{ecmaVersion:'latest'}));if(!match)throw Error('Missing task renderer');
 return 'var w=window, options={},state=window,actions=window;function savedLists(){return window.AppPhase1Lists;}\n'+source.slice(match.start,match.end);
}
const before=fn(old),after=fn(next);
const groupPath='EFSE_Js/viewsitelist_pm_grouplist.js';
const oldGroup=cp.execFileSync('git',['show','f6ae3a2:EasyFormSE_finance/assets/www2/'+groupPath],{encoding:'utf8'});
const newGroup=fs.readFileSync(path.join(root,groupPath),'utf8');
function groupFns(source){
 const wanted=['onsuccess_get_list_of_pm_checksheets','remove_unused_object_from_global_var','savedLists'],found=[];
 function visit(node){if(!node||typeof node!=='object')return;if(node.type==='FunctionDeclaration'&&wanted.includes(node.id.name))found.push(source.slice(node.start,node.end));else Object.values(node).forEach(value=>Array.isArray(value)?value.forEach(visit):visit(value));}
 visit(acorn.parse(source,{ecmaVersion:'latest'}));return 'var w=window,options={};\n'+found.join('\n');
}

const fixture=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/Framework7-1.4.2/dist/css/Css_f7.css"><link rel="stylesheet" href="/css/form_style.css"><link rel="stylesheet" href="/css/task_list_theme.css"><script src="/Plugin_Js/jquery-3.5.1.min.js"></script><script src="/EFSE_Js/controls-ele.js"></script></head><body><div id="tab1"><ul id="site_list"></ul></div><ul id="lst_filter"></ul><button id="btn_Create_Task"></button></body></html>`;
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),external=[];
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!=='http://mwfm-render.test'){external.push(url.origin);return route.abort();}if(url.pathname==='/fixture')return route.fulfill({contentType:'text/html',body:fixture});const file=path.resolve(root,'.'+url.pathname);return file.startsWith(root+path.sep)&&fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
 for(const config of [{name:'dynamic'},{name:'static',staticdata:'Tenant'},{name:'distance-asc',orderby:'distance',order_type:'asc'},{name:'distance-desc',orderby:'distance',order_type:'desc'},{name:'missing-column',missing:true},{name:'pagination',pagination:true},{name:'400-rows',count:400},{name:'switch-off',indexed:false},{name:'alternate-tints',alternate:true},{name:'actions-and-media',actions:true,media:true},{name:'bulk-selection',bulk:true},{name:'shortcut-buttons',buttons:true},{name:'malformed-last-record',malformed:true}]){
 const results=[];
 for(const source of [before,after]){
  await page.goto('http://mwfm-render.test/fixture');await page.addScriptTag({url:'/EFSE_Js/common-functions.js'});
  await page.evaluate(config=>{
   const fields=[{position:1,font_size:11,checksheetID:100,step:1,format:'normal',border:'false',color:'#000000',header:'Site',header_view:'true',qid:config.missing?99:1,system_var:'',is_hide:'false'}, {position:2,font_size:11,checksheetID:100,step:1,format:'normal',border:'false',color:'#000000',header:'Asset',header_view:'true',qid:2,system_var:'',is_hide:'false'}];
   const flow={bulk_approval:config.bulk?'true':'false',bulk_approval_status:[],alternate_list_color:config.alternate?['#e0f2fe','#eff6ff']:undefined,buttons:config.buttons?[{placement:'task',view_dependancy:'always',checksheet_id:0,status:1,name:'Action',submit_message:'Synthetic'}]:[],columndata:fields,staticdata:config.staticdata||'',task_removable:config.actions?'true':'false',task_editable:config.actions?'true':'false',task_clickable:'true',weather_display:'false',customer_info:'false',CommentUI:'false',site_route:'false',status:[],geofence:[{value:'false',show_distance:'false'}],pdf_site_list:'false',navigation:'false',approval_status:2,rejection_status:3,order_type:config.order_type||'asc',orderby:config.orderby||'',view_submit_button:'false',colwise_align:'true',taskview_label:'true',taskview_align:'left',task_layout:'cardview',task:'false',sub_task_limit:1000,main_task_limit:1000};
   const values={list_json:JSON.stringify([flow]),tab_index:0,flow_Array:[{wayflow:1}],curr_btn_mode:'',company_id:1,siteid:1,sitename:'Synthetic',role_id:1};
   window.storage={getItem:key=>JSON.stringify(values[key]??null),setItem:(key,value)=>values[key]=JSON.parse(value)};
   window.AppShell={settings:()=>({enabled:true,pages:{'selection_survey.html':config.indexed!==false}})};window.itemObj=new MKCheckItem();window.trip_New_Array=[];window.glob_statusName_ary={0:'Open'};window.glob_statusColor_ary={Open:'#ecedef'};window.glob_textColor_ary={Open:'#0d1829'};window.errors=[];window.alert1=e=>errors.push(String(e));window.alert=alert1;window.loading_hide=()=>{};window.enable_back_button=()=>{};window.get_list_of_UP_sites_count=()=>{};
   Object.assign(window,{user_lat:28,user_long:77,user_accuracy:1,F7_device:'android',default_range:20,limit_range:config.pagination?40:20,upload_pending_count:0,ddl_cnt:0,no_udf_id_found:0,task_refresh_timer:undefined,system_var_Array:{},map_latlong_Array:[],map_index:0,near_site_Array:[],tid_Array:[],curr_btn_mode:'',list_data:[flow],active_Tab:0});
   window.cordova={exec:()=>{throw Error('Unexpected native request');}};window.setTimeout=()=>1;window.clearTimeout=()=>{};
   localStorage.setItem('filter_ddl_Array','[]');localStorage.setItem('is_subflow','false');
   if(config.pagination)$('#site_list').append('<li id="existing">Previous page</li>');
   window.testRows=[];
   for(let i=0;i<(config.count||3);i++)testRows.push({tid:i%2===0?i:i.toString(),step:1,c_id:100,f_data:JSON.stringify([{data:JSON.stringify([{que_id:1,prop:[{name:'Site'}],type:1,ans:['Site '+i]},{que_id:2,prop:[{name:'Asset'}],type:1,ans:['Asset '+i]}])}]),lat:28+i/10000,long:77+i/10000,status:0,rate:0,udf_id:1,flag:0,siteid:i+1,moduleid:1,module_name:'Demo',response_status:1,is_delete_photo:'',is_delete_log:'',is_delete_sub:'',is_valid_log:'',site_name:'Site '+i,p_tid:0,server_task_id:i+100,survey_date:'2026-10-18',list_html:'',task_setting:''});
   if(config.media)testRows[0].is_delete_photo=JSON.stringify([{c_name:'Synthetic',s_name:'Photo',checksheet_type:0}]);
   if(config.malformed)testRows[testRows.length-1].is_delete_photo='{';
   window.bulkCalls=0;window.get_selected_chk_count=()=>bulkCalls++;window.show_bulk_approval_panel=()=>{};
   // A second step belonging to the same task must retain its original index.
   testRows.push({...testRows[0],step:2,tid:'0'});
  },config);
  await page.addScriptTag({content:source});
  const result=await page.evaluate(config=>{const changes=new MutationObserver(()=>{});changes.observe(document.getElementById('site_list'),{childList:true});onsuccess_get_list_of_pm_sites(JSON.stringify(testRows));const insertions=changes.takeRecords().filter(r=>r.addedNodes.length).length;changes.disconnect();
   const result={html:$('#site_list').html(),filters:$('#lst_filter').html(),filterData:localStorage.getItem('filter_ddl_Array'),errors:errors.slice(),count:$('#site_list > li').length};
   let heldCalls=null;if(config.bulk){onsuccess_get_list_of_pm_sites(JSON.stringify(testRows));bulkCalls=0;$('#site_list > li:first').trigger('taphold');heldCalls=bulkCalls;}
   const control=document.querySelector('.cls_remove');const handlers=control?($._data(control,'events')?.click?.length||0):null;
   return {result,insertions,heldCalls,handlers};},config);
  results.push(result);
 }
 console.log(JSON.stringify({case:config.name,beforeCount:results[0].result.count,afterCount:results[1].result.count,beforeInsertions:results[0].insertions,afterInsertions:results[1].insertions,beforeErrors:results[0].result.errors,afterErrors:results[1].result.errors}));
 assert.deepEqual(results[1].result,results[0].result,config.name+' must preserve all rows, handlers, labels, filters and errors');if(!config.staticdata&&!config.missing&&!config.malformed)assert.match(results[1].result.html,/Site 0/,'real form answers must be rendered');if(config.malformed)assert.equal(results[1].result.errors.length,1,'partial rows survive a later malformed record');else assert.deepEqual(results[1].result.errors,[],config.name+' fixture must exercise the complete renderer');
 assert.equal(results[1].insertions,config.indexed===false?results[0].insertions:1,'enabled builder inserts its response once');
 if(config.actions)assert.equal(results[1].handlers,1,'one propagation handler per control');
 if(config.bulk){assert.equal(results[0].heldCalls,2,'legacy repeated responses duplicate long-press callbacks');assert.equal(results[1].heldCalls,1,'one long-press action per event after pagination');}
 }
 for(const config of [{name:'checksheet-default'},{name:'checksheet-merge',merge:true},{name:'checksheet-role',merge:true,roles:true},{name:'checksheet-switch-off',merge:true,indexed:false}]){
 const results=[];
 for(const [version,source] of [groupFns(oldGroup),groupFns(newGroup)].entries()){
  await page.goto('http://mwfm-render.test/fixture');await page.addScriptTag({url:'/EFSE_Js/common-functions.js'});
  await page.evaluate(config=>{
   document.body.insertAdjacentHTML('beforeend','<ul id="checksheet_list"></ul><div id="tbl_chk_details"></div>');
   window.assertUnchanged=(name,value)=>{if(window[name]!==value)throw Error('Checksheet render changed another page counter: '+name);};window.assertCounterIsolation=config.isCurrent;window.counterSentinels=Object.fromEntries(['y','j','k','g','k1','dm','b','s'].map(name=>[name,{owner:'another page'}]));Object.assign(window,counterSentinels);
   const flow={status:[0,1],checklist_geofence:'false',gb_by_status:'true',gb_check:'false',dynamic_checklist:'false',tat:'false',status_checksheet_only:'false',completed_editable:'true',buttons:[],go_nogo:'false'};
   const checklist=Array.from({length:3},(_,i)=>({checksheetid:100+i,c_name:'Check '+i,start_status:0,end_status:1,is_mandatory:1,is_submited:0,is_disabled:0,role_id:config.roles&&i===2?'':1,is_flow:0,sub_flow_id:0,last_step:1,Group_Name:'',order_id:i,is_online:0,is_icon_display:'true'}));
   const existing=checklist.map((row,i)=>({...row,checksheetid:String(row.checksheetid),start_status:'0',role_id:row.role_id===''?'':'1',is_submited:i===0?1:0}));
   existing.push({...existing[0],role_id:2,checksheetid:999});
   const values={list_json:JSON.stringify([flow]),task_data_column:checklist,role_id:1,flow_Array:[{wayflow:1}],curr_btn_mode:'back',server_task_id:123,cust_flow_Array:[]};
   window.storage={getItem:key=>JSON.stringify(values[key]??null),setItem:(key,value)=>values[key]=JSON.parse(value)};
   window.AppShell={settings:()=>({enabled:true,pages:{'viewsitelist_pm_grouplist.html':config.indexed!==false}})};
   window.errors=[];window.navigations=[];window.alert1=e=>errors.push(String(e));window.alert=alert1;window.loading_hide=()=>{};window.enable_back_button=()=>{};window.changeurl=page=>navigations.push(page);window.back_button=()=>navigations.push('back');
   window.check_old_task_for_checksheet=()=>navigations.push('open');window.toggle_checksheet_by_punchin_punchout=()=>{};window.toggle_checksheet_by_pause_continue=()=>{};
   window.cordova={exec:()=>{throw Error('Unexpected native request');}};window.setTimeout=()=>1;window.clearTimeout=()=>{};
   Object.assign(window,{in_ms:0,duration:0,last_var_obj:null,geofence_by:'customer',last_query:'synthetic'});
   localStorage.setItem('redirect_on_checksheet','false');
   window.testRows=[{server_task_id:123,status:0,global_var:config.merge?JSON.stringify([{checksheet_dependency:[],checklist:existing}]):'',Dynamic_Globalvar:'',survey_date:'2026-10-18',upload_date:'2026-10-18',punch_flag:0,in_ms:0,out_ms:0,duration:0,site_name:'Synthetic',tower_type:''}];
   window.resultValues=values;
  },{...config,isCurrent:version===1});
  await page.addScriptTag({content:source});
  results.push(await page.evaluate(()=>{onsuccess_get_list_of_pm_checksheets(JSON.stringify(testRows));if(assertCounterIsolation)for(const [name,value]of Object.entries(counterSentinels))assertUnchanged(name,value);return {html:$('#checksheet_list').html(),checklist:resultValues.new_checklist,errors:errors.slice(),navigations:navigations.slice(),count:$('#checksheet_list > li').length};}));
 }
 console.log(JSON.stringify({case:config.name,beforeCount:results[0].count,afterCount:results[1].count,beforeErrors:results[0].errors,afterErrors:results[1].errors}));
 assert.deepEqual(results[1],results[0],config.name+' must preserve saved states, role filtering and action handlers');assert.deepEqual(results[1].errors,[],config.name+' fixture must exercise the complete renderer');
 }
 assert.deepEqual(external,[]);
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
