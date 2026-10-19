const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.resolve('EasyFormSE_finance/assets/www2/js/webservicecall_REST.js'),'utf8');
function setup(){
 const requests=[],timers=new Map(),success=[],failures=[],notices=[];let next=0;
 class XHR {
  constructor(){this.readyState=0;this.status=0;this.responseText='';this.aborts=0;this.sends=0;requests.push(this);}
  open(){this.readyState=1;} setRequestHeader(){} send(){this.sends++;}
  abort(){this.aborts++;this.readyState=4;this.status=0;if(this.onreadystatechange)this.onreadystatechange();}
 }
 const values={username:'Synthetic',uniqcode:'Synthetic',user_id:1,role_id:7};
 const context=vm.createContext({XMLHttpRequest:XHR,storage:{getItem:key=>JSON.stringify(values[key]??null),setItem:()=>{}},localStorage:{getItem:()=>null},
  setTimeout:(fn,ms)=>{timers.set(++next,{fn,ms});return next;},clearTimeout:id=>timers.delete(id),mk_notify:message=>notices.push(message),loading_hide:()=>{},vibrate_device:()=>{},alert:()=>{},changeurl:()=>{throw Error('Unexpected navigation');}});
 context.window=context;vm.runInContext(source,context);
 function create(){const result={success:[],failure:[]};result.request=new context.Webservicecall_REST('https://example.invalid/read','[{}]',value=>{result.success.push(value);success.push(value);},error=>{result.failure.push(error);failures.push(error);});return result;}
 function reply(xhr,status=503){xhr.readyState=4;xhr.status=status;xhr.responseText='[{"status":1}]';xhr.onreadystatechange();}
 function timeout(){const [id,timer]=timers.entries().next().value;timers.delete(id);timer.fn();}
 return {create,reply,timeout,requests,timers,success,failures,notices};
}
test('cancelling an initial request clears its timer and ignores a late response',()=>{
 const s=setup(),r=s.create();r.request.callOtherDomain();const xhr=s.requests[0],late=xhr.onreadystatechange;r.request.cancel();
 assert.equal(xhr.aborts,1);assert.equal(s.timers.size,0);xhr.readyState=4;xhr.status=200;xhr.responseText='[{"status":1}]';late();assert.equal(s.success.length,0);assert.equal(s.failures.length,0);
});
for(const cause of ['HTTP','timeout'])test('root cancellation aborts the current '+cause+' retry',()=>{
 const s=setup(),r=s.create();r.request.callOtherDomain();if(cause==='HTTP')s.reply(s.requests[0]);else s.timeout();
 assert.equal(s.requests.length,2);const child=s.requests[1],late=child.onreadystatechange;assert.equal(child.aborts,0);r.request.cancel();
 assert.equal(child.aborts,1);assert.equal(s.timers.size,0);child.readyState=4;child.status=200;child.responseText='[{"status":1}]';late();assert.equal(s.success.length,0);assert.equal(s.failures.length,0);
});
test('root cancellation releases an entire mixed timeout/HTTP retry chain',()=>{
 const s=setup(),r=s.create();r.request.callOtherDomain();s.reply(s.requests.at(-1));s.timeout();s.reply(s.requests.at(-1));assert.equal(s.requests.length,4);
 r.request.cancel();assert.ok(s.requests.every(xhr=>xhr.aborts>0));assert.equal(s.timers.size,0);assert.equal(s.success.length,0);assert.equal(s.failures.length,0);
});
test('a successful retry still reports its response exactly once',()=>{
 const s=setup(),r=s.create();r.request.callOtherDomain();s.reply(s.requests[0]);s.reply(s.requests[1],200);assert.equal(s.success.length,1);assert.equal(s.failures.length,0);assert.equal(s.timers.size,0);
 r.request.cancel();assert.equal(s.success.length,1);assert.equal(s.failures.length,0);
});
test('cancelling one retry chain leaves a separate request active',()=>{
 const s=setup(),a=s.create();a.request.callOtherDomain();const first=s.requests.at(-1);const b=s.create();b.request.callOtherDomain();const other=s.requests.at(-1);
 s.reply(first);const retry=s.requests.at(-1);a.request.cancel();assert.equal(retry.aborts,1);assert.equal(other.aborts,0);s.reply(other,200);
 assert.equal(a.success.length,0);assert.equal(a.failure.length,0);assert.equal(b.success.length,1);assert.equal(b.failure.length,0);assert.equal(s.timers.size,0);
});
test('uncancelled failures retain the existing bounded four-attempt behavior',()=>{
 const s=setup(),r=s.create();r.request.callOtherDomain();for(let i=0;i<4;i++)s.reply(s.requests.at(-1));
 assert.equal(s.requests.length,4);assert.equal(s.failures.length,1);assert.equal(s.success.length,0);assert.equal(s.timers.size,0);
});
test('cancelling before send does not start a request later',()=>{
 const s=setup(),r=s.create();r.request.cancel();r.request.callOtherDomain();assert.equal(s.requests[0].sends,0);assert.equal(s.timers.size,0);assert.equal(s.failures.length,0);
});
