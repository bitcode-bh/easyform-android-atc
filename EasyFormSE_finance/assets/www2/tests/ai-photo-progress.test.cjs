const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../EFSE_Js/CapturePhoto.js','utf8');
function harness() {
  const image={src:'previous-valid.jpg'}, nodes=new Map([['photo',image]]), calls=[];
  const c=vm.createContext({document:{getElementById:id=>nodes.get(id)},
    curr_survey_data:{t_id:10,step:1,check_type:20},glob_curr_form_flag:0,
    hide_AI_loader:node=>calls.push(['hide',node]),show_AI_loader:node=>calls.push(['show',node])});
  vm.runInContext(source.slice(source.indexOf('var aiPhotoPending = null;')),c);
  const events=[];
  const callbacks=c.create_ai_photo_handlers('photo',e=>events.push(['complete',e]),e=>events.push(['error',e]));
  return {c,image,nodes,calls,events,callbacks};
}
const captured=JSON.stringify([{phase:'captured',photo_path:'captured.jpg'}]);
const final=JSON.stringify([{photo_path:'checked.jpg',photo_id:7,responsetext:'PASS'}]);
{
 const h=harness(); h.callbacks.success(captured);
 assert.equal(h.image.src,'captured.jpg'); assert.equal(h.events.length,0);
 assert.equal(h.calls[0][0],'show'); assert.ok(h.c.aiPhotoPending);
 h.callbacks.success(final); assert.equal(h.events[0][0],'complete'); assert.equal(h.c.aiPhotoPending,null);
 h.callbacks.success(final); assert.equal(h.events.length,1,'final callbacks must not apply twice');
}
{
 const h=harness(); h.callbacks.success(captured); h.callbacks.error('upload failed');
 assert.equal(h.image.src,'previous-valid.jpg','failed preview cannot masquerade as a saved answer');
 assert.equal(h.events[0][0],'error'); assert.equal(h.c.aiPhotoPending,null);
 h.callbacks.error('duplicate'); assert.equal(h.events.length,1);
}
{
 const h=harness(); h.callbacks.success(captured); h.c.curr_survey_data.t_id=11; h.callbacks.success(final);
 assert.equal(h.events.length,0,'late result cannot change another task'); assert.equal(h.c.aiPhotoPending,null);
}
{
 const h=harness(); h.nodes.set('photo',{src:'new-form.jpg'}); h.callbacks.success(captured); h.callbacks.success(final);
 assert.equal(h.events.length,0,'reused image ID in a new form must not receive the old answer');
 assert.equal(h.nodes.get('photo').src,'new-form.jpg');
}
{
 const h=harness(); h.callbacks.success(captured); h.callbacks.success('not JSON');
 assert.equal(h.events[0][0],'error'); assert.equal(h.image.src,'previous-valid.jpg'); assert.equal(h.c.aiPhotoPending,null);
}
for (const malformed of ['[]', JSON.stringify([{photo_path:'checked.jpg',photo_id:0,responsetext:'FAIL'}]), JSON.stringify([{photo_path:'checked.jpg',photo_id:7}])]) {
 const h=harness(); h.callbacks.success(captured); h.callbacks.success(malformed);
 assert.equal(h.events[0][0],'error','missing upload/validation data must not become a saved answer');
 assert.equal(h.image.src,'previous-valid.jpg'); assert.equal(h.c.aiPhotoPending,null);
}
console.log('AI thumbnail progress: 8 scenarios passed');
