/**
 * Pull Down to Search Implementation
 * Pulling down on the Home list shows the search field in the top bar, in
 * place of the greeting and date.
 * Filters both list view and card view locally.
 *
 * This script is loaded in selection.html AFTER framework7 + kitchen-sink.js.
 * It polls until myApp/Dom7 are ready, then binds the F7 'refresh' event.
 */

(function(w){
    'use strict';
    if(w.AppHomeSearchController)return;
    function create(options){
        options=options||{};
        var $=options.$||w.jQuery,document=options.document||w.document,myApp=options.services?options.services.app:w.myApp;
        var setTimeout=options.scope?function(fn,ms){return options.scope.timeout(fn,ms);}:w.setTimeout.bind(w);
        var setInterval=options.scope?function(fn,ms){return options.scope.interval(fn,ms);}:w.setInterval.bind(w);
        var clearInterval=options.scope?options.scope.clearInterval:w.clearInterval.bind(w);
        function listen(node,event,callback){if(options.scope)options.scope.on(node,event,callback);else node.addEventListener(event,callback,false);}

    var searchVisible = false;

    // Poll until Framework7 is ready (myApp + Dom7 exist)
    var bindAttempts = 0;
    var bindInterval;
    function bindRefresh() {
        bindAttempts++;
        if (bindAttempts > 200) {
            clearInterval(bindInterval);
            return;
        }
        if (typeof myApp === 'undefined' || typeof Dom7 === 'undefined') {
            return;
        }
        clearInterval(bindInterval);

        var $$ = Dom7;

        // Bind on the existing element right now
        var ptrEl = $(document.querySelectorAll('.pull-to-refresh-content'));
        if (ptrEl.length > 0) {
            ptrEl.on('refresh', function (e) {
                // Immediately finish the pull-to-refresh animation
                myApp.pullToRefreshDone(ptrEl);
                // Show the search bar
                showSearchBar();
            });
        }

        // Also bind via onPageInit for future navigations
        if (!options.scope) myApp.onPageInit('list-view', function (page) {
            var ptr = $$(page.container).find('.pull-to-refresh-content');
            if (ptr.length > 0) {
                ptr.on('refresh', function (e) {
                    myApp.pullToRefreshDone(ptr);
                    showSearchBar();
                });
            }
        });
    }
    if (options.scope) bindRefresh(); else bindInterval = setInterval(bindRefresh, 100);

    // The search field lives in the top bar itself: it is moved there once,
    // and while it is open it takes the place of the greeting and date.
    function topBar() {
        return document.querySelector('.view-main .navbar .navbar-inner');
    }

    function dockSearchBar() {
        var bar = document.getElementById('home_search_bar');
        var inner = topBar();
        if (bar && inner && bar.parentNode !== inner) inner.appendChild(bar);
    }

    function showSearchBar() {
        dockSearchBar();
        var bar = document.getElementById('home_search_bar');
        var input = document.getElementById('home_search_input');
        if (!bar) return;

        if (searchVisible) return; // already open
        searchVisible = true;

        // The greeting gives way to the field (see home_nav.css).
        bar.classList.add('open');
        var inner = topBar();
        if (inner) inner.classList.add('home-search-on');
        // The page under it runs to the keyboard while search is open (home_nav.css).
        document.body.classList.add('home-search-open');
        if (input) {
            setTimeout(function () {
                input.focus();
            }, 200);
        }
    }

    function closeHomeSearch() {
        var bar = document.getElementById('home_search_bar');
        var input = document.getElementById('home_search_input');
        var clearBtn = document.getElementById('home_search_clear');

        searchVisible = false;

        if (bar) bar.classList.remove('open');
        var inner = topBar();
        if (inner) inner.classList.remove('home-search-on');
        document.body.classList.remove('home-search-open');
        if (input) {
            input.value = '';
            input.blur();
        }
        if (clearBtn) clearBtn.style.display = 'none';

        filterHomeList('');
    };

    // Handle search input for filtering
    $(document).on('input.homeSearch', '#home_search_input', function () {
        var query = this.value.toLowerCase().trim();
        var clearBtn = document.getElementById('home_search_clear');
        if (clearBtn) {
            clearBtn.style.display = query.length > 0 ? 'block' : 'none';
        }
        filterHomeList(query);
    });

    // Enter key dismisses keyboard
    $(document).on('keypress.homeSearch', '#home_search_input', function (e) {
        if (e.which === 13) {
            this.blur();
        }
    });

    // When keyboard hides (input loses focus), hide search bar
    $(document).on('blur.homeSearch', '#home_search_input', function () {
        setTimeout(function () {
            closeHomeSearch();
        }, 200);
    });

    // Detect keyboard hide via window resize (especially for Android back button dismissing keyboard)
    var initialWindowHeight = window.innerHeight;
    listen(w, 'resize', function () {
        // If window resizes back to roughly initial height (keyboard closed) and search is visible
        if (searchVisible && window.innerHeight >= initialWindowHeight - 50) {
            var activeElement = document.activeElement;
            if (activeElement && activeElement.id === 'home_search_input') {
                activeElement.blur(); // Ensure focus is lost
            }
            closeHomeSearch();
        }
    });

    // Android back button clears/closes search
    listen(w.document, 'backbutton', function (e) {
        if (searchVisible) {
            closeHomeSearch();
            e.preventDefault();
            e.stopPropagation();
        }
    }, false);

    function filterHomeList(query) {
        // Filter List View items
        var listItems = document.querySelectorAll('#module_list > li');
        for (var i = 0; i < listItems.length; i++) {
            var item = listItems[i];
            var titleEl = item.querySelector('.item-title') || item;
            var text = (titleEl.textContent || titleEl.innerText || '').toLowerCase();
            item.style.display = text.indexOf(query) > -1 || query === '' ? '' : 'none';
        }

        // Filter Card View cells
        var cardCells = document.querySelectorAll('#card_module_list td');
        for (var j = 0; j < cardCells.length; j++) {
            var cell = cardCells[j];
            if (!cell.innerHTML.trim()) continue;
            var cellText = (cell.textContent || cell.innerText || '').toLowerCase();
            cell.style.display = cellText.indexOf(query) > -1 || query === '' ? '' : 'none';
        }

        // Hide empty card rows
        var cardRows = document.querySelectorAll('#card_module_list tr');
        for (var k = 0; k < cardRows.length; k++) {
            var row = cardRows[k];
            var visible = false;
            for (var c = 0; c < row.children.length; c++) {
                if (row.children[c].style.display !== 'none' && row.children[c].innerHTML.trim()) {
                    visible = true;
                    break;
                }
            }
            row.style.display = visible || query === '' ? '' : 'none';
        }
    }

        if(options.scope)options.scope.defer(function(){$(document).off('.homeSearch');});
        var api={open:showSearchBar,close:closeHomeSearch,filter:filterHomeList,isOpen:function(){return searchVisible;}};
        if(options.scope)Object.keys(api).forEach(function(key){api[key]=options.scope.own(api[key]);});
        return api;
    }
    w.AppHomeSearchController={create:create};
    if(!w.document.documentElement.hasAttribute||!w.document.documentElement.hasAttribute('data-app-shell'))w.closeHomeSearch=create().close;
})(window);
