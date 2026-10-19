/* Shared factories for migrated pages; legacy page markup stays unchanged. */
(function (w, d) {
    'use strict';
    if (w.AppComponents) return;
    function node(tag, classes, text) {
        var element = d.createElement(tag);
        element.className = classes || '';
        if (text !== undefined) element.textContent = String(text);
        return element;
    }
    function on(element, event, callback, scope) {
        if (scope) scope.on(element, event, callback);
        else element.addEventListener(event, callback);
    }
    function icon(classes) { var item = node('i', classes); item.setAttribute('aria-hidden', 'true'); return item; }
    function button(options) {
        var item = node('button', options.className || 'link icon-only');
        item.type = 'button'; item.setAttribute('aria-label', options.label || '');
        if (options.icon) item.appendChild(icon(options.icon));
        if (options.text) item.appendChild(node('span', '', options.text));
        on(item, 'click', function (event) { event.preventDefault(); if (options.action) options.action(event); }, options.scope);
        return item;
    }
    function search(options) {
        options = options || {};
        var field = node('div', 'home-search-pill app-shell-search');
        var input = node('input', 'home-search-input');
        input.type = 'search'; input.autocomplete = 'off'; input.value = options.value || '';
        input.placeholder = options.placeholder || 'Search';
        input.setAttribute('aria-label', options.label || input.placeholder);
        if (options.stateKey) input.setAttribute('data-shell-state', options.stateKey);
        field.appendChild(icon('fa fa-search home-search-ico')); field.appendChild(input);
        on(input, 'input', function () { if (options.onInput) options.onInput(input.value); }, options.scope);
        return field;
    }
    function topBar(options) {
        options = options || {};
        var bar = node('div', 'navbar app-shell-topbar'), inner = node('div', 'navbar-inner');
        var left = node('div', 'left'), center = node('div', 'center'), right = node('div', 'right');
        var slots = Math.max((options.back === false ? 0 : 1) + (options.leading ? 1 : 0), (options.actions || []).length);
        bar.style.setProperty('--shell-bar-edge', (slots * 44 + 12) + 'px');
        if (options.back !== false) left.appendChild(button({ icon: 'app-back-icon', label: 'Back', scope: options.scope,
            action: options.onBack || function () { if (!w.AppShell.back()) w.changeurl('selection.html', 'back'); } }));
        if (options.leading) left.appendChild(options.leading);
        if (options.search) {
            var searchOptions = Object.assign({}, options.search); searchOptions.scope = searchOptions.scope || options.scope;
            center.classList.add('app-shell-search-slot'); center.appendChild(search(searchOptions));
        }
        else { center.textContent = options.title || ''; center.setAttribute('role', 'heading'); center.setAttribute('aria-level', '1'); }
        (options.actions || []).forEach(function (action) {
            var copy = Object.assign({}, action); copy.scope = copy.scope || options.scope; right.appendChild(button(copy));
        });
        inner.appendChild(left); inner.appendChild(center); inner.appendChild(right); bar.appendChild(inner);
        return bar;
    }
    var menuPromise;
    function sideMenu() {
        // This existing fragment already owns the menu and shared profile,
        // passport, language and other popups. Keep its exact markup/design.
        if (menuPromise) return menuPromise;
        menuPromise = new Promise(function (resolve, reject) {
            w.jQuery.ajax({ url: 'f7_navbar.html', dataType: 'html', cache: true }).then(function (html) {
                try {
                    var parsed = new DOMParser().parseFromString(html, 'text/html');
                    if (!parsed.querySelector('#nav_main.panel')) throw new Error('Shared menu is missing');
                    parsed.querySelectorAll('script').forEach(function (script) { script.remove(); });
                    var chrome = d.createElement('div'); chrome.id = 'app-shell-chrome';
                    Array.from(parsed.body.childNodes).forEach(function (child) { chrome.appendChild(d.importNode(child, true)); });
                    d.body.appendChild(chrome); resolve(chrome.querySelector('#nav_main'));
                } catch (error) { reject(error); }
            }, reject);
        }).catch(function (error) { menuPromise = null; throw error; });
        return menuPromise;
    }
    function bottomTabs(options) {
        options = options || {};
        var bar = node('div', 'toolbar tabbar toolbar-bottom app-shell-tabs'), inner = node('div', 'toolbar-inner');
        var selected = options.value, controls = [];
        bar.setAttribute('role', 'tablist');
        if (options.stateKey) bar.setAttribute('data-shell-state', options.stateKey);
        function select(value, notify) {
            if (!(options.items || []).some(function (item) { return item.id === value; })) return;
            selected = value;
            controls.forEach(function (entry) {
                var active = entry.id === selected;
                entry.button.classList.toggle('tab-link-active', active); entry.button.setAttribute('aria-selected', String(active));
            });
            if (notify && options.onSelect) options.onSelect(value);
        }
        (options.items || []).forEach(function (item) {
            var control = button({ className: 'tab-link', label: item.title, scope: options.scope, action: function () { select(item.id, true); } });
            control.setAttribute('role', 'tab');
            if (item.icon) control.appendChild(icon(item.icon));
            control.appendChild(node('span', 'tabbar-label', item.title));
            controls.push({ id: item.id, button: control }); inner.appendChild(control);
        });
        Object.defineProperty(bar, 'value', { get: function () { return selected; }, set: function (value) { select(value, false); } });
        bar.appendChild(inner); select(selected, false); return bar;
    }
    function emptyState() {
        var list = node('ul', 'es-empty-list'), row = node('li', 'es-empty');
        var inner = node('div', 'item-inner'); inner.appendChild(node('div', 'item-title', 'No Record Found !'));
        row.appendChild(inner); list.appendChild(row); return list;
    }
    function placeholder() {
        var box = node('div', 'al-box app-shell-placeholder');
        box.setAttribute('role', 'status'); box.setAttribute('aria-label', 'Loading'); box.setAttribute('aria-busy', 'true');
        // This is the loader's own static drawing, with no duplicate overlay ID.
        if (w.AppLoader) box.innerHTML = w.AppLoader.drawing();
        return box;
    }
    function escape(text) { var element = node('span', '', text); return element.innerHTML; }
    function theme(name, colorScheme) {
        d.documentElement.setAttribute('data-app-theme', ['default', 'atc', 'vodafone'].indexOf(name) >= 0 ? name : 'default');
        d.documentElement.setAttribute('data-app-color-scheme', ['light', 'dark', 'system'].indexOf(colorScheme) >= 0 ? colorScheme : 'light');
    }
    function dismissOverlay() {
        if (!w.myApp) return false;
        var modal = d.querySelector('.popup.modal-in,.modal.modal-in,.popover.modal-in,.picker-modal.modal-in,.actions-modal.modal-in');
        if (modal) { w.myApp.closeModal(modal); return true; }
        if (d.querySelector('.panel.active')) { w.myApp.closePanel(); return true; }
        return false;
    }
    w.AppComponents = { topBar: topBar, sideMenu: sideMenu, bottomTabs: bottomTabs, search: search,
        emptyState: emptyState, placeholder: placeholder, theme: theme, dismissOverlay: dismissOverlay,
        notice: function (message) { w.AppPhase1.notice(message); },
        loading: function (active) { if (w.AppLoader) w.AppLoader[active ? 'busy' : 'idle'](); },
        alert: function (message, title) { return w.myApp.alert(escape(message), escape(title || 'Alert')); },
        confirm: function (message) { return w.confirm(String(message)); }
    };
})(window, document);
