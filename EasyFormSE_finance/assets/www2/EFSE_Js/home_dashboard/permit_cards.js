// Sample permit to work cards.
//
// A viewer for what a permit card looks like for each work type: opened from
// "Show sample" on Home's permit slide, swiped sideways between types, tapped
// to turn a card over. Every card is marked "Sample".
//
// NOTHING HERE IS A REAL PERMIT. The app has no source of permit records yet,
// and the hazards, PPE and precautions below are placeholder wording that has
// not been approved by the safety team. When real permits and approved text
// exist, they replace SAMPLE and TYPES[].hazards/ppe/steps.

var PermitCards = (function () {
    'use strict';

    var ROOT_ID = 'permit_samples';

    // Line drawings, 100 x 100, drawn with the type's colour.
    var TYPES = [
        {
            name: 'Hot work', colour: '#D85A30', no: 'PTW-HW-00000',
            art: 'M50 8 C56 30 80 40 80 64 a30 30 0 0 1 -60 0 C20 48 32 42 36 28 C42 36 44 42 44 48 C52 38 53 22 50 8 Z',
            hazards: ['Fire and sparks', 'Burns', 'Fumes'],
            ppe: ['Welding helmet', 'Leather gloves', 'Fire-retardant wear'],
            steps: ['Fire extinguisher within reach', 'Combustibles cleared', 'Fire watch after the work']
        },
        {
            name: 'Work at height', colour: '#BA7517', no: 'PTW-WH-00000',
            art: 'M32 8 V92 M68 8 V92 M32 24 H68 M32 42 H68 M32 60 H68 M32 78 H68',
            hazards: ['Fall from height', 'Falling objects', 'Weather and wind'],
            ppe: ['Full body harness', 'Double lanyard', 'Helmet with chin strap'],
            steps: ['Anchor point inspected', 'Tools tethered', 'No climb in rain or high wind']
        },
        {
            name: 'Electrical work', colour: '#378ADD', no: 'PTW-EL-00000',
            art: 'M56 6 L22 56 H46 L40 94 L78 42 H54 Z',
            hazards: ['Electric shock', 'Arc flash', 'Stored energy'],
            ppe: ['Insulated gloves', 'Arc-rated face shield', 'Safety shoes'],
            steps: ['Isolate, lock and tag', 'Test for dead before touch', 'Insulated tools only']
        },
        {
            name: 'FTTH', colour: '#1D9E75', no: 'PTW-FT-00000',
            art: 'M14 58 H86 V84 H14 Z M30 58 V34 M70 58 V34 M28 71 h4 M44 71 h4 M60 71 h12 M40 24 a14 14 0 0 1 20 0 M32 14 a26 26 0 0 1 36 0',
            hazards: ['Laser light in fibre', 'Glass shards', 'Roadside traffic'],
            ppe: ['Safety glasses', 'Cut-resistant gloves', 'Hi-vis vest'],
            steps: ['Never look into a live fibre', 'Shards in a sealed bin', 'Cones and signage at roadside']
        },
        {
            name: 'Excavation', colour: '#8A6A4A', no: 'PTW-EX-00000',
            art: 'M70 10 L88 28 M79 19 L46 52 M36 46 L54 64 L34 86 C24 90 12 78 14 66 Z',
            hazards: ['Buried cables and pipes', 'Trench collapse', 'Open pit'],
            ppe: ['Helmet', 'Safety shoes', 'Hi-vis vest'],
            steps: ['Scan for utilities first', 'Barricade and sign the pit', 'Shore deep trenches']
        },
        {
            name: 'Night work', colour: '#534AB7', no: 'PTW-NW-00000',
            art: 'M72 62 A34 34 0 1 1 42 18 A27 27 0 0 0 72 62 Z',
            hazards: ['Poor visibility', 'Fatigue', 'Security risk'],
            ppe: ['Head torch', 'Reflective vest', 'Safety shoes'],
            steps: ['Two-person team minimum', 'Regular check-ins', 'Site lighting in place']
        }
    ];

    // The same placeholder details on every sample card.
    var SAMPLE = { site: 'Site 00000', from: '10:00 am', until: '2:00 pm', issuedTo: 'Technician name', approvedBy: 'Approver name' };

    // The Altius logo, top right. The app ships no Altius logo file (the login
    // page's comes from the server and is not kept), so this looks for
    // images/altius_logo.png and falls back to the name in the brand navy
    // until that file is added.
    var ALTIUS_LOGO = '<span class="ps-altius"><img src="images/altius_logo.png" alt="Altius" '
        + 'onerror="this.parentNode.textContent=\'ALTIUS\'" /></span>';

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function drawing(type, cls) {
        return '<svg class="' + cls + '" viewBox="0 0 100 100" aria-hidden="true"><path d="' + type.art + '" fill="none" stroke="'
            + type.colour + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }

    function field(label, value) {
        return '<div><small>' + esc(label) + '</small><b>' + esc(value) + '</b></div>';
    }

    function list(title, items, icon, colour) {
        var html = '<div><small style="color:' + colour + '">' + esc(title) + '</small><ul>';
        for (var i = 0; i < items.length; i++) {
            html += '<li><i class="fa-solid ' + icon + '" style="color:' + colour + '" aria-hidden="true"></i><span>' + esc(items[i]) + '</span></li>';
        }
        return html + '</ul></div>';
    }

    // Whose permit it is: the logged-in user's own picture and username, shown
    // in the card's top left corner.
    function holder() {
        var photo = 'images/profile_pic.png', name = '';
        try {
            var img = document.getElementById('menu_img_profile');
            if (img && img.getAttribute('src')) photo = img.getAttribute('src');
        } catch (e) { }
        try { name = String(JSON.parse(storage.getItem('username')) || ''); } catch (e) { name = ''; }
        return { photo: photo, name: name };
    }

    function cardHtml(type) {
        var who = holder();
        // Front: who and what at the top with the Altius logo in the top right
        // corner, the permit's details straight under them, and the 24x7
        // SHIELD logo in the bottom right corner.
        var front = '<div class="ps-face ps-front">' + drawing(type, 'ps-art')
            + '<div class="ps-head"><div class="ps-who"><img class="ps-photo" src="' + esc(who.photo) + '" alt="" />'
            + '<span class="ps-name">' + esc(who.name) + '</span></div>'
            + '<div class="ps-title"><small>Permit to work</small><b>' + esc(type.name) + '</b></div>'
            + ALTIUS_LOGO + '</div>'
            + '<div class="ps-fields">' + field('Permit no.', type.no) + field('Site', SAMPLE.site)
            + field('Valid from', SAMPLE.from) + field('Valid until', SAMPLE.until)
            + field('Issued to', who.name || SAMPLE.issuedTo) + field('Approved by', SAMPLE.approvedBy) + '</div>'
            + '<div class="ps-brand"><span class="ps-tag">Sample</span><span>Tap to turn over</span></div>'
            + '<img class="ps-shield" src="images/lms_shield_logo.png" alt="24x7 SHIELD" /></div>';
        // Back: the safety content, with the QR code in the corner it had on
        // the front.
        var back = '<div class="ps-face ps-back">' + drawing(type, 'ps-art')
            + '<div class="ps-lists">' + list('Hazards', type.hazards, 'fa-triangle-exclamation', type.colour)
            + list('Mandatory PPE', type.ppe, 'fa-shield-halved', type.colour)
            + '<div class="ps-wide">' + list('Before you start', type.steps, 'fa-square-check', type.colour) + '</div></div>'
            + '<div class="ps-foot">Sample wording. Stop work if conditions change.</div>'
            + '<div class="ps-qr"><i class="fa-solid fa-qrcode" aria-hidden="true"></i></div></div>';
        return '<div class="ps-slide"><div class="ps-card">' + front + back + '</div></div>';
    }

    function close() {
        var root = document.getElementById(ROOT_ID);
        if (root) root.parentNode.removeChild(root);
    }

    function isOpen() {
        return !!document.getElementById(ROOT_ID);
    }

    function open() {
        if (isOpen()) return;
        var slides = '', dots = '';
        for (var i = 0; i < TYPES.length; i++) {
            slides += cardHtml(TYPES[i]);
            dots += '<span' + (i === 0 ? ' class="on"' : '') + '></span>';
        }
        var root = document.createElement('div');
        root.id = ROOT_ID;
        root.innerHTML = '<div class="ps-sheet">'
            + '<div class="ps-bar"><span>Sample permits</span><button type="button" class="ps-close" aria-label="Close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>'
            + '<div class="ps-track">' + slides + '</div>'
            + '<div class="ps-dots" aria-hidden="true">' + dots + '</div>'
            + '<div class="ps-hint">Swipe to change permit type</div></div>';
        // The cards are as tall as the Safety Passport card on Home.
        var passport = document.querySelector('#div_home_hero .hh-passport');
        if (passport && passport.offsetHeight) root.style.setProperty('--ps-h', passport.offsetHeight + 'px');
        document.body.appendChild(root);

        var track = root.querySelector('.ps-track');
        var wait = null;
        track.addEventListener('scroll', function () {
            if (wait) return;
            wait = setTimeout(function () {
                wait = null;
                var idx = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
                var all = root.querySelectorAll('.ps-dots span');
                for (var k = 0; k < all.length; k++) all[k].className = k === idx ? 'on' : '';
            }, 80);
        });
        $(root).on('click', '.ps-card', function () { $(this).toggleClass('is-back'); });
        $(root).on('click', '.ps-close', function () { close(); return false; });
        // A tap on the dimmed area outside the sheet closes it.
        root.addEventListener('click', function (ev) { if (ev.target === root) close(); });
    }

    // Hardware Back closes the viewer before anything else handles it.
    document.addEventListener('backbutton', function (ev) {
        if (!isOpen()) return;
        close();
        ev.preventDefault();
        ev.stopPropagation();
    }, false);

    return { open: open, close: close, isOpen: isOpen, _types: TYPES, _cardHtml: cardHtml };
})();
