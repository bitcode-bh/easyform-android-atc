# Phase 1 implementation and verification

Updated 2026-10-18 (Asia/Kolkata). Base: `f6ae3a2`.
Worktree: `codex/phase-1-responsiveness`.

This records the installed Phase 1 baseline. The owner subsequently authorized
Phase 2; current work and APK identity are tracked in PHASE-2-IMPLEMENTATION.md.
The Phase 1 hash below does not identify the later work-in-progress sources.

## Status

Phase 1 is implemented in an isolated worktree. The startup-cache, slow-refresh and
Framework7 initializer corrections are installed on Motorola Edge 70 `ZA223MDVR8`.
The additional empty-task/list-render recovery and Back-router adjustment are
built, locally verified and installed. The real-touch Demo 2.0 form and
Back-to-Home checks passed on that list/Back build without new exceptions.
An additional shared-popup cleanup fix is verified locally, built and installed
on the Motorola over wireless ADB. On this latest build, normal phone taps
verified repeated profile-photo open/close and menu close/reopen. Both closed
photo popups were removed, no new exceptions occurred, and the phone was left
on Home with no popup. Main is untouched.
No commit, push or merge has been performed.
The owner authorized Phase 2 after this phone demonstration; see its separate
implementation record. Remaining Phase 1 acceptance limits below still apply.

The six Phase 1 items have local verification. Phone verification exposed a late
saved-list restore: a startup probe confirmed `survey_type` was the only
differing key. The installed correction is verified: saved content appeared at about 164 ms
after navigation and fresh replacement at about 617 ms in the bounded startup
probe. No duplicate rows were observed. Do not treat this report
as Phase 1 acceptance: another test phone, a full functional test day, hardware/upload coverage and
actual backend rollout delivery are still outstanding. The owner-selected
Demo 2.0 form has now been inspected without changing or submitting answers.

## Changes

- `alert1()` uses one literal-text, non-blocking notice when enabled. Technical
  exceptions, SQL, serialized payloads and stack text are logged and replaced by
  a short message. Ordinary validation text is retained. A notice survives an
  immediate `changeurl()` once, bound to its destination. Existing yes/no and
  discard confirmations remain dialogs.
- Shared CSS adds immediate pressed feedback and `touch-action: manipulation`
  to interactive controls. Layout, colours, content and navigation destinations
  are retained.
- `changeurl(url, direction)` keeps full reloads and its existing next-tick and
  1,500 ms navigation safeguards. Successful Back navigation marks its actual
  destination; popup dismissal and cancelled discard do not. Page entry moves
  22 px over 180 ms, reverses for Back and respects reduced motion.
- With motion enabled, popups reuse the existing fast-panel transition timing
  of 1 ms. The baseline CSS used zero duration, so Framework7's `transitionend`
  cleanup never ran: closed photo popups remained attached with `modal-out`.
  This single shared CSS rule preserves the instant appearance and allows the
  existing close callbacks to finish. No custom popup lifecycle was added.
- Scanner, invoice, print, document, PDF, video and weather bundles load on first
  use only on the four form/report pages that previously included them. One
  shared loader queues concurrent calls, preserves arguments/receiver, retains
  later eager global owners and permits retry after a load failure. Calculator
  and type22 engines remain eager because their initialization and synchronous
  return values are needed during rendering.
- Task and checksheet lists have bounded, account/configuration/filter-scoped
  visual snapshots. Fresh callbacks remain authoritative; cached-row taps wait
  for the corresponding fresh row. First pages replace snapshots; pagination
  appends. Failure keeps the saved preview. The legacy tab initializer can clear
  or reassign the list root, so request-time restoration and root-specific tap
  guards are included. An additional restore follows the existing Cordova startup reset of
  `survey_type` from empty to Pending. Queued taps are dropped on context changes.
  A slow-refresh timeout cannot leave fresh rows blocked, and restoring a
  snapshot cancels its previous refresh observer. The phone probe confirmed startup restoration
  before the refreshed response.
- Demo 2.0 also exposed an empty local-task result followed by an undefined
  `group_name_array.length` read. The list renderer now detects an empty or
  malformed result before clearing saved rows. Rendering failures retain the
  full saved preview, keep Back available and block stale actions. A failed
  refresh cancels its observer so partial markup cannot overwrite the snapshot.
  No cause is asserted for the missing local task; task lifecycle/database
  behavior was not changed.

The live form check also found a pre-existing `f7View` initialization error:
`kitchen-sink.js` always calls `addView('.view-right')`, although production pages
have no such element. With `lazyScripts` enabled, core Framework7 app/main-view
initialization remains eager through `js/framework7_app.js`; the unused demo
initializer is not loaded. Android/iOS options are preserved, and a right view
is initialized only if present. This avoids the error and about 40 KB of demo
source per page. With the switch off, the original initializer is retained.
The initializer is installed and was confirmed on the actual Demo 2.0 form:
`mainView` exists and the kitchen-sink script is absent. A subsequent real-touch
probe identified the remaining `TypeError`: Framework7's click router calls
`indexOf` on the null URL of the app's existing `a.back` control without `href`.
The shared initializer now limits Framework7 routing to `a[href]`, leaving
the app's existing onclick/`changeurl` behavior in charge of those Back controls.
Local real-library tests exercise that Back action once, plus reference viewer
open/close, on Android/iOS with/without a right view. The router adjustment is
included in the current installed build; see installation identity below.
The final phone trace confirms task > 16-row checksheet list > existing form >
Back to the same 16-row list, then Back through the task list to Home, with no
new exceptions. Home confirms `ajaxLinks='a[href]'` and all five demo switches on.

### Source bytes deferred at form entry

These are local source bytes, not measured parse-time or transfer savings.

| Page | Deferred bundles | Deferred source bytes |
| --- | ---: | ---: |
| `viewsitedata.html` | 7 | 122,142 |
| `viewsitedata_task.html` | 5 | 101,445 |
| `EF_User_List.html` | 6 | 118,915 |
| `EF_Custom_Reports.html` | 6 | 118,915 |

## Rollout contract

All five switches default **off**, retaining existing behavior if omitted:
`notices`, `press`, `motion`, `lazyScripts`, `savedLists`.

An optional `ui_phase1` boolean or object of actual boolean values can arrive in
an existing successful login response or downloaded per-flow configuration. No
new endpoint or production request was introduced. Login stores the settings
scoped to company/user/server and clears old settings when the field is omitted.
Flow JSON is decoded defensively (at most two encoded string layers). Strings
such as `"false"` do not enable a switch.

`AppPhase1.preview({...})` provides a six-hour, account-scoped session override
for this phone demonstration. `preview(null)` removes it. This is test setup,
not evidence that the backend delivers the new field. Changing script-loading
or cache switches takes full effect on the next page load. Actual backend
configuration and pilot rollout must be agreed and verified before production.

## Phone timing evidence

Measured using bounded normal navigation through existing Home controls and
read-only WebView DevTools traces. No screenshots/recordings, guessed endpoint
arguments, task creation, permission/settings changes or direct database writes.
The agent did not enter credentials. Original phone baseline was collected
before installing this build; later controls used the same APK with flags off.

Route: Home > Remote Site Audit > task list > Back to Home. The task list was
empty. These are **touch-end to first contentful paint**, not populated content,
server refresh completion or animation completion. There is one navigation pair
per cumulative stage; cache/JIT/server variability prevents attributing every
difference to that stage.

| Stage | Task-list first paint (ms) | Back/Home first paint (ms) |
| --- | ---: | ---: |
| Original installed app, separate baseline | 768.8 | 353.0 |
| Same-build control, switches off | 535.1 | 325.3 |
| Notices | 168.2 | 189.8 |
| Notices + press feedback | 195.3 | 157.9 |
| + first-use scripts (no bundles deferred on this route) | 222.7 | 161.9 |
| + motion | 186.3 | 162.8 |
| + saved lists | 214.5 | 161.8 |
| Warm repeat | 162.8 | 142.1 |
| Before startup fix, switches off | 544.2 | 196.7 |
| Before startup fix, all enabled | 202.4 | 131.1 |
| Before startup fix, warm repeat | 168.3 | 177.0 |
| Startup-cache build, first run after login | 432.2 | 194.7 |
| Startup-cache build, warm repeat | 187.4 | 164.1 |

Before the startup fix, task-list touch-end to click was 258.0 ms with switches off
and 8.9–9.8 ms with all switches on. The task list's refreshed empty state was
first observed about 0.77–1.47 s after navigation. Sampling was approximately
100 ms and is not an exact render-completion timestamp. Those runs exposed a late preview. After the final fix, a separate startup
probe observed saved rows with `aria-busy=true` at 163.6 ms and fresh replacement
with `aria-busy` cleared at 617.2 ms. These diagnostic observations are not exact
paint timestamps; the 100 ms sampler can miss brief cache states.

The plan's <=150 ms forward and <=100 ms Back targets are **not met** by these
samples. Home initial login is not measured as a tap route. Site/checksheet and
form routes initially could not be measured because PM records require
out-of-site approval, which was not bypassed. The owner later selected Demo 2.0:

| Additional existing Demo route | Touch-end to FCP | Navigation to FCP |
| --- | ---: | ---: |
| Existing task > checksheet list (16 entries) | 924.9 ms | 117.1 ms |
| Checksheet > safety-declaration form | 310.8 ms | 201.3 ms |

These are single after-change observations; corresponding original form/site
baselines are unavailable. Pre-navigation reads account for much of the task
opening delay. No assertion of a before/after speedup is made for these routes. One low-cost phone and a full test day are unavailable.

An initial final-build readiness helper timed out after 35 seconds. Follow-up
found escaping and nested-action hit-target errors in that temporary helper:
a task-center tap could expand the card rather than open it. No app loading
delay is inferred from that failed wait. A corrected, bounded Demo 2.0 probe
observed three fresh rows at 856 ms after navigation, Back enabled at 882 ms,
and FCP at 172 ms. On a separate warm visit, all three cached rows appeared at
209 ms with `aria-busy=true` before any request completed. These are instrumented
DOM observations, not new touch-to-paint benchmarks. The 35-second delay was
not reproduced; no additional app cache changes were made for it.

Sanitized host evidence: `/private/tmp/mwfm-phase1-baseline.json`,
`/private/tmp/mwfm-phase1-baseline-back.json`,
`/private/tmp/mwfm-phase1-staged-phone.json`, and
`/private/tmp/mwfm-phase1-cache-fixed-phone.json`,
`/private/tmp/mwfm-phase1-final-phone.json`, and
`/private/tmp/mwfm-phase1-cache-probe.json`,
`/private/tmp/mwfm-phase1-demo-form-timing.json`,
`/private/tmp/mwfm-phase1-demo-form-open.json`, and
`/private/tmp/mwfm-phase1-live-popup-check.json`,
`/private/tmp/mwfm-phase1-framework-phone.json`, and
`/private/tmp/mwfm-phase1-final-back-home.json`,
`/private/tmp/mwfm-phase1-readiness-probe.json`, and
`/private/tmp/mwfm-phase1-cache-context-probe.json`.

## Verification

- Required JDK 17 Android command succeeded: `sh ./gradlew
  :EasyFormSE_finance:assembleDebug :EasyFormSE_finance:testDebugUnitTest`.
  **93 Android unit tests; zero failures, errors or skips.**
- **10 JavaScript test files, 18 top-level tests, all passed.** Existing navigation,
  logout/sync, request failures, trip entry, photo progress, reliability and LMS
  tests are included alongside the Phase 1 tests.
- Local Chromium fixture uses synthetic data and blocks external requests. It
  passes cache isolation by account/tab/filter, tab-root reassignment, queued
  fresh-row taps, pagination, corrupt cache handling, failed refresh,
  first-use scanner arguments, document chooser, PDF download, video preview,
  invoice selection, literal notices at 320/390/800 px and reduced motion. Empty,
  malformed and non-array task results do not clear the preview; a partial
  failed render retains the full snapshot and never replays a failed-row tap.
  Actual Framework7 initialization and reference-image viewer open/close also
  pass for Android/iOS with an optional right view.
- Touch fixtures use the actual Framework7 JS/CSS and profile-image viewer
  function, with synthetic images and Android/iOS user agents. Repeated photo
  open/close, menu close/reopen, duplicate panel markup and reduced motion pass.
  The latest installed build also passed the bounded physical-phone menu/photo
  check: six normal taps were observed as touch-end and click events, the viewer
  reopened, both closes removed the photo popup, and the menu closed, reopened
  and closed through its backdrop. Computed popup timing was 1 ms; final Home
  had no popup or stale photo-browser node and no new exceptions.
- Rollout local tests cover typed flags, default-off, account isolation, session
  preview override/expiry and clearing omitted settings. Real server delivery
  is not verified.
- A follow-up source wiring check covered all 24 deferred-script registrations
  across four pages: seven unique bundles and 79 registered entry points. All
  entry points exist and registrations agree between pages. Scanner's shared
  initial state is retained; unregistered print/document/weather helper
  functions have no external references in the form scripts. This is a static wiring check,
  not proof of native hardware or server outcomes. Evidence:
  `/private/tmp/mwfm-phase1-lazy-wiring-audit.json`.
- All seven installations passed a fresh foreground Home/Login, no-popup, idle-call
  gate and a SELECT-only active-trip count of zero. No credentials were entered.
- Five pre-existing fall-alert resources were ignored and missing from fresh
  worktrees. Copied byte-identical resources from main and added narrow ignore
  exceptions, making fresh builds reproducible without native Java changes.
- Previous phone-verified list/Back APK SHA-256:
  `a9139060fe972094e995d5e005c22467f289adeba1149829ed174f198e751af3`.
  This predates the popup timing rule.
- Current installed APK SHA-256:
  `a9efbb9caf84c4344b37c110139d18763292a3175a9c8c5ec195969773bec6d2`.
  All 17 current changed/new application assets match this APK. The required
  Android build/tests, 18 JavaScript tests and expanded browser checks passed.
  Wireless installation succeeded after an initial transfer timeout; the
  installed APK checksum was independently confirmed. Its safety gate found
  foreground Home, no popup, idle calls and zero active trips. Build verification:
  `/private/tmp/mwfm-phase1-popup-build.json`; installation:
  `/private/tmp/mwfm-phase1-popup-wireless-install.json`.
  Final phone check: `/private/tmp/mwfm-phase1-photo-repeat-final.json`.

## Remaining acceptance checks

The owner logged in and final Home/task-list checks passed. On-phone computed
styles confirm `touch-action: manipulation` and 180 ms forward entry. A validation
notice reused one `role=status` node, stayed at y=64–104 in a 986 px viewport,
used `pointer-events:none`, and faded automatically. Demo 2.0's safety-declaration form loaded with 16 checkboxes, 16 radio inputs,
two selects and one textarea in the page. All seven optional bundles were absent
from the loaded scripts, while calculator/type22 engines were present. The
initial reference-viewer probe invoked a DOM handler; it did not establish
that the reference control was visible. The later hit-tested touch check found
all reference images conditionally hidden, so it skipped opening them and did
not change answers to expose them. That check retained 43 total inputs, one
checked item and no pending direction marker, then returned to the 16-row
checksheet list with Back direction. Do not count the earlier programmatic
probe as a visible reference-viewer acceptance test. No task was created or form
submitted by the agent. The agent did not enter credentials.
PM DG was also opened without changing answers; its reference images were
likewise conditional and hidden. An earlier on-phone Home menu/photo test was
inconclusive before disconnection. The real-library touch fixture reproduced
the separate zero-duration popup cleanup issue locally. After wireless
installation, the final observed menu/photo repeat cycle passed on the phone.
An initial helper rejected identical nested WebView accessibility bounds; it
was corrected to require one unambiguous coordinate space and hit-test each
visible matching control. One intermediate reopen wait remained inconclusive;
subsequent capture of actual touch/click events verified reopening and cleanup.
No additional application change was made in response to those helper waits.

Native attendance can create a second WebView. The session-only demo override
must be enabled separately there; production login/flow flags use the shared
account-scoped configuration. The inspection observer accepts `--target` to
identify the intended WebView without assuming a single window.

The list/Back build's real-touch form/Back check passed with no new exceptions. Repeat
reference-viewer testing on a form where its image control is already visible.
The popup timing fix is installed after fresh foreground Home/Login,
no-popup, no-call and no-live-trip gates passed. Its physical menu/photo
open-close-reopen check passed. The profile-photo check does not replace testing
an already-visible reference-image control inside a form.
During the follow-up, Teams was foreground and phone taps were paused. After
returning to MWFM, the current login's module list did not include Demo 2.0.
No access restriction was bypassed or form answers changed to expose controls;
an accessible existing test form is needed for the remaining device checks.
Real scanner/camera/printer hardware, weather, authenticated uploads and full
submission were not exercised by the synthetic tests. Attendance, a complete
trip, offline/online sync, location toggles, a second phone and the no-raw-error
full test day remain owner-run acceptance work. Do not label these as passed.
