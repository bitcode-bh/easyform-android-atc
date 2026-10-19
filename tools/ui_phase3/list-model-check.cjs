// Complete-model filtering/selection/pagination with a bounded, variable-height DOM.
// Local fixtures only: no phone, server requests, screenshots or native writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve('EasyFormSE_finance/assets/www2');
const html=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}#scroll{height:100vh;overflow:auto}ul{margin:0;padding:16px;list-style:none}li{box-sizing:border-box;padding:12px;margin-bottom:2px;background:#ecedef}button{height:28px}</style><script src="/js/app_shell.js"></script><script src="/js/app_list_window.js"></script></head><body><div id="scroll"><div style="height:80px">Existing header</div><ul id="list"></ul></div></body></html>`;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});try{
 for(const width of [320,390,800]){
  const context=await browser.newContext({viewport:{width,height:width===800?480:844},deviceScaleFactor:width===390?3:1});const errors=[],external=[];
  await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!=='http://mwfm-model.test'){external.push(url.origin);return route.abort();}if(url.pathname==='/fixture')return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(root,'.'+url.pathname);return file.startsWith(root+path.sep)&&fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
  if(width===800)await context.addInitScript(()=>{window.ResizeObserver=undefined;});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://mwfm-model.test/fixture');
  const result=await page.evaluate(async()=>{
   const root=document.getElementById('list'),scroller=document.getElementById('scroll'),scope=AppShell.scope();let changes=0,created=0;
   const wait=async()=>{for(let i=0;i<6;i++)await new Promise(requestAnimationFrame);};
   const items=(from,n)=>Array.from({length:n},(_,i)=>({id:from+i,text:'Task '+(from+i),expanded:false}));
   const model=AppListWindow.create(root,{scope,scroller,rows:items(0,400),key:r=>r.id,render(row,selected){created++;const node=document.createElement('li');node.id='model-'+row.id;const check=document.createElement('input');check.type='checkbox';check.checked=selected;check.addEventListener('change',()=>{changes++;model.select(row.id,check.checked);});node.appendChild(check);node.appendChild(document.createTextNode(row.text+' '+('Variable content '.repeat(row.id%4+1))));const button=document.createElement('button');button.textContent='Details';button.addEventListener('click',()=>model.update(row.id,{...row,expanded:!row.expanded}));node.appendChild(button);if(row.expanded){const extra=document.createElement('p');extra.textContent='Expanded content '.repeat(10);node.appendChild(extra);}return node;}});
   let duplicateRejected=false;try{model.replace([{id:1},{id:1}]);}catch(e){duplicateRejected=true;}const preservedAfterBadReplace=model.rows().length===400;
   await wait();const initialNodes=root.children.length,initialCreates=created;
   model.selectAll(true);const allSelected=model.selectedRows().length;
   model.scrollTo(399);await wait();const last=document.getElementById('model-399');last.querySelector('input').click();await wait();
   const selectedAfterLast=model.selectedRows().length,lastVisible=!!document.getElementById('model-399');
   model.scrollTo(390);await wait();let node=document.getElementById('model-390'),height=node.getBoundingClientRect().height;node.querySelector('button').click();await wait();const expandedHeight=document.getElementById('model-390').getBoundingClientRect().height;
   model.scrollTo(0);await wait();model.scrollTo(390);await wait();const expansionRetained=model.rows().find(r=>r.id===390).expanded&&document.getElementById('model-390').querySelector('p')!==null;
   model.filter(row=>row.id===399);await wait();const filteredCount=model.visibleRows().length,filteredDOM=root.children.length,selectionRetained=model.selectedRows().length;
   model.selectAll(true,true);model.append(items(400,40));model.filter(row=>row.id>=435);await wait();
   const appended=model.visibleRows().map(row=>row.id),total=model.rows().length;
   model.filter(null);model.scrollTo(439);await wait();const finalVisible=!!document.getElementById('model-439'),finalDOM=root.children.length;
   window.dispatchEvent(new Event('beforeprint'));const printCount=root.querySelectorAll('[aria-posinset]').length;
   window.dispatchEvent(new Event('afterprint'));await wait();const afterPrintDOM=root.children.length;
   model.replace(items(0,200));await wait();const atThreshold=root.children.length;
   model.append(items(200,1));await wait();const overThreshold=root.children.length;
   model.dispose();scope.dispose();model.append(items(999,1));model.selectAll(true);await wait();const disposedEmpty=root.children.length===0&&model.rows().length===0&&model.selectedRows().length===0;
   return {duplicateRejected,preservedAfterBadReplace,initialNodes,initialCreates,allSelected,selectedAfterLast,lastVisible,expansionRetained,expanded:expandedHeight>height,filteredCount,filteredDOM,selectionRetained,appended,total,finalVisible,finalDOM,printCount,afterPrintDOM,atThreshold,overThreshold,disposedEmpty,changes};
  });
  assert.ok(result.initialNodes<80&&result.initialCreates<100,'initial render never creates all 400 rows');
  assert.equal(result.allSelected,400);assert.equal(result.selectedAfterLast,399);assert.equal(result.selectionRetained,399);assert.equal(result.changes,1);
  for(const key of ['duplicateRejected','preservedAfterBadReplace','lastVisible','expansionRetained','expanded','finalVisible','disposedEmpty'])assert.equal(result[key],true,key);
  assert.equal(result.filteredCount,1);assert.equal(result.filteredDOM,1);assert.deepEqual(result.appended,[435,436,437,438,439]);assert.equal(result.total,440);
  assert.ok(result.finalDOM<80&&result.afterPrintDOM<80&&result.overThreshold<80);assert.equal(result.printCount,440);assert.equal(result.atThreshold,200);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log(JSON.stringify({width,...result,passed:true}));await context.close();
 }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
