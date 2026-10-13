// Marks a list's lone "No Record Found !" row so css/empty_state.css can draw
// it as the empty-list mascot. Only a class is added: the row's text must
// stay exactly as it is, because the list code reads it back to tell an
// empty list from a loaded one.
(function () {
    var TEXT = 'No Record Found !';

    function mark() {
        var rows = document.querySelectorAll('ul > li:only-child');
        for (var i = 0; i < rows.length; i++) {
            var li = rows[i];
            if (li.classList.contains('es-empty')) continue;
            if (!li.querySelector('.item-title')) continue;
            if (String(li.textContent).replace(/\s+/g, ' ').trim() !== TEXT) continue;
            if (li.closest && li.closest('.popup, .popover, .picker-modal, table')) continue;
            li.classList.add('es-empty');
            li.parentNode.classList.add('es-empty-list');
        }
        // A list that has filled since is a normal list again.
        var lists = document.querySelectorAll('ul.es-empty-list');
        for (var j = 0; j < lists.length; j++) {
            if (!lists[j].querySelector(':scope > li.es-empty') || lists[j].children.length !== 1) {
                lists[j].classList.remove('es-empty-list');
                var old = lists[j].querySelectorAll(':scope > li.es-empty');
                for (var k = 0; k < old.length; k++) old[k].classList.remove('es-empty');
            }
        }
    }

    function start() {
        mark();
        if (typeof MutationObserver === 'undefined') return;
        var wait = null;
        new MutationObserver(function () {
            if (wait) return;
            wait = setTimeout(function () { wait = null; mark(); }, 60);
        }).observe(document.body, { childList: true, subtree: true });
    }

    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start);
})();
