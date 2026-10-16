const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const base=path.join(__dirname,'..');
function load(ctx,file){vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),ctx);}
function rest(){
 const requests=[],timers=new Map();let tid=0;
 const store={getItem:()=> 'null'};
 function XHR(){requests.push(this);this.headers={};this.open=(_,url)=>this.url=url;this.setRequestHeader=(k,v)=>this.headers[k]=v;this.send=()=>{};this.abort=()=>{this.readyState=4;this.status=0;if(this.onreadystatechange)this.onreadystatechange();};this.reply=(status,text='[{"status":1}]')=>{this.status=status;this.readyState=4;this.responseText=text;if(this.onreadystatechange)this.onreadystatechange();};}
 const c=vm.createContext({XMLHttpRequest:XHR,storage:store,localStorage:store,setTimeout:(fn,ms)=>{timers.set(++tid,{fn,ms});return tid;},clearTimeout:id=>timers.delete(id),window:{},loading_hide(){},mk_notify(){}});
 load(c,'js/webservicecall_REST.js');return{c,requests,timers};
}
{
 const {c,requests,timers}=rest();let failed=0,ok=0;
 new c.Webservicecall_REST('/A','[{}]',()=>ok++,()=>failed++,null,123,'true').callOtherDomain();
 for(let i=0;i<4;i++){
  requests.filter(r=>r.url==='/A').at(-1).reply(500);
  new c.Webservicecall_REST('/B','[{}]',()=>{},()=>{}).callOtherDomain();requests.at(-1).reply(200);
 }
 assert.equal(failed,1);assert.equal(ok,0);assert.equal(requests.filter(r=>r.url==='/A').length,4);assert.equal(timers.size,0);
 for(const r of requests.filter(r=>r.url==='/A'))assert.equal(r.headers['Content-Type'],'application/text');
 requests[0].reply(200);assert.equal(ok,0,'late replies cannot complete a retired attempt');
}
{
 const {c,requests,timers}=rest();let failed=0;
 new c.Webservicecall_REST('/timeout','[]',()=>{},()=>failed++,null,12).callOtherDomain();
 for(let i=0;i<4;i++){const timer=[...timers.values()][0];assert.equal(timer.ms,12);timers.clear();timer.fn();}
 assert.equal(failed,1);assert.equal(requests.length,4);
}
{
 const {c,requests,timers}=rest();let failed=0;
 new c.Webservicecall_REST('/bad','[]',()=>{},()=>failed++).callOtherDomain();requests[0].reply(200,'broken');assert.equal(failed,1);assert.equal(timers.size,0);
}
function queue({deleteFails=false}={}){
 const records=[{id:1,action:'skill_videolog',payload:'{"url":"/save","payload":"[]"}'}],requests=[];
 const c=vm.createContext({navigator:{onLine:true},document:{addEventListener(){}},localStorage:{getItem:()=>null},cordova:{exec(ok,err,p,a,args){const sql=args[0].data;if(sql.startsWith('SELECT COUNT'))ok('[{"c":1}]');else if(sql.startsWith('SELECT id'))ok(JSON.stringify(records));else if(sql.startsWith('DELETE')){if(deleteFails){err('disk');return;}records.length=0;ok('');}else ok('');}},Webservicecall_REST:function(url,params,ok,fail){this.callOtherDomain=()=>requests.push({ok,fail});}});
 load(c,'LMS/lms_state.js');load(c,'LMS/lms_data.js');return{c,records,requests};
}
for(const deleteFails of [false,true]){
 const {c,records,requests}=queue({deleteFails});c.LMS_State.init();c.LMS_State.flushQueue();assert.equal(requests.length,1);
 requests[0].ok({responseText:'[{"status":1}]'});assert.equal(records.length,deleteFails?1:0);
 c.LMS_State.flushQueue();assert.equal(requests.length,deleteFails?2:1);
}
{
 const {c,records,requests}=queue();c.LMS_State.init();requests[0].fail();c.LMS_State.flushQueue();assert.equal(requests.length,2);assert.equal(records.length,1);
}
function trip(responses){
 const store=new Map([['AttendanceJson','[{"flow_id":1,"Checksheet_id":2}]']]);let uid='42';const offsets=[],timers=new Map();let t=0;
 const c=vm.createContext({storage:{getItem:k=>JSON.stringify(k==='user_id'?uid:'https://example.invalid/coreapi/api/')},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},setTimeout:fn=>{timers.set(++t,fn);return t;},clearTimeout:id=>timers.delete(id),Webservicecall_REST:function(url,params,ok,fail){this.callOtherDomain=()=>{offsets.push(JSON.parse(params)[0].offset);const res=responses.shift();if(res===undefined){fail();return;}ok({responseText:JSON.stringify(res)});};}});
 load(c,'EFSE_Js/home_dashboard/trip_server.js');return{c,offsets,store,timers};
}
const row=id=>({task_id:id,CREATEDBY:'42',CREATEDTTM:new Date().toISOString().slice(0,19),TotalTripTime:60000});
{
 const page=Array.from({length:500},(_,i)=>row(i+1));const {c,offsets}=trip([[{status:1,data:page}],[{status:1,data:[row(501)]}],[{status:2}]]);let ok;c.TripServerHistory.ensureDownloaded(v=>ok=v);assert.equal(ok,true);assert.deepEqual(offsets,[0,500,501]);assert.equal(c.TripServerHistory.getRows(0,Date.now()).length,501);
}
{
 const page=[row(1)];const {c}=trip([[{status:1,data:page}],[{status:1,data:page}]]);let ok;c.TripServerHistory.ensureDownloaded(v=>ok=v);assert.equal(ok,false);assert.equal(c.TripServerHistory.hasDownload(),false);
}
{
 const {c}=trip([[{status:1,data:[row(1)]}]]);let ok;c.TripServerHistory.ensureDownloaded(v=>ok=v);assert.equal(ok,false);assert.equal(c.TripServerHistory.hasDownload(),false);
}
console.log('REST retry isolation, timeout options, stale responses, queue ownership/acknowledgement, and trip pagination tests passed');

{
 const {c,requests,timers}=rest();let failed=0;
 new c.Webservicecall_REST('/module','[]',()=>{},()=>failed++,null,30000,null,{attempts:0,completed:false,maxAttempts:1}).callOtherDomain();
 assert.equal([...timers.values()][0].ms,30000);
 [...timers.values()][0].fn();assert.equal(failed,1);assert.equal(requests.length,1);
}
{
 const {c,requests,timers}=rest();let completed=0;
 const request=new c.Webservicecall_REST('/cancel','[]',()=>completed++,()=>completed++);
 request.callOtherDomain();request.cancel();requests[0].reply(200);
 assert.equal(completed,0);assert.equal(timers.size,0);
}
console.log('Bounded module requests and cancellation tests passed');

{
 const {c,requests,timers}=rest();let failed=0;
 new c.Webservicecall_REST('/module-error','[]',()=>{},()=>failed++,null,30000,null,{attempts:0,completed:false,maxAttempts:1}).callOtherDomain();
 requests[0].reply(500);assert.equal(failed,1);assert.equal(requests.length,1);assert.equal(timers.size,0);
}
