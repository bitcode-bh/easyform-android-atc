const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('EasyFormSE_finance/assets/www2/js/form_drafts.js','utf8');
function harness(){const timers=new Map();let timer=0;const c=vm.createContext({document:{},console,Map,Promise,MutationObserver:function(){},setTimeout:fn=>{timers.set(++timer,fn);return timer;},clearTimeout:id=>timers.delete(id)});c.window=c;vm.runInContext(source,c);return {c,timers};}
function store(saved=[]){const h=harness(),calls=[],errors=[];let owned=true;const context={company:'1',user:'2',server:'https://example.invalid/',flow:'3',task:'4',checksheet:'5',step:'1',kind:'form',schema:'[]'};const api=h.c.AppFormDrafts.create({context,current:()=>owned,error:e=>errors.push(e.message),bridge:(ok,fail,request)=>calls.push({ok,fail,request})});return {...h,api,calls,errors,context,retire:()=>owned=false,saved};}
async function tick(){for(let i=0;i<6;i++)await Promise.resolve();}
async function open(s,saved=[]){const promise=s.api.open();await tick();s.calls.at(-1).ok({lease:2,revision:saved.reduce((n,f)=>Math.max(n,f.revision),0),fields:saved});await promise;}
const field=(id,ans)=>({field:String(id),data:{ans:[ans],controls:[],value:null}});
function plain(v){return JSON.parse(JSON.stringify(v));}
test('draft baseline writes nothing; only changed fields are saved with captured context',async()=>{
 const s=store();await open(s);s.api.baseline([field(1,'A'),field(2,'B')]);s.api.update([field(1,'A'),field(2,'B')]);await tick();assert.equal(s.calls.length,1);
 s.context.user='999';s.api.update([field(1,"Worker's photo"),field(2,'B')]);await tick();const call=s.calls[1];assert.equal(call.request.operation,'write');assert.equal(call.request.context.user,'2');assert.deepEqual(plain(call.request.fields),[{...field(1,"Worker's photo"),revision:1}]);call.ok({});await s.api.flush();assert.equal(s.timers.size,0);
});
test('typing during a write is serialized and preserves the latest field version',async()=>{
 const s=store();await open(s);s.api.baseline([field(1,'')]);s.api.update([field(1,'one')]);await tick();s.api.update([field(1,'two')]);await tick();assert.equal(s.calls.length,2);s.calls[1].ok({});await tick();assert.equal(s.calls.length,3);assert.equal(s.calls[2].request.fields[0].data.ans[0],'two');assert.equal(s.calls[2].request.fields[0].revision,2);s.calls[2].ok({});await s.api.flush();
});
test('restored unchanged fields remain in the successful submission receipt',async()=>{
 const s=store(),saved=[{...field(7,'Restored'),revision:14}];await open(s,saved);s.api.baseline([field(7,'Restored')]);const receipt=s.api.snapshot();assert.deepEqual(plain(receipt),[{field:'7',revision:14}]);const done=s.api.acknowledge(receipt);await tick();assert.equal(s.calls[1].request.operation,'ack');s.calls[1].ok({});await done;
});
test('acknowledgement never includes edits made after its snapshot',async()=>{
 const s=store();await open(s);s.api.update([field(1,'Submitted')]);await tick();s.calls[1].ok({});await s.api.flush();const receipt=s.api.snapshot();s.api.update([field(1,'Later edit')]);await tick();s.calls[2].ok({});await s.api.flush();const ack=s.api.acknowledge(receipt);await tick();assert.equal(s.calls[3].request.fields[0].revision,1);assert.equal(s.api.snapshot()[0].revision,2);s.calls[3].ok({});await ack;
});
test('failed writes remain pending and can be retried without losing the answer',async()=>{
 const s=store();await open(s);s.api.update([field(1,'Keep me')]);await tick();s.calls[1].fail('unavailable');await tick();const retry=s.api.flush();await tick();assert.equal(s.calls[2].request.fields[0].data.ans[0],'Keep me');s.calls[2].ok({});await retry;
});
test('account changes reject a late reply and block new native operations',async()=>{
 const s=store();const first=s.api.open();await tick();s.retire();s.calls[0].ok({lease:2,revision:0,fields:[]});await assert.rejects(first,/retired/);await assert.rejects(s.api.flush().then(()=>s.api.open()),/retired/);assert.equal(s.calls.length,1);assert.equal(s.timers.size,0);
});
test('discard failures allow editing and retry; successful discard stops further writes',async()=>{
 const s=store();await open(s);const discard=s.api.discard();await tick();s.calls[1].fail('disk');await assert.rejects(discard,/unavailable/);s.api.update([field(1,'Still editing')]);await tick();s.calls[2].ok({});await s.api.flush();const retry=s.api.discard();await tick();s.calls[3].ok({});await retry;s.api.update([field(1,'Ignored')]);await tick();assert.equal(s.calls.length,4);
});
test('a hung bridge operation times out and ignores duplicate replies',async()=>{
 const s=store(),done=s.api.open();await tick();Array.from(s.timers.values())[0]();await assert.rejects(done,/timeout/);s.calls[0].ok({lease:2,revision:0,fields:[]});assert.equal(s.calls.length,1);assert.equal(s.timers.size,0);
});
