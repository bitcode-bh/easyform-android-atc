/**
 * Pull Down to Search Implementation
 * Shows a search bar when pulling down on the Home Screen.
 * Filters both list view and card view locally.
 *
 * This script is loaded in selection.html AFTER framework7 + kitchen-sink.js.
 * It polls until myApp/Dom7 are ready, then binds the F7 'refresh' event.
 */

(function () {
    var searchVisible = false;

    // Poll until Framework7 is ready (myApp + Dom7 exist)
    var bindAttempts = 0;
    var bindInterval = setInterval(function () {
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
        var ptrEl = $$('.pull-to-refresh-content');
        if (ptrEl.length > 0) {
            ptrEl.on('refresh', function (e) {
                // Immediately finish the pull-to-refresh animation
                myApp.pullToRefreshDone(ptrEl);
                // Show the search bar
                showSearchBar();
            });
        }

        // Also bind via onPageInit for future navigations
        myApp.onPageInit('list-view', function (page) {
            var ptr = $$(page.container).find('.pull-to-refresh-content');
            if (ptr.length > 0) {
                ptr.on('refresh', function (e) {
                    myApp.pullToRefreshDone(ptr);
                    showSearchBar();
                });
            }
        });
    }, 100);

    function showSearchBar() {
        var bar = document.getElementById('home_search_bar');
        var input = document.getElementById('home_search_input');
        if (!bar) return;

        if (searchVisible) return; // already open
        searchVisible = true;

        bar.style.display = 'block';
        if (input) {
            setTimeout(function () {
                input.focus();
            }, 200);
        }
    }

    window.closeHomeSearch = function () {
        var bar = document.getElementById('home_search_bar');
        var input = document.getElementById('home_search_input');
        var clearBtn = document.getElementById('home_search_clear');

        searchVisible = false;

        if (bar) bar.style.display = 'none';
        if (input) {
            input.value = '';
            input.blur();
        }
        if (clearBtn) clearBtn.style.display = 'none';

        filterHomeList('');
    };

    // Handle search input for filtering
    $(document).on('input', '#home_search_input', function () {
        var query = this.value.toLowerCase().trim();
        var clearBtn = document.getElementById('home_search_clear');
        if (clearBtn) {
            clearBtn.style.display = query.length > 0 ? 'block' : 'none';
        }
        filterHomeList(query);
    });

    // Enter key dismisses keyboard
    $(document).on('keypress', '#home_search_input', function (e) {
        if (e.which === 13) {
            this.blur();
        }
    });

    // When keyboard hides (input loses focus), hide search bar
    $(document).on('blur', '#home_search_input', function () {
        setTimeout(function () {
            closeHomeSearch();
        }, 200);
    });

    // Detect keyboard hide via window resize (especially for Android back button dismissing keyboard)
    var initialWindowHeight = window.innerHeight;
    window.addEventListener('resize', function () {
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
    document.addEventListener('backbutton', function (e) {
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
})();
