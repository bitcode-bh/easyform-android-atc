const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve('EasyFormSE_finance/assets/www2');
const owners=['EFSE_Js/EF_Aadhar_Verification.js','EFSE_Js/EF_Bank_Verification.js','EFSE_Js/EF_User_List.js','EFSE_Js/EF_User_Update.js',
 'EFSE_Js/login.js','EFSE_Js/download_status.js','EFSE_Js/pending_status.js','EFSE_Js/viewsitelist_pm.js','EFSE_Js/cascading_drop_down.js',
 'EFSE_Js/selection_survey.js','EFSE_Js/feature_kyff_with_filter.js','EFSE_Js/get_search_control.js','EFSE_Js/get_upload_pdf.js','EFSE_Js_Server/server_viewsitelist.js'];
function harness(files=[]){
 const noop=()=>{};const chain=new Proxy(function(){},{get:(_,key)=>key==='length'?0:chain,apply:()=>chain});
 const values={company_id:1,user_id:2,role_id:7,wayflow:10,flow_Array:[{wayflow:10}],F7_device:'android'};
 const local=new Map(),native=[],requests=[],errors=[],timeouts=new Map(),windowEvents=new Map();let timer=0;
 const labels={lbl_downloading:{innerHTML:'Collecting Data...'},lbl_uploading:{innerHTML:'Uploading...'},lbl_refreshing:{innerHTML:'Refreshing...'}};
 const c=vm.createContext({console:{error:(...a)=>errors.push(a)},document:{readyState:'loading',write:noop,addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],getElementById:id=>labels[id],documentElement:{className:''},body:{}},
 navigator:{},addEventListener:(name,fn)=>{if(!windowEvents.has(name))windowEvents.set(name,[]);windowEvents.get(name).push(fn);},MutationObserver:function(){this.observe=noop;},
 localStorage:{getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,String(v)),removeItem:k=>local.delete(k)},
 storage:{getItem:k=>JSON.stringify(values[k]??null),setItem:(k,v)=>values[k]=JSON.parse(v)},
 $:chain,jQuery:chain,setTimeout:(fn,ms)=>{const id=++timer;timeouts.set(id,{fn,ms});return id;},clearTimeout:id=>timeouts.delete(id),setInterval:()=>++timer,clearInterval:noop,
 cordova:{exec:(...a)=>native.push(a)},Webservicecall_REST:function(url,data,success,failure){const record={url,data,success,failure,cancelled:0};requests.push(record);this.callOtherDomain=noop;this.cancel=()=>record.cancelled++;},
 location:{pathname:'/selection.html'},global_wcf_url:'https://example.invalid/',username:'Synthetic',uniqcode:'Synthetic',filter_checksheet_id:9,
 myApp:{popover:noop,popup:noop}});
 c.window=c;
 function load(file){vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c,{filename:file});}
 load('EFSE_Js/common-functions.js');files.forEach(load);c.loading=noop;c.loading_hide=noop;c.alert1=noop;c.alert=noop;
 return {c,values,native,requests,labels,errors,load,timeouts,dispatchWindow:(name,event)=>(windowEvents.get(name)||[]).forEach(fn=>fn(event))};
}
for(const reverse of [false,true])test('page API callbacks keep their owner in '+(reverse?'reverse':'normal')+' script order',()=>{
 const {c,requests,labels}=harness(reverse?[...owners].reverse():owners);
 for(const prefix of ['aadhar','bank','user_update']){
  const fn=prefix==='user_update'?'get_user_update_data':'get_'+prefix+'_user_data';
  const cb=prefix==='user_update'?'onsuccess_get_user_update_data':'onsuccess_get_'+prefix+'_user_data';
  c[fn]();assert.equal(requests.at(-1).success,c[cb]);assert.match(requests.at(-1).url,/WCF_select_user_master_by_userid$/);
 }
 c.get_user_list_data([]);assert.equal(requests.at(-1).success,c.onsuccess_get_user_list_data);assert.match(requests.at(-1).url,/WCF_Find_ViewUser_SearchCondition$/);
 c.get_kyff_filter_checksheet_details(12);assert.equal(requests.at(-1).success,c.onsuccess_get_kyff_filter_checksheet_details);
 c.get_checksheet_details(12,'synthetic');assert.equal(requests.at(-1).success,c.onsuccess_get_checksheet_details);assert.notEqual(requests.at(-1).success,c.onsuccess_get_kyff_filter_checksheet_details);
 c.update_download_wait_label();c.update_upload_wait_label();c.update_site_refresh_wait_label();
 assert.equal(labels.lbl_downloading.innerHTML,'Please Wait...');assert.equal(labels.lbl_uploading.innerHTML,'Please Wait...');assert.equal(labels.lbl_refreshing.innerHTML,'Please Wait...');
 c.aadhar_otp_timer=71;c.check_5_times_click();assert.equal(c.aadhar_otp_timer,71);assert.notEqual(c.login_info_click_timer,71);
 assert.equal(typeof c.timer,'undefined');assert.equal(typeof c.get_user_data,'undefined');assert.equal(typeof c.get_survey_json,'undefined');
});
test('server and form PDF downloads retain separate completion/error callbacks',()=>{
 const {c,native}=harness(['EFSE_Js/get_upload_pdf.js','EFSE_Js_Server/server_viewsitelist.js']);
 c.Download_PDFFile('file:///synthetic.pdf','synthetic.pdf');let call=native.at(-1);
 assert.equal(call[0],c.onsuccess_Download_PDFFile);assert.equal(call[1],c.onfail_Download_PDFFile);assert.equal(call[4][0].name,'synthetic.pdf');
 c.download_server_pdf('file:///synthetic.pdf');call=native.at(-1);
 assert.equal(call[0],c.onsuccess_download_server_pdf);assert.equal(call[1],c.onfail_download_server_pdf);assert.equal(call[4][0].name,'');
});
test('loading another form script preserves the deliberate shared submit/link state',()=>{
 const {c,load}=harness();c.last_submit_button_Array.push({jsonObj_old:'kept'});c.glob_livelink_Array.push({live_url:'kept'});
 for(const file of ['EFSE_Js/HandleButtons.js','EFSE_Js/online_checksheet.js','EFSE_Js/GetCheckSheet.js','EFSE_Js_Task/GetCheckSheet_Task.js'])load(file);
 assert.equal(c.last_submit_button_Array[0].jsonObj_old,'kept');assert.equal(c.glob_livelink_Array[0].live_url,'kept');
});
test('form link refresh replaces data, ignores retired callbacks, and supports leave cleanup',()=>{
 const {c,native,errors}=harness();let old=0,fresh=0;
 c.load_form_livelinks(()=>old++);const retired=native.at(-1);
 const cancel=c.load_form_livelinks(()=>fresh++);const current=native.at(-1);
 current[0]('[{"live_url":"current","download_url_path":"local"}]');retired[0]('[{"live_url":"stale"}]');
 assert.equal(old,0);assert.equal(fresh,1);assert.equal(c.glob_livelink_Array[0].live_url,'current');
 cancel();current[0]('[]');assert.equal(fresh,1);assert.equal(c.glob_livelink_Array[0].live_url,'current');
 c.load_form_livelinks(()=>fresh++);native.at(-1)[1]('unavailable');assert.equal(fresh,2);assert.equal(c.glob_livelink_Array.length,0);
 c.load_form_livelinks(()=>fresh++);native.at(-1)[0]('{bad');assert.equal(fresh,3);assert.equal(errors.length,1);assert.equal(c.glob_livelink_Array.length,0);
});
test('both form startup paths reuse the guarded loader and their own continuation',()=>{
 const {c,native}=harness(['EFSE_Js/GetCheckSheet.js','EFSE_Js_Task/GetCheckSheet_Task.js']);let normal=0,task=0;
 c.data_to_read_post=()=>normal++;c.data_to_read_task_pre=()=>task++;
 c.data_to_read();const first=native.at(-1);c.data_to_read_task();const second=native.at(-1);
 first[0]('[]');second[0]('[]');assert.equal(normal,0);assert.equal(task,1);assert.equal(native.length,2);
});
for(const depth of [1,2,3])test('nested flow selection preserves '+depth+' navigation entries and uses the correct module',()=>{
 const {c,values,native,requests}=harness(['EFSE_Js/viewsitelist_pm_grouplist.js','EFSE_Js/viewsitelist_sub_task.js','EFSE_Js/viewsitelist_sub_task_hybrid.js']);
 values.flow_Array=Array.from({length:depth},(_,i)=>({wayflow:100+i}));
 const before=JSON.stringify(values.flow_Array),module=depth===1?10:100+depth-1;
 for(const name of ['get_checklist_data_for_task','get_checklist_data_for_subtask','get_checklist_data_for_subtask_hybrid']){
  c[name]();assert.match(native.at(-1)[4][0].data,new RegExp("moduleid = '"+module+"'"));assert.equal(JSON.stringify(values.flow_Array),before);
 }
 c.send_bulk_approval_online(1,9);assert.match(native.at(-1)[4][0].data,new RegExp("moduleid = '"+module+"'"));assert.equal(JSON.stringify(values.flow_Array),before);
 c.onsuccess_get_checklist_data_for_task('[]');assert.equal(JSON.parse(requests.at(-1).data)[0].moduleid,module);assert.equal(JSON.stringify(values.flow_Array),before);
});
test('mapping cleanup preserves other roles, current ordering and the input array identity',()=>{
 const {c}=harness(['EFSE_Js/viewsitelist_pm_grouplist.js']);
 const mapped=[{checksheetid:1,start_status:'0',sub_flow_id:2},{checksheetid:'1',start_status:1,sub_flow_id:2}];
 const rows=[{role_id:7,checksheetid:'1',start_status:0,sub_flow_id:'2'}, {role_id:7,checksheetid:1,start_status:2,sub_flow_id:2}, {role_id:8,checksheetid:99}, {role_id:'7',checksheetid:1,start_status:'1',sub_flow_id:2}];
 const expected=[rows[0],rows[2],rows[3]];const actual=c.remove_unused_object_from_global_var(mapped,rows);
 assert.equal(actual,rows);assert.deepEqual(rows,expected);
});
test('row indexing matches legacy equality, duplicate order and original source indices',()=>{
 const {c}=harness();const object={valueOf:()=>3};
 for(const ids of [[1,'1',2,2,'__proto__'],['001',1,'1',0,'',false,null,undefined,NaN],['9007199254740992','9007199254740993',9007199254740992],[object,3,'3'],[]]){
  const rows=ids.map(tid=>({tid})),expected=[];
  rows.forEach((r,i)=>{if(!expected.some(j=>rows[j].tid==r.tid))expected.push(i);});
  const index=c.index_list_rows(rows,'tid');assert.deepEqual(Array.from(index.firstIndices),expected);
  for(const query of [...ids,'absent'])assert.deepEqual(Array.from(index.indices(query)),rows.flatMap((r,i)=>r.tid==query?[i]:[]));
 }
 const rows=[{id:1,status:'0',role:2},{id:'1',status:1,role:2},{id:1,status:0,role:'2'},{id:1,status:0,role:3}];
 assert.deepEqual(Array.from(c.index_list_rows(rows,['id','status','role']).indices(['1',0,2])),[0,2]);
});
test('row inspection grows linearly when task count doubles',()=>{
 const {c}=harness();function inspect(n){let reads=0;const rows=Array.from({length:n},(_,i)=>({get tid(){reads++;return i;}}));
  const index=c.index_list_rows(rows,'tid');index.ids.forEach(id=>index.indices(id));return reads;}
 const small=inspect(400),large=inspect(800);assert.ok(small<=400*5);assert.ok(large<=small*2.1);
 console.log(JSON.stringify({indexedTaskRows:{rows400:small,rows800:large},legacyFullScans:{rows400:400*400,rows800:800*800}}));
});

test('list indexing obeys the existing per-page server switch',()=>{
 const {c}=harness();const page='selection_survey.html';let config={enabled:false,pages:{[page]:true}};
 c.AppShell={settings:()=>config};
 function reads(){let count=0;const rows=Array.from({length:100},(_,i)=>({get tid(){count++;return i;}}));
  const index=c.index_list_rows(rows,'tid',page);index.ids.forEach(id=>index.indices(id));return count;}
 const disabled=reads();config={enabled:true,pages:{}};assert.equal(reads(),disabled);
 config.pages[page]=true;assert.ok(reads()<disabled/10);
 config.pages[page]=false;assert.equal(reads(),disabled);
});

function checksheetHarness(flow={}) {
 const h=harness(['EFSE_Js/viewsitelist_pm_grouplist.js']);
 h.c.$=()=>({val:()=>'',html:()=>{},text:()=>{}});
 h.values.list_json=JSON.stringify([{group_task_column:'',checksheet_start_step:[{id:9,step:'first'},{id:10,step:'first'}],...flow}]);
 h.values.tid=1;h.values.check_type=9;
 h.navigations=[];h.notices=[];h.c.changeurl=url=>h.navigations.push(url);h.c.alert1=message=>h.notices.push(String(message));
 h.open=id=>h.c.check_old_task_for_checksheet(id,'Synthetic',100,0,1,3,0,'false',1,0,0,0,0,'','false');
 h.row=tid=>JSON.stringify([{tid,task_id:tid,server_task_id:100+tid}]);
 return h;
}
test('a superseded checksheet tap cannot overwrite the selected task or open a form',()=>{
 const h=checksheetHarness();h.open(9);const old=h.native.at(-1);h.open(10);const current=h.native.at(-1);
 old[0](h.row(7));old[1]('retired failure');
 assert.equal(h.values.tid,1);assert.equal(h.values.check_type,10);assert.deepEqual(h.navigations,[]);assert.deepEqual(h.notices,[]);
 current[0](h.row(8));assert.equal(h.values.tid,8);assert.deepEqual(h.values.step_Array_to_read,[1]);assert.deepEqual(h.navigations,['viewsitedata.html']);
});
test('a retired last-step native response cannot replace the newer checksheet steps',()=>{
 const h=checksheetHarness({checksheet_start_step:[{id:9,step:'last_blank'},{id:10,step:'last_blank'}]});
 h.open(9);h.native.at(-1)[0](h.row(2));const oldStep=h.native.at(-1);
 h.open(10);h.native.at(-1)[0](h.row(3));const currentStep=h.native.at(-1);
 oldStep[0]('[{"step":7}]');oldStep[1]('retired failure');assert.equal(h.values.step_Array_to_read,undefined);assert.deepEqual(h.navigations,[]);
 currentStep[0]('[{"step":3}]');assert.deepEqual(h.values.step_Array_to_read,[1,2,3]);assert.equal(h.values.check_type,10);assert.deepEqual(h.navigations,['viewsitedata.html']);
});
test('group-task server replies retain the checksheet selection that requested them',()=>{
 const h=checksheetHarness({group_task_column:[{header:'Synthetic'}]});
 h.open(9);h.native.at(-1)[0](h.row(2));const old=h.requests.at(-1);
 h.open(10);h.native.at(-1)[0](h.row(3));const current=h.requests.at(-1);
 assert.match(current.url,/WCF_GetMaxstep$/);assert.equal(JSON.parse(current.data)[0].Checksheet_Id,10);
 old.success({responseText:'[{"status":1,"data":8}]'});old.failure('retired failure');assert.equal(h.values.step_Array_to_read,undefined);assert.deepEqual(h.navigations,[]);assert.deepEqual(h.notices,[]);
 current.success({responseText:'[{"status":1,"data":2}]'});assert.deepEqual(h.values.step_Array_to_read,[1,2]);assert.deepEqual(h.navigations,['viewsitedata.html']);
});
test('page leave retires checksheet navigation and its display-only punch clock',()=>{
 const h=checksheetHarness();h.open(9);const pending=h.native.at(-1);
 h.c.in_ms=Date.now();h.c.duration=0;h.c.continous_update_punch_milli();assert.ok(h.timeouts.size>0);
 h.dispatchWindow('pagehide');assert.equal(h.timeouts.size,0);
 pending[0](h.row(8));pending[1]('retired failure');assert.equal(h.values.tid,1);assert.deepEqual(h.navigations,[]);assert.deepEqual(h.notices,[]);
});
test('opening another checksheet resets its configured first/last-step choice',()=>{
 const h=checksheetHarness({checksheet_start_step:[{id:9,step:'first'}]});
 h.values.check_type=9;h.c.onsuccess_check_old_task(h.row(1));
 assert.deepEqual(h.values.step_Array_to_read,[1]);assert.deepEqual(h.navigations,['viewsitedata.html']);assert.equal(h.native.length,0);
 h.values.check_type=10;h.c.onsuccess_check_old_task(h.row(1));
 assert.equal(h.native.length,1);assert.match(h.native[0][4][0].data,/from f_master where tid = '1' and f_value = '10'/i);
 h.native[0][0]('[{"step":3}]');assert.deepEqual(h.values.step_Array_to_read,[1,2,3]);
 assert.deepEqual(h.navigations,['viewsitedata.html','viewsitedata.html']);assert.equal(h.c.start_step,undefined);
});
test('checksheet lookup and step/geofence loops leave another page counter untouched',()=>{
 const h=checksheetHarness();const i={owner:'other page'},g={owner:'other page'};h.c.i=i;h.c.g=g;
 h.values.new_checklist=[{checksheetid:10,start_status:0,role_id:7,is_submited:1}];
 assert.equal(vm.runInContext('get_is_submitted_from_global_var(10,0,7)',h.c),1);assert.equal(h.c.i,i);
 h.c.onsuccess_get_last_log_step_for_chekchseet('[{"step":3}]');assert.deepEqual(h.values.step_Array_to_read,[1,2,3]);assert.equal(h.c.i,i);
 h.c.onfail_get_last_log_step_for_chekchseet('not found');assert.deepEqual(h.values.step_Array_to_read,[1]);assert.equal(h.c.i,i);
 h.values.list_json=JSON.stringify([{checklist_geofence:'true',checklist_geo_data:[{ref_check_type:0},{ref_check_type:3,ref_checksheet_id:88}]}]);
 h.c.get_task_json_for_getting_cl_latlong=()=>{};h.c.get_checklist_data_for_task_post();assert.equal(h.values.cust_checksheet_id,88);assert.equal(h.c.g,g);
});

test('leaving a group checksheet cancels its read request and suppresses later callbacks',()=>{
 const h=checksheetHarness({group_task_column:[{header:'Synthetic'}]});
 h.open(9);h.native.at(-1)[0](h.row(2));const old=h.requests.at(-1);h.open(10);assert.equal(old.cancelled,1);
 h.native.at(-1)[0](h.row(3));const pending=h.requests.at(-1);h.dispatchWindow('pagehide');assert.equal(pending.cancelled,1);
 pending.success({responseText:'[{"status":1,"data":2}]'});pending.failure('retired');assert.deepEqual(h.navigations,[]);assert.deepEqual(h.notices,[]);
});
test('cached-page leave retires pending navigation while preserving the display timer for restore',()=>{
 const h=checksheetHarness();h.open(9);const request=h.native.at(-1);
 h.c.in_ms=Date.now();h.c.duration=0;h.c.continous_update_punch_milli();const [id,tick]=h.timeouts.entries().next().value;
 h.dispatchWindow('pagehide',{persisted:true});assert.equal(h.timeouts.size,1);
 request[0](h.row(8));assert.equal(h.values.tid,1);assert.deepEqual(h.navigations,[]);
 // The WebView resumes a retained one-shot timer when this cached page returns.
 h.timeouts.delete(id);tick.fn();assert.equal(h.timeouts.size,1);
});

function ownedChecksheet(h, tid) {
 h.c.removeEventListener=()=>{};if(!h.c.AppShell)h.load('js/app_shell.js');
 const scope=h.c.AppShell.scope(),calls=[],cache=[],fields=[],values={tid,check_type:9,wayflow:10,list_json:JSON.stringify([{group_task_column:'',checksheet_start_step:[{id:9,step:'first'}]}])};
 const storage={getItem:key=>JSON.stringify(values[key]??null),setItem:(key,value)=>values[key]=JSON.parse(value)};
 const services={storage,cordova:{exec:(success,failure,...args)=>calls.push([typeof success==='function'?scope.guard(success):success,typeof failure==='function'?scope.guard(failure):failure,...args])},request:h.c.Webservicecall_REST};
 let back=0;
 const api=h.c.AppChecksheetController.create({scope,services,$:selector=>{fields.push(selector);return {val:()=>'',html:()=>{},text:()=>{}};},savedLists:{failed:id=>{cache.push(id);return true;}},enableBack:()=>back++});
 const open=()=>api.check_old_task_for_checksheet(9,'Synthetic',100,0,1,3,0,'false',1,0,0,0,0,'','false');
 return {api,scope,calls,values,cache,fields,open,back:()=>back};
}
test('loading the checksheet module in the shell registers no legacy state, native calls or pagehide startup',()=>{
 const h=harness();h.c.document.documentElement.hasAttribute=name=>name==='data-app-shell';
 h.load('EFSE_Js/viewsitelist_pm_grouplist.js');
 assert.equal(typeof h.c.AppChecksheetController.create,'function');assert.equal(h.c.check_old_task_for_checksheet,undefined);assert.equal(h.c.in_ms,undefined);
 assert.equal(h.native.length,0);assert.equal(h.timeouts.size,0);
});
test('checksheet instances retain separate task identities, selection generations, DOM access and callbacks',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm_grouplist.js']);h.c.changeurl=()=>{};
 const a=ownedChecksheet(h,11),b=ownedChecksheet(h,22);a.open();b.open();
 assert.match(a.calls[0][4][0].data,/tid = '11'/);assert.match(b.calls[0][4][0].data,/tid = '22'/);
 a.api.invalidate_checksheet_open();a.calls[0][0]('[{"tid":111,"task_id":111,"server_task_id":111}]');
 b.calls[0][0]('[{"tid":222,"task_id":222,"server_task_id":222}]');
 assert.equal(a.values.tid,11);assert.equal(b.values.tid,222);assert.deepEqual(b.values.step_Array_to_read,[1]);
 assert.ok(a.fields.includes('#Chk_Back_0'));assert.ok(b.fields.includes('#Chk_Back_0'));assert.equal(h.native.length,0);
 a.scope.dispose();b.scope.dispose();
});
test('disposing a checksheet instance retires its actions and replies while the other instance remains usable',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm_grouplist.js']);h.c.changeurl=()=>{};
 const a=ownedChecksheet(h,11),b=ownedChecksheet(h,22);a.open();b.open();a.scope.dispose();const before=JSON.stringify(a.values);
 a.open();a.calls[0][0]('[{"tid":111,"task_id":111,"server_task_id":111}]');a.calls[0][1]('retired');
 assert.equal(a.calls.length,1);assert.equal(JSON.stringify(a.values),before);
 b.calls[0][0]('[{"tid":222,"task_id":222,"server_task_id":222}]');assert.equal(b.values.tid,222);b.scope.dispose();
});
test('each checksheet instance owns its display clock and releases only its own timer',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm_grouplist.js']);const a=ownedChecksheet(h,11),b=ownedChecksheet(h,22);
 a.api.in_ms=Date.now();a.api.duration=12;b.api.in_ms=Date.now();b.api.duration=34;
 a.api.continous_update_punch_milli();b.api.continous_update_punch_milli();assert.equal(h.timeouts.size,2);
 a.scope.dispose();assert.equal(h.timeouts.size,1);assert.equal(b.api.duration,34);b.scope.dispose();assert.equal(h.timeouts.size,0);
});
test('checksheet instance failures use their own cache/back hooks without reading another page cache',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm_grouplist.js']);let globalCacheReads=0;h.c.AppPhase1Lists={failed:()=>globalCacheReads++};
 const a=ownedChecksheet(h,11),b=ownedChecksheet(h,22);a.api.onsuccess_get_list_of_pm_checksheets('[]');
 assert.deepEqual(a.cache,['checksheet_list']);assert.equal(a.back(),1);assert.deepEqual(b.cache,[]);assert.equal(b.back(),0);assert.equal(globalCacheReads,0);
 a.scope.dispose();b.scope.dispose();
});
test('loading the checksheet controller again does not reset the legacy instance',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm_grouplist.js']);const original=h.c.check_old_task_for_checksheet;h.c.in_ms=12345;
 h.load('EFSE_Js/viewsitelist_pm_grouplist.js');assert.equal(h.c.in_ms,12345);assert.equal(h.c.check_old_task_for_checksheet,original);
});

test('mapped prerequisite feedback belongs to the checksheet controller',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm_grouplist.js']),notices=[];h.c.alert1=message=>notices.push(message);
 h.c.grey2_button_click('Safety check');assert.deepEqual(notices,['Please complete Safety check first !']);
});

function ownedTaskList(h, moduleid) {
 h.c.removeEventListener=()=>{};if(!h.c.AppShell)h.load('js/app_shell.js');
 const scope=h.c.AppShell.scope(),calls=[],values={wayflow:moduleid,flow_Array:[{wayflow:moduleid}],list_json:JSON.stringify([{status:[0],columndata:[{step:1,checksheetID:100}],orderby:'tid',order_type:'asc',upload_pending_display:'false'}])};
 const state={user_lat:0,user_long:0,user_accuracy:0,default_range:20,limit_range:20,active_Tab:0},actions={};
 const storage={getItem:key=>JSON.stringify(values[key]??null),setItem:(key,value)=>values[key]=JSON.parse(value)};
 const services={storage,cordova:{exec:(success,failure,...args)=>calls.push([typeof success==='function'?scope.guard(success):success,typeof failure==='function'?scope.guard(failure):failure,...args])}};
 const api=h.c.AppTaskListController.create({scope,state,actions,services,$:h.c.$,enableBack:()=>{},disableBack:()=>{},savedLists:{response:(id,callback)=>callback}});
 return {scope,calls,values,state,actions,api};
}
test('loading offline task operations in the shell publishes no legacy entry points or mutable state',()=>{
 const h=harness();h.c.document.documentElement.hasAttribute=name=>name==='data-app-shell';h.load('EFSE_Js/viewsitelist_pm.js');
 assert.equal(typeof h.c.AppTaskListController.create,'function');assert.equal(h.c.get_user_latlong_pm,undefined);assert.equal(h.c.trip_New_Array,undefined);assert.equal(h.native.length,0);
});
test('offline task instances use their own module identity and leave unrelated loop counters untouched',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm.js']),a=ownedTaskList(h,10),b=ownedTaskList(h,20);const c={owner:'another page'};h.c.c=c;
 a.api.get_list_of_pm_sites_New('');b.api.get_list_of_pm_sites_New('');
 assert.equal(a.calls.length,1);assert.equal(b.calls.length,1);assert.match(a.calls[0][4][0].data,/moduleid = '10'/);assert.match(b.calls[0][4][0].data,/moduleid = '20'/);assert.equal(h.c.c,c);
 a.scope.dispose();b.scope.dispose();
});
test('offline task GPS replies update only the requesting page state and use its own next read',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm.js']),a=ownedTaskList(h,10),b=ownedTaskList(h,20);
 a.api.get_user_latlong_pm();b.api.get_user_latlong_pm();a.calls[0][0]('[{"lat":28.1,"lon":77.2,"accuracy":3,"gprs":"1","gps":"1","address":"Synthetic"}]');
 assert.equal(a.state.user_lat,28.1);assert.equal(a.state.user_long,77.2);assert.equal(a.state.user_accuracy,3);assert.equal(b.state.user_lat,0);
 assert.equal(a.calls.length,2);assert.equal(a.calls[1][2],'SqlitePlugin');assert.equal(a.calls[1][3],'showValues');assert.equal(h.native.length,0);
 a.scope.dispose();b.scope.dispose();
});
test('retired task actions and native replies cannot update page state or start another read',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm.js']),a=ownedTaskList(h,10),b=ownedTaskList(h,20);
 a.api.get_user_latlong_pm();b.api.get_user_latlong_pm();a.scope.dispose();a.api.get_user_latlong_pm();
 a.calls[0][0]('[{"lat":28.1,"lon":77.2,"accuracy":3,"gprs":"1","gps":"1"}]');a.calls[0][1]('retired');
 assert.equal(a.state.user_lat,0);assert.equal(a.calls.length,1);
 b.calls[0][0]('[{"lat":29.1,"lon":78.2,"accuracy":4,"gprs":"1","gps":"1","address":"Synthetic"}]');assert.equal(b.state.user_lat,29.1);assert.equal(b.calls.length,2);b.scope.dispose();
});
test('task selection metadata stays with its page and preserves the native approval request',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm.js']),a=ownedTaskList(h,10),b=ownedTaskList(h,20);h.c.imeino='Synthetic';
 function select(target,id){target.api.redirect_on_pm_site_click_PRE(id,id+100,0,10,'Synthetic','Site '+id,28,77,0,'',0,id+200,3,100,'10/19/2026');}
 select(a,1);select(b,2);assert.equal(a.api.glob_off_taskclick_ary[0].site_id,1);assert.equal(b.api.glob_off_taskclick_ary[0].site_id,2);
 assert.equal(a.calls[0][2],'SupportPageMapsPlugin_Green');assert.equal(a.calls[0][3],'anAction');assert.equal(a.calls[0][4][0].Task_Id,201);
 assert.equal(b.calls[0][4][0].Task_Id,202);a.scope.dispose();b.scope.dispose();
});
test('offline task leave releases its refresh clock and loading again preserves legacy state',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm.js']),a=ownedTaskList(h,10),b=ownedTaskList(h,20);
 a.api.task_refresh_timer=a.scope.timeout(()=>{},60000);b.api.task_refresh_timer=b.scope.timeout(()=>{},60000);assert.equal(h.timeouts.size,2);
 a.scope.dispose();assert.equal(h.timeouts.size,1);b.scope.dispose();assert.equal(h.timeouts.size,0);
 const original=h.c.get_user_latlong_pm;h.c.trip_New_Array=[{tid:123}];h.load('EFSE_Js/viewsitelist_pm.js');assert.equal(h.c.trip_New_Array[0].tid,123);assert.equal(h.c.get_user_latlong_pm,original);
});

for(const name of ['onfail_remove_last_subtask','onfail_remove_photo_last_subtask'])test(name+' uses its supplied error without throwing',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm.js']),messages=[];h.c.alert1=message=>messages.push(message);
 assert.doesNotThrow(()=>h.c[name]('Synthetic error'));assert.deepEqual(messages,['Synthetic error_'+name+'()']);
});
test('failed active-trip reads use the native failure value without throwing',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm.js']),messages=[];h.c.alert1=message=>messages.push(message);h.c.get_active_trips();
 assert.doesNotThrow(()=>h.native.at(-1)[1]('Synthetic read failure'));assert.deepEqual(messages,['Synthetic read failure']);
});

test('legacy task status entry point reuses the shared reader and keeps status dictionaries available to the task renderer',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm.js','js/task_status.js','EFSE_Js/viewsitelist_pm_CommentUI.js']);let tabs=0;h.c.create_tabs_by_status=()=>tabs++;
 h.values.global_wcf_url='https://example.invalid/';h.c.get_statusName_from_numericStatus('select_survey');
 assert.equal(h.requests.length,1);assert.equal(h.requests[0].url,'https://example.invalid/WCF_Get_ddl_Data');
 h.requests[0].success({responseText:JSON.stringify([{status:1,data:JSON.stringify([{FSM_Data:[{Status:0,Status_Name:'Pending',color:'#123456',text_color:'#ffffff'}]}])}])});
 assert.equal(h.c.glob_statusName_ary[0],'Pending');assert.equal(h.c.glob_statusColor_ary.Pending,'#123456');assert.equal(tabs,1);
});

test('legacy checksheet exports preserve diagnostic variables owned by another module or page',()=>{
 const h=harness();h.values.tid=11;
 Object.defineProperty(h.c,'last_query',{value:'Other module query',writable:true,configurable:false});
 Object.defineProperty(h.c,'server_dt_Counter',{value:99,writable:true,configurable:false});
 assert.doesNotThrow(()=>h.load('EFSE_Js/viewsitelist_pm_grouplist.js'));h.c.get_list_of_pm_checksheets();
 assert.equal(h.native.length,1);assert.match(h.native[0][4][0].data,/tid = '11'/);
 assert.equal(h.c.last_query,'Other module query');assert.equal(h.c.server_dt_Counter,99);
});

function ownedTaskNavigation(h,id){
 if(!h.c.AppShell)h.load('js/app_shell.js');
 const scope=h.c.AppShell.scope(),calls=[],values={survey_type:1,tab_index:0,wayflow:id,flow_Array:[{wayflow:id}],list_json:JSON.stringify([{search:'true',survey_mode:'offline'}])};
 const state={default_range:20,limit_range:20,increment_range:20,query_type:1,user_lat:0,user_long:0,username:'Synthetic',global_wcf_url:'https://example.invalid/',common_global_wcf_url:'https://example.invalid/',toggle_search:0},actions={};
 const storage={getItem:key=>JSON.stringify(values[key]??null),setItem:(key,value)=>values[key]=JSON.parse(value)};
 const services={storage,cordova:{exec:(success,failure,...args)=>calls.push([typeof success==='function'?scope.guard(success):success,typeof failure==='function'?scope.guard(failure):failure,...args])},request:h.c.Webservicecall_REST,app:h.c.myApp};
 const api=h.c.AppTaskNavigationController.create({scope,state,actions,services,$:h.c.$,savedLists:null,disableBack:()=>{}});
 return {api,scope,values,state,actions,calls};
}
test('task navigation publishes no legacy state or startup when loaded in the shell',()=>{
 const h=harness();h.c.document.documentElement.hasAttribute=name=>name==='data-app-shell';h.load('EFSE_Js/selection_survey.js');
 assert.equal(typeof h.c.AppTaskNavigationController.create,'function');assert.equal(h.c.select_survey_type_tab,undefined);assert.equal(h.c.active_Tab,undefined);assert.equal(h.native.length,0);
});
test('task pagination and search target their own state and offline controller',()=>{
 const h=harness(['EFSE_Js/selection_survey.js']),a=ownedTaskNavigation(h,10),b=ownedTaskNavigation(h,20);let aReads=0,bSearches=0;
 a.actions.get_list_of_pm_sites=()=>aReads++;b.actions.get_list_of_pm_sites_by_search=()=>bSearches++;
 a.api.see_more_site_list_common();assert.equal(aReads,1);assert.equal(a.state.limit_range,40);assert.equal(b.state.limit_range,20);
 b.api.search_site_list_common();assert.equal(bSearches,1);assert.equal(b.state.query_type,2);assert.equal(a.state.query_type,1);
 a.scope.dispose();b.scope.dispose();
});
test('retired task navigation cannot change pagination, search or another page',()=>{
 const h=harness(['EFSE_Js/selection_survey.js']),a=ownedTaskNavigation(h,10),b=ownedTaskNavigation(h,20);let reads=0;
 a.actions.get_list_of_pm_sites=()=>reads++;b.actions.get_list_of_pm_sites=()=>reads++;a.scope.dispose();
 a.api.see_more_site_list_common();a.api.search_site_list_common();assert.equal(a.state.limit_range,20);assert.equal(a.state.query_type,1);assert.equal(reads,0);
 b.api.see_more_site_list_common();assert.equal(b.state.limit_range,40);assert.equal(reads,1);b.scope.dispose();
});
test('task navigation keeps calendar/filter arrays and active tabs private to each instance',()=>{
 const h=harness(['EFSE_Js/selection_survey.js']),a=ownedTaskNavigation(h,10),b=ownedTaskNavigation(h,20);let destroyed=0;
 a.api.active_Tab=3;a.api.g_event_array.push({id:1});a.api.cal_date.push('synthetic');a.api.glob_Calendar={destroy:()=>destroyed++};
 assert.equal(b.api.active_Tab,0);assert.equal(b.api.g_event_array.length,0);assert.equal(b.api.cal_date.length,0);
 a.scope.dispose();assert.equal(destroyed,1);b.scope.dispose();assert.equal(destroyed,1);
});
test('task creation lookup uses the requesting navigation context and guarded native read',()=>{
 const h=harness(['EFSE_Js/selection_survey.js']),a=ownedTaskNavigation(h,10),b=ownedTaskNavigation(h,20);
 a.api.check_last_dummy_entry();b.api.check_last_dummy_entry();assert.match(a.calls[0][4][0].data,/moduleid='10'/);assert.match(b.calls[0][4][0].data,/moduleid='20'/);
 a.scope.dispose();a.calls[0][0]('[]');assert.equal(a.calls.length,1,'retired lookup cannot insert a dummy task');assert.equal(b.calls.length,1);b.scope.dispose();
});
test('reloading task navigation does not reset a legacy tab or replace its entry points',()=>{
 const h=harness(['EFSE_Js/selection_survey.js']);h.c.active_Tab=7;const original=h.c.select_survey_type_tab;h.load('EFSE_Js/selection_survey.js');assert.equal(h.c.active_Tab,7);assert.equal(h.c.select_survey_type_tab,original);
});

function ownedOnlineTask(h,moduleid){
 if(!h.c.AppShell)h.load('js/app_shell.js');
 const scope=h.c.AppShell.scope(),calls=[],values={wayflow:moduleid,company_id:1,flow_Array:[{wayflow:moduleid}],list_json:JSON.stringify([{status:[0],geofence:[{value:'false'}]}])};
 const state={username:'Synthetic',imeino:'Synthetic',user_lat:0,user_long:0,user_accuracy:0,default_range:20,limit_range:20,active_Tab:0},actions={};
 const storage={getItem:key=>JSON.stringify(values[key]??null),setItem:(key,value)=>values[key]=JSON.parse(value)};
 const services={storage,app:h.c.myApp,cordova:{exec:(success,failure,...args)=>calls.push([typeof success==='function'?scope.guard(success):success,typeof failure==='function'?scope.guard(failure):failure,...args])},request:function(url,data,success,failure){return new h.c.Webservicecall_REST(url,data,scope.guard(success),scope.guard(failure));}};
 const api=h.c.AppOnlineTaskController.create({scope,state,actions,services,$:h.c.$,disableBack:()=>{},savedLists:null});
 return {scope,calls,values,state,actions,api};
}
test('online task module does not install global methods, arrow functions, arrays or startup in the shell',()=>{
 const h=harness();h.c.document.documentElement.hasAttribute=name=>name==='data-app-shell';h.load('EFSE_Js/viewsitelist_pm_on.js');
 assert.equal(typeof h.c.AppOnlineTaskController.create,'function');for(const name of ['get_list_of_pm_sites_online','upload_pending_Array','glob_taskclick_ary','get_sitewise_radius_from_columndata'])assert.equal(h.c[name],undefined);assert.equal(h.native.length,0);
});
test('online task reads and arrow entry points use independent page contexts',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm_on.js']),a=ownedOnlineTask(h,10),b=ownedOnlineTask(h,20);
 a.api.get_list_of_task_for_compare_online();b.api.get_list_of_task_for_compare_online();assert.match(a.calls[0][4][0].data,/moduleid = '10'/);assert.match(b.calls[0][4][0].data,/moduleid = '20'/);
 a.api.upload_pending_Array.push([1]);a.api.group_task_array.push({tid:1});assert.equal(b.api.upload_pending_Array.length,0);assert.equal(b.api.group_task_array.length,0);a.scope.dispose();b.scope.dispose();
});
test('online task approval arguments and tap metadata retain the requesting owner',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm_on.js']),a=ownedOnlineTask(h,10),b=ownedOnlineTask(h,20);
 function tap(p,id){p.api.redirect_on_pm_site_click_online_POST_geofence(id,'Synthetic '+id,id+100,0,p.values.wayflow,'Synthetic',1,28,77,'10/19/2026',0,3,100);}
 tap(a,1);tap(b,2);assert.equal(a.api.glob_taskclick_ary[0].site_id,1);assert.equal(b.api.glob_taskclick_ary[0].site_id,2);
 assert.equal(a.calls[0][2],'SupportPageMapsPlugin_Green');assert.equal(a.calls[0][4][0].Task_Id,101);assert.equal(b.calls[0][4][0].Task_Id,102);a.scope.dispose();b.scope.dispose();
});
test('retired online task reads and Details replies cannot navigate, open popups or update another page',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm_on.js']),a=ownedOnlineTask(h,10),b=ownedOnlineTask(h,20);let popups=0;h.c.myApp.popup=()=>popups++;
 a.api.view_task_details_from_task_master('',1);a.scope.dispose();a.calls[0][0]('[{"tid":1}]');a.calls[0][1]('retired');a.api.get_list_of_task_for_compare_online();assert.equal(popups,0);assert.equal(a.calls.length,1);
 b.api.view_task_details_from_task_master('',2);assert.match(b.calls[0][4][0].data,/tid = '2'/);b.scope.dispose();
});
test('online task refresh timers are released by their own scope and a duplicate load preserves legacy state',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm_on.js']),a=ownedOnlineTask(h,10),b=ownedOnlineTask(h,20);
 a.api.online_task_refresh_timer=a.scope.timeout(()=>{},60000);b.api.online_task_refresh_timer=b.scope.timeout(()=>{},60000);assert.equal(h.timeouts.size,2);a.scope.dispose();assert.equal(h.timeouts.size,1);b.scope.dispose();assert.equal(h.timeouts.size,0);
 h.c.upload_pending_Array.push([1]);const old=h.c.get_list_of_pm_sites_by_searchbox_pre;h.load('EFSE_Js/viewsitelist_pm_on.js');assert.equal(h.c.upload_pending_Array.length,1);assert.equal(h.c.get_list_of_pm_sites_by_searchbox_pre,old);
});
test('online task comparison failure reports its supplied error',()=>{
 const h=harness(['EFSE_Js/viewsitelist_pm_on.js']),messages=[];h.c.alert1=m=>messages.push(m);assert.doesNotThrow(()=>h.c.onfail_get_list_of_task_for_compare_online('Synthetic read error'));assert.deepEqual(messages,['Synthetic read error_get_list_of_task_for_compare_online()']);
});

function ownedSecondaryTask(h,name,id){
 if(!h.c.AppShell)h.load('js/app_shell.js');const scope=h.c.AppShell.scope(),calls=[],values={wayflow:id,flow_Array:[{wayflow:id}],list_json:JSON.stringify([{status:[0],geofence:[{value:'false'}]}])};
 const state={username:'Synthetic',uniqcode:'Synthetic',global_wcf_url:'https://example.invalid/',default_range:20,limit_range:20,query_type:1,up_Click:0,up_Timer1:0,user_lat:0,user_long:0};
 const services={storage:{getItem:key=>JSON.stringify(values[key]??null),setItem:(key,value)=>values[key]=JSON.parse(value)},cordova:{exec:(success,failure,...args)=>calls.push([typeof success==='function'?scope.guard(success):success,typeof failure==='function'?scope.guard(failure):failure,...args])},request:function(url,data,success,failure){return new h.c.Webservicecall_REST(url,data,scope.guard(success),scope.guard(failure));}};
 const api=h.c[name].create({scope,state,services,$:h.c.$,enableBack:()=>{},disableBack:()=>{},isCurrentList:type=>Number(values.survey_type)===type});return {scope,calls,values,state,api};
}
for(const [file,name,method]of [['EFSE_Js_Server/server_viewsitelist.js','AppCompletedTaskController','get_list_of_completed_sites'],['EFSE_Js/Upload_Option_Get_List.js','AppUploadTaskController','get_list_of_UP_sites']]){
 test(name+' loads in the shell without legacy exports or startup',()=>{const h=harness();h.c.document.documentElement.hasAttribute=n=>n==='data-app-shell';h.load(file);assert.equal(typeof h.c[name].create,'function');assert.equal(h.c[method],undefined);assert.equal(h.native.length,0);assert.equal(h.requests.length,0);});
 test(name+' keeps refresh ranges and requests in their owning page',()=>{
  const h=harness([file]),a=ownedSecondaryTask(h,name,10),b=ownedSecondaryTask(h,name,20);
  a.state.limit_range=40;b.state.limit_range=60;a.api[method]();b.api[method]();
  if(name==='AppCompletedTaskController'){assert.equal(JSON.parse(h.requests[0].data)[0].module_id,10);assert.equal(JSON.parse(h.requests[1].data)[0].module_id,20);assert.equal(JSON.parse(h.requests[0].data)[0].limit,40);}else{assert.match(a.calls[0][4][0].data,/moduleid = '10'/);assert.match(b.calls[0][4][0].data,/moduleid = '20'/);assert.equal(a.calls[0][4][0].p,'6','preserve the existing native upload-trigger mode');}
  assert.equal(a.state.limit_range,40);assert.equal(b.state.limit_range,60);a.scope.dispose();b.scope.dispose();
 });
 test(name+' ignores retired actions/replies and duplicate script loads preserve its legacy facade',()=>{
  const h=harness([file]),a=ownedSecondaryTask(h,name,10);a.api[method]();const count=h.requests.length+a.calls.length;a.scope.dispose();a.api[method]();
  if(name==='AppCompletedTaskController')h.requests[0].success({responseText:'[{"status":2}]'});else a.calls[0][0]('[]');assert.equal(h.requests.length+a.calls.length,count);const old=h.c[method];h.load(file);assert.equal(h.c[method],old);
 });
}


test('upload polling cannot overwrite the pending task list after a tab switch',()=>{
 const h=harness(['EFSE_Js/Upload_Option_Get_List.js']),page=ownedSecondaryTask(h,'AppUploadTaskController',10);
 page.values.survey_type=3;page.api.onsuccess_get_pending_trips_count('[{"issend":0}]');assert.equal(h.timeouts.size,1);
 const timer=[...h.timeouts.values()][0];page.values.survey_type=1;timer.fn();assert.equal(page.calls.length,0,'an upload-tab timer cannot fetch into another tab');
 page.values.survey_type=3;page.api.onsuccess_get_pending_trips_count('[{"issend":0}]');const current=[...h.timeouts.values()].at(-1);current.fn();assert.equal(page.calls.length,1);assert.match(page.calls[0][4][0].data,/select issend from lat_plug/);page.scope.dispose();
});

function ownedHome(h, id) {
 if (!h.c.AppShell) h.load('js/app_shell.js');
 const scope=h.c.AppShell.scope(), calls=[], locations=[];
 const values={company_id:1,user_id:2,id_Array:[id],cust_flow_Array:[],role_id:7};
 const state={button_clicked:0,username:'Synthetic',uniqcode:'Synthetic',global_wcf_url:'https://example.invalid/',common_global_wcf_url:'https://example.invalid/',default_range:20,limit_range:20,increment_range:20};
 const storage={getItem:key=>JSON.stringify(values[key]??null),setItem:(key,value)=>values[key]=JSON.parse(value)};
 const services={storage,cordova:{exec:(success,failure,...args)=>calls.push([typeof success==='function'?scope.guard(success):success,typeof failure==='function'?scope.guard(failure):failure,...args])},request:h.c.Webservicecall_REST,app:h.c.myApp};
 const api=h.c.AppHomeController.create({scope,state,services,$:h.c.$,actions:{onfail_request:()=>{}},location:()=>({_getLocation:fn=>locations.push(fn)}),enableBack:()=>{}});
 return {api,scope,calls,locations,state,values};
}
test('Home loads in the shell without startup or legacy module/trip globals',()=>{
 const h=harness();h.c.document.documentElement.hasAttribute=name=>name==='data-app-shell';h.load('EFSE_Js/selection.js');
 assert.equal(typeof h.c.AppHomeController.create,'function');
 for(const name of ['get_data_from_ufm','value_counter','module_navigation_generation','trip_punchout_status','stop_trip_manualy_from_module_listing'])assert.equal(h.c[name],undefined,name);
 assert.equal(h.native.length,0);assert.equal(h.requests.length,0);
});
test('Home controllers preserve independent module roots, counts and download state',()=>{
 const h=harness(['EFSE_Js/selection.js']),a=ownedHome(h,10),b=ownedHome(h,20);
 assert.equal(a.api.get_udf_pid(),10);assert.equal(b.api.get_udf_pid(),20);
 a.api.value_counter.push({id:10,count:7});a.api.download_start_requested=true;
 assert.equal(b.api.value_counter.length,0);assert.equal(b.api.download_start_requested,false);assert.equal(h.c.value_counter.length,0);
 a.api.get_data_from_ufm();b.api.get_data_from_ufm();
 assert.match(a.calls[0][4][0].data,/p_id = 10/);assert.match(b.calls[0][4][0].data,/p_id = 20/);
 assert.equal(a.calls[0][2],'SqlitePlugin');assert.equal(a.calls[0][3],'showValues');assert.equal(a.calls[0][4][0].p,'1');
});
test('Home page disposal retires in-flight module reads and cancels its own request',()=>{
 const h=harness(['EFSE_Js/selection.js']),a=ownedHome(h,10),b=ownedHome(h,20);let cancelled=0,otherCancelled=0;const notices=[];h.c.alert1=message=>notices.push(message);
 a.api.get_data_from_ufm();b.api.get_data_from_ufm();a.api.module_list_request={cancel:()=>cancelled++};b.api.module_list_request={cancel:()=>otherCancelled++};
 a.scope.dispose();a.calls[0][0]('invalid');a.calls[0][1]('late error');a.api.get_data_from_ufm();
 assert.equal(cancelled,1);assert.equal(otherCancelled,0);assert.equal(a.api.module_list_request,null);assert.equal(a.calls.length,1);assert.deepEqual(notices,[]);
 assert.equal(b.api.module_navigation_generation,1);assert.equal(a.api.module_navigation_generation,2);
});
test('Home location replies cannot start a network request after page disposal',()=>{
 const h=harness(['EFSE_Js/selection.js']),a=ownedHome(h,10),b=ownedHome(h,20);
 a.api.get_counter_for_online_flow();b.api.get_counter_for_online_flow();assert.equal(a.locations.length,1);assert.equal(b.locations.length,1);
 a.scope.dispose();a.locations[0]([{lat:28,long:77}]);assert.equal(h.requests.length,0);
 b.locations[0]([{lat:28,long:77}]);assert.equal(h.requests.length,1);assert.match(h.requests[0].url,/WCF_OnlineTaskList_Native_Count$/);
 const sent=JSON.parse(h.requests[0].data)[0];assert.equal(sent.user_lat,28);assert.equal(sent.user_long,77);assert.equal(sent.company_id,1);
});
test('Home publishes compatible legacy trip actions and late-bound page state',()=>{
 const h=harness(['EFSE_Js/selection.js']);for(const name of ['trip_punchout_status','noti_Attendance_Click','check_for_glob_notification','home_tab_click','stop_trip_manualy_from_module_listing'])assert.equal(typeof h.c[name],'function',name);
 h.values.id_Array=[30];h.values.cust_flow_Array=[];assert.equal(h.c.get_udf_pid(),30);
 h.c.value_counter=[1,2];assert.equal(h.c.value_counter.length,2);assert.equal(h.c.AppHomeController.create().value_counter.length,0);
});

test('named task tabs preserve the numeric Upload index in typed actions',()=>{
 const h=harness(['EFSE_Js/selection_survey.js']),settings={tab_name:'First',search:'false',survey_mode:'offline'};
 h.values.list_json=JSON.stringify([settings]);h.values.list_json_Array=JSON.stringify([settings,{...settings,tab_name:'Second'}]);h.values.survey_type=1;h.values.tab_index=0;
 h.c.get_user_latlong_pm=()=>{};const actions=[];
 const chain=new Proxy(function(){},{get:(_,key)=>key===Symbol.toPrimitive?()=>'#2a3086':key==='length'?0:chain,apply:()=>chain});
 const api=h.c.AppTaskNavigationController.create({$:()=>chain,action:(name,args)=>{actions.push({name,args});return 'token'+actions.length;}});
 api.create_tabs_by_status();const upload=actions.find(action=>action.args[0]==='3');assert.ok(upload);assert.equal(upload.args[1],'3','2 named tabs + completed yields upload at index 3');
});


test('page-owned providers also guard callbacks they receive later',()=>{
 const h=harness();h.load('js/app_shell.js');const scope=h.c.AppShell.scope();let reply;const results=[];
 const provider=scope.own(callback=>{reply=callback;});provider(value=>results.push(value));reply('active');assert.deepEqual(results,['active']);
 scope.dispose();reply('retired');provider(()=>results.push('restarted'));assert.deepEqual(results,['active']);
});
test('Home component scripts do not replay startup or publish legacy aliases in the shell',()=>{
 const h=harness();h.c.document.documentElement.hasAttribute=name=>name==='data-app-shell';
 for(const file of ['home_dashboard_data.js','home_hero.js','trip_list.js','home_dashboard_entry.js','widgets/widget_task_summary.js','widgets/widget_upload_health.js'])h.load('EFSE_Js/home_dashboard/'+file);
 for(const name of ['HomeDashboardData','HomeHero','TripListSheet','HomeDashboard','HomeWidgetTaskSummary','HomeWidgetUploadHealth'])assert.equal(h.c[name],undefined,name);
 assert.equal(typeof h.c.AppHomeHeroController.create,'function');assert.equal(h.native.length,0);assert.equal(h.timeouts.size,0);assert.equal(h.requests.length,0);
});
test('Home data completions remain tied to their original page lifetime',()=>{
 const h=harness();h.c.document.documentElement.hasAttribute=name=>name==='data-app-shell';h.load('js/app_shell.js');h.load('EFSE_Js/home_dashboard/home_dashboard_data.js');
 const a=h.c.AppShell.scope(),b=h.c.AppShell.scope(),results=[];
 const services={storage:h.c.storage,cordova:h.c.cordova,request:h.c.Webservicecall_REST};
 const first=h.c.AppHomeDashboardDataController.create({scope:a,services}),second=h.c.AppHomeDashboardDataController.create({scope:b,services});
 first.getLastLocation(value=>results.push('first'));second.getLastLocation(value=>results.push('second'));assert.equal(h.native.length,2);
 a.dispose();h.native[0][0]('[]');h.native[1][0]('[]');assert.deepEqual(results,['second']);
});
