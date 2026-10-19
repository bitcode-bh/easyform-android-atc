/* Per-field drafts use the existing SQLCipher database; no HTML or plaintext cache. */
(function (w, d) {
    'use strict';
    if (w.AppFormDrafts) return;
    var active, generation = 0, rendering = false, submitting = false;
    function copy(value) { return JSON.parse(JSON.stringify(value)); }
    function value(key) { try { return JSON.parse(w.storage.getItem(key)); } catch (e) { return null; } }
    function account() { return JSON.stringify(['company_id','user_id','global_wcf_url'].map(value)); }
    function create(options) {
        var lease, revision = 0, stopped = false, current = new Map(), pending = new Map(), tail = Promise.resolve(), scheduled = false;
        var context = copy(options.context), bridge = options.bridge, owner = options.current || function () { return true; };
        function call(operation, fields) {
            if (!owner()) return Promise.reject(new Error('draft-retired'));
            return new Promise(function (resolve, reject) {
                var complete = false, timer = w.setTimeout(function () { finish(new Error('draft-timeout')); }, 4000);
                function finish(error, result) { if (complete) return; complete = true; w.clearTimeout(timer); if (!owner()) error = new Error('draft-retired'); if (error) reject(error); else resolve(result); }
                bridge(function (result) { try { result = typeof result === 'string' ? JSON.parse(result) : result; if (!result || result.retired) throw new Error('draft-retired'); finish(null, result); } catch (error) { finish(error); } }, function () { finish(new Error('draft-unavailable')); }, { operation: operation, context: context, lease: lease, fields: fields });
            });
        }
        function queue(work) { var result = tail.catch(function () {}).then(work); tail = result; return result; }
        function flush() {
            return queue(function () {
                var batch = Array.from(pending.values()).map(copy);
                if (!batch.length || stopped) return;
                return call('write', batch).then(function () { batch.forEach(function (field) { if (pending.get(field.field)?.revision === field.revision) pending.delete(field.field); }); });
            });
        }
        function update(fields) {
            if (stopped || !owner()) return;
            fields.forEach(function (field) {
                var text = JSON.stringify(field.data), old = current.get(field.field);
                if (old && old.text === text) return;
                var next = { field: field.field, revision: ++revision, data: copy(field.data), text: text };
                current.set(field.field, next); pending.set(field.field, { field: next.field, revision: next.revision, data: next.data });
            });
            if (!scheduled && pending.size) { scheduled = true; Promise.resolve().then(function () { scheduled = false; return flush(); }).catch(function (error) { if (error.message !== 'draft-retired' && options.error) options.error(error); }); }
        }
        return {
            open: function () { return queue(function () { return call('open').then(function (result) { lease = result.lease; revision = result.revision || 0; (result.fields || []).forEach(function (field) { current.set(field.field, {field:field.field,revision:field.revision,data:copy(field.data),text:JSON.stringify(field.data)}); }); return result.fields || []; }); }); },
            baseline: function (fields) { fields.forEach(function (field) { current.set(field.field, { field: field.field, revision: current.get(field.field)?.revision || 0, text: JSON.stringify(field.data), data: copy(field.data) }); }); },
            update: update, flush: flush,
            snapshot: function () { return Array.from(current.values()).filter(function (field) { return field.revision > 0; }).map(function (field) { return { field: field.field, revision: field.revision }; }); },
            acknowledge: function (fields) { return queue(function () { return fields && fields.length ? call('ack', fields) : undefined; }); },
            discard: function () { stopped = true; return queue(function () { return call('discard'); }).then(function () { pending.clear(); }).catch(function(error) { stopped = false; throw error; }); },
            dispose: function () { stopped = true; pending.clear(); current.clear(); }
        };
    }
    function enabled() {
        if (!w.cordova || !w.cordova.exec) return false;
        var settings = value('list_json');
        try { settings = typeof settings === 'string' ? JSON.parse(settings) : settings; } catch (error) { return false; }
        return Array.isArray(settings) && settings[0] && settings[0].ui_field_drafts === true;
    }
    function schema(data, buttons) {
        return JSON.stringify({ fields: data.map(function (field) { var definition = Object.assign({}, field); delete definition.ans; return definition; }), buttons: buttons });
    }
    function notify(error) { if (error.message === 'draft-retired') return; if (w.console) w.console.error('MWFM draft persistence unavailable'); if (w.alert1) w.alert1('Changes could not be saved on this device. Please try again.'); }
    function fields(entry) {
        var root = entry.root, data = entry.data, check = entry.context.checksheet, containers = new Map(), groups = new Map();
        root.querySelectorAll('.cntrl_main_div').forEach(function(node){var at=node.id.lastIndexOf('_0_' + check + '_');if(at>=0)containers.set(node.id.slice(at+1),node);});
        root.querySelectorAll('input').forEach(function(node){if(!groups.has(node.name))groups.set(node.name,[]);groups.get(node.name).push(node);});
        function get(id) { var node = d.getElementById(id); return node && root.contains(node) ? node : null; }
        return data.map(function (question) {
            var type = Number(question.type), suffix = '0_' + check + '_' + question.que_id, ans = question.ans === undefined ? [''] : copy(question.ans);
            var prefix = { 1:'txt_',3:'ddl_',4:'txtno_',8:'cal_',12:'txtrange_',17:'txt_Calc_',20:'type20_txt_',21:'search_item_name_S_Search_',25:'scn_',30:'dynddl_',33:'txtAutoInc_' }[type], node = prefix && get(prefix + suffix);
            if (type === 2 || type === 6) {
                var controls = groups.get((type === 2 ? 'rdogroup_' : 'chkgroup_') + suffix) || [];
                if (controls.length) { ans = controls.filter(function (control) { return control.checked; }).map(function (control) { return control.value; }); if (!ans.length) ans = ['']; }
            } else if (type === 20) {
                var dropdown = get('ddl_search_type20_' + suffix), text = get('type20_txt_' + suffix) || get('search_item_name_Search_' + suffix), label = '', selectedId = '', valid = true;
                if (dropdown) {
                    var choices = Array.from(dropdown.options).filter(function(option){return option.selected;});
                    label = dropdown.multiple ? choices.map(function(option){return option.value;}).join(',').replace(/%20/g,' ').replace(/%26/g,'&') : (choices[0]?.text || '');
                    selectedId = choices.map(function(option){return option.getAttribute('value1') || option.value;}).join(','); valid = dropdown.getAttribute('name') !== '0';
                } else if (text) { label = text.value; selectedId = text.getAttribute('value1') || text.getAttribute('title') || ''; valid = text.getAttribute('name') !== '0'; }
                if(dropdown || text) { try { selectedId = decodeURIComponent(selectedId); } catch(error) {} ans = label && selectedId !== '0' && valid ? [label,selectedId] : ['']; }
            } else if (type === 36) {
                var list = get('items_' + suffix); if(list) ans = [Array.from(list.querySelectorAll('input:checked')).map(function(item){return item.value;}), Array.from(list.querySelectorAll('li')).map(function(item){return item.innerText;})];
            } else if (type === 30) {
                var dynamic = node || get('dynddl_txt_' + suffix), container = get('div_dynddl_' + suffix);
                if(dynamic) { var label = dynamic.options ? dynamic.options[dynamic.selectedIndex]?.text : dynamic.value; var dependency = container?.getAttribute('name') || ''; ans = label && label !== '--- Choose Value ---' ? [label,dependency,dynamic.value] : ['']; }
            } else if (node) {
                if (type === 3) { var selected = node.options[node.selectedIndex]; var label = selected ? selected.text : ''; ans = ['Select Value','--- Select ---','--- Select Values ---'].includes(label) ? [''] : [label]; }
                else if (type === 8) {
                    var mode = 'date'; try { var config = question.prop[0].misc_data[0].value; config = typeof config === 'string' && config ? JSON.parse(config) : config; if (config && config[0]) mode = config[0].mode || mode; } catch(error) {}
                    ans = [node.value && w.convert_to_submit_date_F7 ? w.convert_to_submit_date_F7(node.value,mode) : node.value];
                }
                else ans = [node.value];
            }
            var snapshots = [];
            var container = containers.get(suffix);
            if (container) container.querySelectorAll('input,textarea,select').forEach(function (control) {
                if (!control.id || control.type === 'file' || control.type === 'password' || control.type === 'search' || control.closest('.searchbar')) return;
                snapshots.push({ id:control.id, value:control.value, checked:control.checked === true, title:control.getAttribute('title'), name:control.getAttribute('name') });
            });
            return { field:String(question.que_id), data:{ ans:ans, value:question.value === undefined ? null : question.value, controls:snapshots } };
        });
    }
    function attach(entry, saved) {
        entry.root = d.getElementById('container_div');
        if (!entry.root || active !== entry) return;
        entry.data = Array.isArray(w.jsonObj_old) ? w.jsonObj_old : entry.data;
        saved.forEach(function (field) { (field.data.controls || []).forEach(function (snapshot) {
            var control = d.getElementById(snapshot.id);
            if (!control || !entry.root.contains(control) || control.type === 'file' || control.type === 'password') return;
            control.value = snapshot.value; if (control.type === 'checkbox' || control.type === 'radio') control.checked = snapshot.checked;
            ['title','name'].forEach(function (name) { if (snapshot[name] !== null) control.setAttribute(name, snapshot[name]); });
        }); });
        entry.session.baseline(fields(entry));
        function capture() { if (active === entry) entry.session.update(fields(entry)); }
        entry.capture = capture;
        function changed(event) { if (event.target.type !== 'search' && !event.target.closest('.searchbar')) Promise.resolve().then(capture); }
        entry.root.addEventListener('input', changed); entry.root.addEventListener('change', changed);
        var observer = new MutationObserver(function () { Promise.resolve().then(capture); });
        observer.observe(entry.root,{subtree:true,childList:true,attributes:true,attributeFilter:['src','title','name','value','checked']});
        entry.unbind = function () { observer.disconnect(); entry.root.removeEventListener('input',changed); entry.root.removeEventListener('change',changed); };
        if (saved.length) w.form_has_changed = 'true';
    }
    function beforeRender(args, render) {
        var flag = Number(args[5]);
        if (rendering || ![0,6,14].includes(flag)) return false;
        if (!enabled() || Number(args[6]) === 1 || !Array.isArray(args[3])) {
            var old=active;active=null;generation++;if(old){if(old.unbind)old.unbind();old.session.flush().catch(notify).finally(function(){old.session.dispose();});}return false;
        }
        if (['company_id','user_id','global_wcf_url','wayflow'].some(function(key){var item=value(key);return item === null || item === undefined || item === '';})) return false;
        var owner = account(), id = ++generation, data = copy(args[3]), context = {
            company:String(value('company_id')), user:String(value('user_id')), server:String(value('global_wcf_url')), flow:String(value('wayflow')),
            task:String(value('tid') || 0), checksheet:String(args[1]), step:String(args[2] || 1), kind:flag === 0 ? 'form' : 'task', schema:schema(data,args[4])
        };
        var previous = active; active = null; if (previous && previous.unbind) previous.unbind();
        var entry = {context:context,data:data,submission:null};
        entry.session = create({context:context,current:function(){return owner === account();},bridge:function(ok,fail,request){w.cordova.exec(ok,fail,'SqlitePlugin','formDraft',[request]);},error:notify});
        active = entry;
        Promise.resolve(previous ? previous.session.flush() : null).catch(notify).then(function () { if (previous) previous.session.dispose(); return entry.session.open(); }).then(function (saved) {
            if (id !== generation || owner !== account()) return;
            var byId = new Map(saved.map(function (field) { return [field.field,field.data]; }));
            data.forEach(function (question) { var saved = byId.get(String(question.que_id)); if (saved) { question.ans = copy(saved.ans); if (saved.value !== null) question.value = copy(saved.value); } });
            var restored = Array.from(args); restored[3] = data; rendering = true;
            try { render(restored); } finally { rendering = false; }
            attach(entry,saved);
        }).catch(function (error) {
            if (id !== generation || owner !== account()) return;
            entry.session.dispose(); active = null; notify(error); rendering = true; try { render(Array.from(args)); } finally { rendering = false; }
        });
        return true;
    }
    function beforeSubmit(args, submit) {
        if (!active || submitting || w.curr_btn_mode === 'calculate' || w.curr_btn_mode === 'check_validation_only' || ![0,6,14].includes(Number(args[1]))) return false;
        var entry = active; if (entry.submitPending) return true; entry.submitPending = true; if (entry.capture) entry.capture();
        entry.session.flush().then(function () {
            if (active !== entry) return;
            entry.submission = entry.session.snapshot(); submitting = true; try { submit(); } finally { submitting = false; entry.submitPending = false; }
        }).catch(function(error) { entry.submitPending = false; notify(error); });
        return true;
    }
    function acknowledge() { var entry = active; if (entry && entry.submission) { var saved = entry.submission; entry.submission = null; entry.session.acknowledge(saved).catch(notify); } }
    function discard() { if (!active) return; var entry=active;entry.discarded=true;entry.leaving=entry.session.discard().then(function(){if(entry.unbind)entry.unbind();}).catch(function(error){entry.discarded=false;throw error;});entry.leaving.catch(notify); }
    function beforeNavigate(resume) {
        if (!active) return false;
        var entry = active; if (entry.capture && !entry.discarded) entry.capture();
        var leaving = entry.discarded ? entry.leaving : entry.session.flush();
        Promise.resolve(leaving).then(function () { if (active !== entry) return; if (entry.unbind) entry.unbind(); entry.session.dispose(); active = null; generation++; resume(); }).catch(function(error) { if (error.message === 'draft-retired') { if (entry.unbind) entry.unbind(); entry.session.dispose(); if(active === entry)active=null; generation++; resume(); } else notify(error); });
        return true;
    }
    function changed() { if(active && active.capture) Promise.resolve().then(active.capture); }
    w.AppFormDrafts = {changed:changed,create:create,beforeRender:beforeRender,beforeSubmit:beforeSubmit,acknowledge:acknowledge,discard:discard,beforeNavigate:beforeNavigate};
})(window,document);
