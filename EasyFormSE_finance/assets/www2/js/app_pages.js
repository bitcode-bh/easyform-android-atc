/* Production page registrations. Missing/unsupported flows retain full reload. */
(function (w, d) {
    'use strict';
    if (w.AppPages) return;
    var assets = Object.create(null), instances = new WeakMap(), sequence = 0;
    var page = 'viewsitelist_pm_grouplist.html';

    function text(url) {
        if (!assets[url]) assets[url] = Promise.resolve(w.jQuery.ajax({ url: url, dataType: 'text', cache: true }))
            .catch(function (error) { delete assets[url]; throw error; });
        return assets[url];
    }
    function stylesheet(url) {
        return text(url).then(function (css) {
            var base = new URL(url, w.location.href);
            return css.replace(/url\((['"]?)(.*?)\1\)/g, function (match, quote, target) {
                return /^data:|^#/.test(target) ? match : 'url("' + new URL(target, base).href + '")';
            });
        });
    }
    function script(url) {
        if (!assets[url]) assets[url] = new Promise(function (resolve, reject) {
            var node = d.createElement('script'); node.src = url;
            node.onload = resolve;
            node.onerror = function () { node.remove(); delete assets[url]; reject(new Error('Unable to load page controller')); };
            d.head.appendChild(node);
        });
        return assets[url];
    }
    function selectors(value) {
        var result = [], start = 0, depth = 0, quote = '';
        for (var i = 0; i < value.length; i++) {
            var ch = value[i];
            if (quote) { if (ch === quote && value[i - 1] !== '\\') quote = ''; }
            else if (ch === '"' || ch === "'") quote = ch;
            else if (ch === '(' || ch === '[') depth++;
            else if (ch === ')' || ch === ']') depth--;
            else if (ch === ',' && depth === 0) { result.push(value.slice(start, i)); start = i + 1; }
        }
        result.push(value.slice(start)); return result;
    }
    function scopedStyle(css, prefix, rootClass) {
        var source = d.createElement('style'); source.media = 'not all'; source.textContent = css; d.head.appendChild(source);
        function rules(list) {
            return Array.from(list).map(function (rule) {
                if (rule.type === 1) return selectors(rule.selectorText).map(function (selector) {
                    selector = selector.trim();
                    if (rootClass && selector.indexOf(rootClass) === 0) return prefix + selector;
                    return /^(?:html\s+)?body(?=[\s.#:[>]|$)/.test(selector) ? selector.replace(/^(?:html\s+)?body/, prefix) : prefix + ' ' + selector;
                }).join(',') + '{' + rule.style.cssText + '}';
                if (rule.type === 7) return rule.cssText; // Existing keyframes, unchanged.
                if (rule.cssRules) return rule.cssText.slice(0, rule.cssText.indexOf('{') + 1) + rules(rule.cssRules) + '}';
                if (rule.type === 3) throw new Error('Page styles must not import global styles');
                return rule.cssText;
            }).join('\n');
        }
        try { return rules(source.sheet.cssRules); }
        finally { source.remove(); }
    }
    function value(storage, key) { return JSON.parse(storage.getItem(key)); }
    function flow(storage) {
        var result = value(storage, 'list_json');
        if (typeof result === 'string') result = JSON.parse(result);
        return Array.isArray(result) ? result[0] : null;
    }
    function read(context, query) {
        return new Promise(function (resolve, reject) {
            context.services.cordova.exec(function (raw) {
                try { resolve({ raw: raw, rows: typeof raw === 'string' ? JSON.parse(raw) : raw }); }
                catch (error) { reject(error); }
            }, function () { reject(new Error('Unable to read checksheet mapping')); },
            'SqlitePlugin', 'showValues', [{ data: query, p: '1' }]);
        });
    }
    function loadChecksheet() {
        return Promise.all([text(page), stylesheet('css/form_style.css'), script('EFSE_Js/viewsitelist_pm_grouplist.js'), script('EFSE_Js/controls-ele.js'), script('js/app_list_window.js'), stylesheet('font-awesome-4.7.0/css/font-awesome.min.css')]).then(function (loaded) {
            var parsed = new DOMParser().parseFromString(loaded[0], 'text/html');
            var template = parsed.querySelector('.F7-view > .views');
            if (!template || !template.querySelector('#checksheet_list')) throw new Error('Missing checksheet template');
            parsed.querySelectorAll('script').forEach(function (node) { node.remove(); });
            var css = loaded[1] + '\n' + loaded[5] + '\n' + Array.from(parsed.head.querySelectorAll('style')).map(function (node) { return node.textContent; }).join('\n');
            var legend = parsed.querySelector('.popover-chk-btn-info');
            // Keep only the reusable fragments, not their entire parsed document.
            template = d.importNode(template, true);
            if (legend) legend = d.importNode(legend, true);
            return {
                supports: function (context) {
                    var storage = context.services.storage, settings = flow(storage), parents = value(storage, 'flow_Array');
                    // More complex branches retain their complete legacy behavior
                    // until their own controllers have moved into this lifecycle.
                    if (!settings || !Array.isArray(parents) || !parents.length ||
                        settings.checklist_geofence === 'true' || settings.punching === 'true' || settings.manual_trip === 'true' ||
                        settings.colwise_align === 'true' || settings.dynamic_checklist === 'true' ||
                        (Array.isArray(settings.buttons) && settings.buttons.length) ||
                        new URL(context.route, w.location.href).searchParams.has('task_id')) return false;
                    var module = parents.length === 1 ? value(storage, 'wayflow') : parents[parents.length - 1].wayflow;
                    if (module === '' || module === null || module === undefined || module === 0) return false;
                    return read(context, "select data from flow_master where moduleid = '" + String(module).replace(/'/g, "''") + "'").then(function (result) {
                        if (!Array.isArray(result.rows) || !result.rows.length) return false;
                        var mapping = JSON.parse(result.rows[0].data);
                        if (!Array.isArray(mapping) || mapping.some(function (row) { return row.sub_flow_id && row.sub_flow_id != 0; })) return false;
                        instances.set(context, { settings: settings, mapping: result.raw, grouped: mapping.some(function (row) { return !!row.Group_Name; }) }); return true;
                    });
                },
                create: function (document, context) {
                    var root = document.createElement('div'), id = 'checksheet-page-' + (++sequence);
                    root.id = id; root.className = 'app-checksheet-page';
                    var style = document.createElement('style'); style.textContent = scopedStyle(css, '#' + id); root.appendChild(style);
                    root.appendChild(document.importNode(template, true));
                    if (legend) root.appendChild(document.importNode(legend, true));
                    root.querySelectorAll('[onclick],[onchange]').forEach(function (node) { node.removeAttribute('onclick'); node.removeAttribute('onchange'); });
                    return root;
                },
                reset: function (context) {
                    var storage = context.services.storage;
                    storage.setItem('checksheet_dependency', '[]'); storage.setItem('progress_step', JSON.stringify(''));
                    var settings = instances.get(context).settings;
                    if (settings.site_detail === 'true') {
                        var name = value(storage, 'sitename');
                        if (name !== null && name !== undefined && name !== '' && name !== '0') context.root.querySelector('#lbl_site_name').textContent = String(name).substr(0, 15);
                    }
                },
                open: function (context) {
                    var entry = instances.get(context), root = context.root, $ = w.jQuery, actions = new Map(), next = 0;
                    function query(selector) { return typeof selector === 'string' ? $(root).find(selector) : $(selector); }
                    function back() { if (!w.AppComponents.dismissOverlay()) w.back_button('viewsitelist_pm_grouplist'); }
                    entry.back = back;
                    context.scope.on(root.querySelector('#btn_page_back'), 'click', function (event) { event.preventDefault(); event.stopPropagation(); back(); });
                    var information = root.querySelector('#tbl_chk_details'), popup = root.querySelector('.popover-chk-btn-info');
                    information.classList.remove('open-popover');
                    context.scope.on(information, 'click', function (event) { event.preventDefault(); event.stopPropagation(); if (popup) context.services.app.popover(popup, information); });
                    return new Promise(function (resolve, reject) {
                        var failed = false;
                        function ownActions(container) {
                            container.querySelectorAll('[onclick]').forEach(function (node) {
                                var token = node.getAttribute('onclick');
                                if (!actions.has(token)) { fail(); return; }
                                node.removeAttribute('onclick'); node.setAttribute('data-checksheet-action', token);
                            });
                        }
                        function renderRows(rows) {
                            var list = root.querySelector('#checksheet_list'), rowCount = rows.length;
                            if (entry.window) { entry.window.dispose(); entry.window = null; }
                            if (rows.length <= 200) { list.innerHTML = rows.join(''); return; }
                            entry.window = w.AppListWindow.create(list, { scope: context.scope, scroller: list.closest('.page-content'),
                                rows: rows.map(function (html, index) { return { id: index, html: html }; }), key: function (row) { return row.id; },
                                render: function (row, selected, index) {
                                    var template = d.createElement('template'); template.innerHTML = row.html;
                                    var node = template.content.firstElementChild;
                                    node.style.borderRadius = index === 0 ? '10px 10px 0 0' : (index === rowCount - 1 ? '0 0 10px 10px' : '0');
                                    ownActions(template.content); return node;
                                }
                            });
                        }
                        function fail() { failed = true; reject(new Error('Unable to open checksheets')); return true; }
                        var services = Object.assign({}, context.services, { cordova: {
                            exec: function (success, failure, service, action, args) {
                                return context.services.cordova.exec(success, function (error) { fail(); if (typeof failure === 'function') failure(error); }, service, action, args);
                            }
                        } });
                        entry.controller = w.AppChecksheetController.create({ scope: context.scope, services: services, $: query, itemObj: new w.MKCheckItem(),
                            savedLists: { response: function (id, callback) { return callback; }, failed: fail, keep: fail }, renderRows: entry.grouped ? null : renderRows, beginRender: function () { if (entry.window) { entry.window.dispose(); entry.window = null; } actions.clear(); },
                            action: function (name, args) { var token = 'mwfm_action_' + (++next); actions.set(token, { name: name, args: args }); return token; },
                            enableBack: function () {
                                ownActions(root);
                                query('#btn_page_back').css({ 'pointer-events': 'initial', visibility: 'visible' });
                                if (!failed) resolve();
                            }
                        });
                        context.scope.on(root, 'click', function (event) {
                            var target = event.target.closest('[data-checksheet-action]');
                            if (!target || !root.contains(target)) return;
                            var action = actions.get(target.getAttribute('data-checksheet-action'));
                            var method = action && entry.controller[action.name];
                            if (typeof method !== 'function') return;
                            event.preventDefault(); method.apply(entry.controller, action.args);
                        }, true);
                        context.scope.defer(function () { actions.clear(); if (popup) context.services.app.closeModal(popup); });
                        entry.controller.onsuccess_get_checklist_data_for_task(entry.mapping);
                    });
                },
                onBack: function (context) { var entry = instances.get(context); if (entry && entry.back) { entry.back(); return true; } },
                dispose: function (context) { instances.delete(context); }
            };
        });
    }
    var taskPage = 'selection_survey.html';
    function loadTasks() {
        return Promise.all([text(taskPage), stylesheet('css/form_style.css'), stylesheet('css/task_list_theme.css'), stylesheet('font-awesome-4.7.0/css/font-awesome.min.css'),
            script('EFSE_Js/selection_survey.js'), script('EFSE_Js/viewsitelist_pm.js'), script('EFSE_Js/viewsitelist_pm_on.js'),
            script('EFSE_Js_Server/server_viewsitelist.js'), script('EFSE_Js/Upload_Option_Get_List.js'), script('EFSE_Js/controls-ele.js'), script('js/task_status.js'), script('js/app_list_window.js')]).then(function (loaded) {
            var parsed = new DOMParser().parseFromString(loaded[0], 'text/html');
            parsed.querySelectorAll('script').forEach(function (node) { node.remove(); });
            var template = parsed.querySelector('.F7-view > .views');
            if (!template || !template.querySelector('#tab1')) throw new Error('Missing task template');
            var extras = Array.from(parsed.querySelectorAll('.popup,.popover')).filter(function (node) { return !template.contains(node) && !node.parentElement.closest('.popup,.popover'); });
            var css = loaded[1] + '\n' + loaded[2] + '\n' + loaded[3] + '\n' + Array.from(parsed.head.querySelectorAll('style')).map(function (node) { return node.textContent; }).join('\n');
            template = d.importNode(template, true); extras = extras.map(function (node) { return d.importNode(node, true); });
            return {
                supports: function (context) {
                    var storage = context.services.storage, settings = flow(storage), parents = value(storage, 'flow_Array');
                    if (!settings || !Array.isArray(parents) || parents.length !== 1 || !Array.isArray(settings.columndata) ||
                        settings.survey_mode === 'online' || settings.search === 'true' || settings.bulk_approval === 'true' ||
                        settings.view_calendar_task === 'true' || settings.auto_trip === 'true' || settings.task_with_customer === 'true' ||
                        settings.auto_open_task_form === 'true' || settings.user_column || settings.redirect === 'customer' ||
                        settings.navigation === 'true' || settings.site_route === 'true' || settings.weather_display === 'true' ||
                        settings.customer_info === 'true' || settings.CommentUI === 'true' ||
                        (Array.isArray(settings.buttons) && settings.buttons.length) ||
                        (Array.isArray(settings.geofence) && settings.geofence.some(function (item) { return item.value === 'true'; }))) return false;
                    var module = value(storage, 'wayflow');
                    if (module === '' || module === null || module === undefined || module == 0) return false;
                    return read(context, "select data from flow_master where moduleid = '" + String(module).replace(/'/g, "''") + "'").then(function (result) {
                        if (!Array.isArray(result.rows) || !result.rows.length) return false;
                        var mapping = JSON.parse(result.rows[0].data);
                        if (!Array.isArray(mapping) || mapping.some(function (row) { return row.sub_flow_id && row.sub_flow_id != 0; })) return false;
                        instances.set(context, { settings: settings, mapping: result.rows[0].data }); return true;
                    });
                },
                create: function (document, context) {
                    var root = document.createElement('div'), id = 'task-page-' + (++sequence);
                    root.id = id; root.className = 'app-task-page task-list-screen';
                    var style = document.createElement('style'); style.textContent = scopedStyle(css, '#' + id, '.task-list-screen'); root.appendChild(style);
                    root.appendChild(document.importNode(template, true));
                    extras.forEach(function (node) { root.appendChild(document.importNode(node, true)); });
                    root.querySelectorAll('[onclick],[onchange],[onsubmit]').forEach(function (node) {
                        ['onclick', 'onchange', 'onsubmit'].forEach(function (name) {
                            if (node.hasAttribute(name)) { node.setAttribute('data-task-' + name.slice(2) + '-legacy', node.getAttribute(name)); node.removeAttribute(name); }
                        });
                    });
                    root.querySelector('#txtsearch').setAttribute('data-shell-state', 'search');
                    return root;
                },
                reset: function (context) {
                    var storage = context.services.storage, saved = context.state && context.state.page;
                    if (saved && saved.storage) Object.keys(saved.storage).forEach(function (key) { storage.setItem(key, saved.storage[key]); });
                    storage.setItem('crash_status', JSON.stringify('0')); storage.setItem('sub_udf_id', JSON.stringify(''));
                    storage.setItem('checksheet_dependency', '[]'); storage.setItem('progress_step', JSON.stringify(''));
                    storage.setItem('survey_type', JSON.stringify(saved ? Number(saved.surveyType) : 1));
                },
                open: function (context) {
                    var entry = instances.get(context), root = context.root, $ = w.jQuery, state = {}, api = {}, metadata = new Map(), pending = new Set();
                    var next = 0, epoch = 0, opening = true, startupReject;
                    entry.state = state;
                    function query(selector) { return typeof selector === 'string' ? $(root).find(selector) : $(selector); }
                    var document = { createElement: d.createElement.bind(d), createDocumentFragment: d.createDocumentFragment.bind(d),
                        getElementById: function (id) { return root.querySelector('#' + w.CSS.escape(String(id))); },
                        getElementsByName: function (name) { return root.querySelectorAll('[name="' + String(name).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"]'); },
                        querySelector: root.querySelector.bind(root), querySelectorAll: root.querySelectorAll.bind(root) };
                    ['username', 'uniqcode', 'imeino', 'global_wcf_url', 'common_global_wcf_url', 'F7_device'].forEach(function (key) { state[key] = value(context.services.storage, key); });
                    Object.assign(state, { user_lat: 0, user_long: 0, user_accuracy: 0, default_range: 20, limit_range: 20, increment_range: 20, query_type: 1,
                        up_Click: 0, up_Timer1: 0, toggle_search: 0, aggregate_sum: 0, aggregate_min: 0, aggregate_max: 0,
                        glob_statusId_ary: [], glob_statusName_ary: [], glob_statusColor_ary: [], glob_textColor_ary: [] });
                    var configuredLimit = parseInt(entry.settings.show_task_limit);
                    if (configuredLimit > 0) state.default_range = state.limit_range = state.increment_range = configuredLimit;
                    var services = Object.assign({}, context.services, { cordova: { exec: function (success, failure, service, action, args) {
                        var owner = epoch;
                        function guarded(fn) { return typeof fn !== 'function' ? fn : function () { if (owner === epoch) return fn.apply(this, arguments); }; }
                        return context.services.cordova.exec(guarded(success), guarded(function (error) { if (opening && startupReject) startupReject(new Error('Unable to open task data')); if (typeof failure === 'function') failure(error); }), service, action, args);
                    } }, app: {
                        popup: function (selector) { return context.services.app.popup(typeof selector === 'string' ? query(selector)[0] : selector); },
                        closeModal: function (selector) { return context.services.app.closeModal(typeof selector === 'string' ? query(selector)[0] : selector); }
                    }, request: function () {
                        var args = Array.prototype.slice.call(arguments), owner = epoch, completed = false, request;
                        [2,3,4].forEach(function (index) { var callback = args[index]; if (typeof callback === 'function') args[index] = function () {
                            if (completed) return; completed = true; pending.delete(request); if (owner === epoch) return callback.apply(this, arguments);
                        }; });
                        request = Reflect.construct(context.services.request, args);
                        if (!completed) pending.add(request);
                        return request;
                    } });
                    function intent() { epoch++; pending.forEach(function (request) { request.cancel(); }); pending.clear(); }
                    entry.back = function () { intent(); if (!w.AppComponents.dismissOverlay()) w.back_button('selection_survey'); };
                    context.scope.defer(function () {
                        intent(); metadata.clear();
                        root.querySelectorAll('.popup.modal-in,.popover.modal-in').forEach(function (popup) { context.services.app.closeModal(popup); });
                        query('*').addBack().off();
                    });
                    function action(name, args) { var token = 'mwfm_task_action_' + (++next); metadata.set(token, { name: name, args: args }); return token; }
                    function statics(text) {
                        var plain = (text || '').trim().replace(/;$/, '');
                        var empty = /^(\w+)\(\s*\)$/.exec(plain);
                        if (empty && (api[empty[1]] || empty[1] === 'get_selected_chk_count')) return action(empty[1], []);
                        if (plain === 'show_more_task_data(this);event.cancelBubble=true') return action('show_more_task_data', []);
                        var close = /^myApp\.closeModal\((['"])([^'"]+)\1\)$/.exec(plain);
                        if (close) return action('close-modal', [close[2]]);
                    }
                    function bindActions() {
                        root.querySelectorAll('[onclick],[onchange],[data-task-click-legacy],[data-task-change-legacy]').forEach(function (node) {
                            ['click', 'change'].forEach(function (type) {
                                var legacy = 'data-task-' + type + '-legacy', text = node.getAttribute('on' + type) || node.getAttribute(legacy);
                                if (text === null) return;
                                var token = metadata.has(text) ? text : statics(text);
                                node.removeAttribute('on' + type); node.removeAttribute(legacy);
                                if (token) node.setAttribute('data-task-' + type, token);
                            });
                        });
                        var live = new Set(); root.querySelectorAll('[data-task-click],[data-task-change]').forEach(function (node) { live.add(node.getAttribute('data-task-click')); live.add(node.getAttribute('data-task-change')); });
                        metadata.forEach(function (value, token) { if (!live.has(token)) metadata.delete(token); });
                    }
                    function legacyRow(id, outer) {
                        var row = document.getElementById('lst_' + id);
                        if (!row) throw new Error('Missing selected task row');
                        var copy = row.cloneNode(true);
                        [copy].concat(Array.from(copy.querySelectorAll('*'))).forEach(function (node) {
                            ['click', 'change'].forEach(function (type) {
                                var token = node.getAttribute('data-task-' + type), value = metadata.get(token);
                                if (!value) return;
                                var code = value.name === 'show_more_task_data' ? 'show_more_task_data(this);event.cancelBubble=true;' : value.name + '(' + value.args.map(function (arg) { return JSON.stringify(arg); }).join(',') + ')';
                                node.setAttribute('on' + type, code); node.removeAttribute('data-task-' + type);
                            });
                        });
                        return outer ? copy.outerHTML : copy.innerHTML;
                    }
                    return new Promise(function (resolve, reject) {
                        startupReject = reject;
                        function enableBack() { bindActions(); query('#btn_page_back').css({ 'pointer-events': 'initial', visibility: 'visible' }); if (opening) { opening = false; resolve(); } }
                        var options = { scope: context.scope, services: services, state: state, actions: api, $: query, document: document, action: action, rowHTML: legacyRow,
                            enableBack: enableBack, disableBack: function () { query('#btn_page_back').css({ 'pointer-events': 'none', visibility: 'hidden' }); }, savedLists: null, isCurrentList: function (type) { return Number(value(context.services.storage, 'survey_type')) === type; }, itemObj: new w.MKCheckItem() };
                        var navigation = w.AppTaskNavigationController.create(options), offline = w.AppTaskListController.create(options), online = w.AppOnlineTaskController.create(options);
                        Object.assign(api, navigation, offline, online, w.AppCompletedTaskController.create(options), w.AppUploadTaskController.create(options));
                        [[navigation,['active_Tab','last_obj_search']],[offline,['trip_New_Array']],[online,['glob_taskclick_ary']]].forEach(function (pair) {
                            pair[1].forEach(function (name) { Object.defineProperty(state,name,{get:function(){return pair[0][name];},set:function(value){pair[0][name]=value;}}); });
                        });
                        api.check_child_flow_for_parent = function () { context.services.storage.setItem('task_data_column', entry.mapping); w.changeurl(page); };
                        api.get_selected_chk_count = function () { var count = query('#site_list input[name="li_chk"]:checked').length; query('#lbl_select_cnt').text(count); query('#nav_select_all .right').toggle(count > 0); };
                        function dispatch(event, type) {
                            var node = event.target.closest('[data-task-' + type + ']'); if (!node || !root.contains(node)) return;
                            var data = metadata.get(node.getAttribute('data-task-' + type)); if (!data) return;
                            event.preventDefault(); event.stopPropagation();
                            if (!['show_more_task_data','get_selected_chk_count','alert1','mk_notify'].includes(data.name)) intent();
                            if (data.name === 'show_more_task_data') { w.show_more_task_data(node); return; }
                            if (data.name === 'close-modal') { services.app.closeModal(data.args[0]); return; }
                            if (data.name === 'alert1' || data.name === 'mk_notify') { w.alert1(data.args[0]); return; }
                            if (data.name === 'select_survey_type_tab') context.services.app.showTab(root.querySelector(node.getAttribute('href')));
                            var method = api[data.name];
                            if (typeof method !== 'function') { reject(new Error('Unsupported task action')); return; }
                            method.apply(api, data.args);
                        }
                        context.scope.on(root, 'click', function (event) { dispatch(event, 'click'); }, true);
                        context.scope.on(root, 'change', function (event) { dispatch(event, 'change'); });
                        context.scope.on(root.querySelector('#btn_page_back'), 'click', function (event) { event.preventDefault(); event.stopPropagation(); entry.back(); });
                        var observer = new MutationObserver(bindActions); observer.observe(root, { subtree: true, childList: true }); context.scope.defer(function () { observer.disconnect(); });
                        var statuses = w.AppTaskStatus.create(services, state, function () {
                            context.services.app.showTab(root.querySelector('#tab1'));
                            navigation.create_tabs_by_status();
                            var saved = context.state && context.state.page;
                            if (saved && Number(saved.surveyType) !== 1) { intent(); context.services.app.showTab(root.querySelector(Number(saved.surveyType) === 2 ? '#tab2' : '#tab3')); navigation.select_survey_type_tab(Number(saved.surveyType), saved.tabIndex); }
                        }, w.alert1);
                        context.scope.defer(statuses.cancel);
                        query('#btn_Create_Task').hide(); query('#lbl_theme_header').text(value(context.services.storage, 'wayflow_name') || '');
                        root.querySelectorAll('.lst_pen,.lst_com,.lst_upl').forEach(function (list) { w.AppListWindow.mount(list, { enabled: function () { return true; }, scope: context.scope }); });
                        bindActions(); statuses.load('select_survey');
                    });
                },
                capture: function (context) {
                    var saved = {};
                    ['wayflow','wayflow_name','udf_id','flow_Array','cust_flow_Array','id_Array','list_json','list_json_Array','tab_index'].forEach(function (key) { var raw = context.services.storage.getItem(key); if (raw !== null && raw !== undefined) saved[key] = raw; });
                    return { storage: saved, surveyType: Number(value(context.services.storage, 'survey_type')), tabIndex: Number(value(context.services.storage, 'tab_index')) };
                },
                onBack: function (context) { var entry = instances.get(context); if (entry && entry.back) { entry.back(); return true; } },
                dispose: function (context) { instances.delete(context); }
            };
        });
    }

    w.AppPages = {};
    w.AppShell.register(page, { load: loadChecksheet });
    w.AppShell.register(taskPage, { load: loadTasks });
})(window, document);
