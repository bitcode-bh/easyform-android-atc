# Phase 3 progress

Updated 2026-10-19. **In progress; not accepted as complete.** Work remains on
`codex/phase-1-responsiveness` in the authorized responsiveness worktree.
No commit, push, merge, production switch update or native-engine change was made.

## Implemented in the current source

- Two restricted production adapters now reuse the actual task-list
  (`selection_survey.html`) and checksheet-list
  (`viewsitelist_pm_grouplist.html`) templates, existing styles and icons.
  Controllers load once and receive page services, root-relative DOM access,
  explicit state/actions, guarded callbacks and scoped timers. They release
  requests, listeners, observers and owned popups on leave. Migration adds no
  iframe, runtime compiler, eval sandbox or replay of ready/deviceready handlers.
- The task navigation, offline/online listing, completed and upload controllers
  have explicit factories in their original source files. Their compatibility
  exports preserve legacy-page entry points and existing native/server arguments.
  Generated actions capture typed arguments; a legacy task-header handoff restores
  actual handlers instead of persisting page-instance tokens. Newer selections
  retire older replies, and data timers cannot redraw a different tab.
- Repeated task → checksheet → Back exposed a string/number mismatch in saved
  tab state: pending data returned into the hidden tab. Saved tab values are now
  normalized, and Framework7 tab switching targets the current page's element.
  A separate typed-action conversion error concatenated the named-tab Upload
  index; it now preserves the original numeric addition. Both have regressions.
- Home's module, notification, download and trip actions now have a page-owned
  factory in `selection.js`. Module generations, counts and pending requests are
  independent; location callbacks cannot start requests after disposal. The legacy
  page keeps its current entry points and rendered output. **Home has no shell
  adapter yet**: its hero/dashboard, inline startup and remaining dependencies
  still require lifecycle migration.
- Shared status-label loading keeps the existing endpoint, request parameters,
  labels, colours and messages. It owns cancellation/destination state, ignores
  retired/duplicate replies and preserves startup after malformed status data.
- The shared list component owns a complete row model with bounded DOM rendering,
  variable heights, filtering, selection, pagination, expanded state and printing.
  Supported **ungrouped checksheet lists over 200 rows** use it. Grouped checksheets
  and task lists still use their legacy DOM behavior; containment alone is not
  claimed as model-based windowing.
- Earlier preparation remains: collision renames, explicit counters, native/server
  selection guards, indexed joins and batched rows, idempotent bulk interactions,
  nested-flow comparisons, scoped search, and popup cleanup. Search text does not
  dirty form answers, and read-more does not toggle the task checkbox. Page scopes
  release cancelled timers and ignore events/timers after the owning account changes.

## Current adapter limits

The task adapter currently admits an offline root flow with local mapping and no
subflows. Online listings, searchable or bulk workflows, calendar/automatic-trip/
customer/task-auto-open settings, user-column routing, maps/weather/comments,
shortcut buttons and geofencing retain full reload. The online controller is
prepared, but its page workflows are **not enabled in the shell**.

The checksheet adapter retains full reload for missing mappings, subflows, Jitsi
entry, geofencing, punching/manual trips, column-wise task headers, dynamic
checklist mode and shortcut buttons. These fallbacks are silent and checked before
mount/reset. Supporting a simple flow does not establish full feature coverage.

No production rollout settings were changed. The shell defaults to off. Home and
both form pages (`viewsitedata.html`, `viewsitedata_task.html`) retain full reload.
Existing crash-status/media recovery remains in place.

## Verification

- **160 JavaScript tests pass**: legacy compatibility, independent controller
  instances, module rendering order, native approval arguments, retired replies,
  request/timer/account ownership, named-tab actions, status data and fallbacks.
  Native/server responses in these tests are synthetic.
- The audit parses **102 scripts and 349 legacy exports**, with zero duplicate
  declarations/aliases. Factory aliases are included rather than hidden by wrapping.
- **17 offline/checksheet and 28 online renderer comparisons** against pinned base
  `f6ae3a2` pass. Fixtures include actual nested saved answers; assertions ensure
  visible values, not just identical blank markup. Cases cover ordering, pagination,
  400 rows, actions/media, bulk selection, shortcut buttons, partial failures,
  aggregates and role merging.
- **Seven Home renderer comparisons** against the same base pass: empty/list/card
  layouts, a single Back entry, online badges, language labels and access filtering.
  Markup, counts, routing and native arguments remain equivalent.
- The actual task/checksheet adapters pass **four task-page browser cases** at
  320/390 px with normal/reduced motion. These exercise both current templates and
  controllers: original scoped styles, quoted site names, completed/pending/upload
  switching, cancelled stale replies, Details reopening after Back, popup cleanup,
  legacy upload-status handoff, unsupported fallback, and disabled rollout loading.
  They reject external traffic and unexpected native writes/services.
- **Six checksheet adapter cases** also pass, including two 400-row cases with
  bounded DOM and the final offscreen action. That tool's task predecessor is
  synthetic; the separate task-page tool above supplies the real integration check.
- Four shell/menu/viewer cases and four real form-search cases pass. Earlier shared
  model checks at 320/390/800 px and densities 1/3 covered complete-data filtering,
  selection across 400 rows, offscreen actions, expansion, pagination, printing,
  duplicate IDs, the 200/201 boundary and disposal. These are component checks,
  not an eight-hour application soak.
- The prescribed Android build/unit command succeeds. All **93 unchanged native
  results** are clean; Gradle reuses the unit task because no native source changed.
  All **81 changed/new web assets** match the APK byte for byte. Its 146 DEX/native
  library/manifest entries match the preceding build in this batch.

No current phone timing, eight-hour app soak, low-cost-phone acceptance or pilot
result is claimed.

## Build and deployment

Current APK: `EasyFormSE_finance/build/outputs/apk/debug/EasyFormSE_finance-debug.apk`

SHA-256: `434b5eaa526034fde8cf678d325604c4508d261f44f5eead9a37ca64d324cb07`.
**This build is not installed.** USB and wireless discovery find no phone; the last
paired endpoint times out. Continue source work without waiting for the phone.

The earlier build
`234e6080a395087d20bd82703d79572002987f7810c397cfa42989db4f23358a`
**was installed on Motorola `ZA223MDVR8` on 2026-10-19**, and the installed checksum
was verified. Fresh gates confirmed foreground Home, no popup, idle calls/audio and
zero active trips through SELECT-only checks. The phone disconnected before the
post-install functional check. This supersedes the older installed-build status in
previous versions of this document. It does not include the new task/Home work.

Historical functional phone checks belong to the still older build
`8be9223516017e5788733802b5ff82811c1e58aab07455f825093543215c0d64`.
They do not validate the current source. No screenshots, recordings, settings or
permission changes, submissions, or direct phone-database writes were performed.
Repeat all fresh installation gates before deploying another build.

## Remaining Phase 3 work

1. Finish Home and both form lifecycle adapters, plus complete task/checksheet
   feature coverage. Isolate remaining inline state, helpers, widgets and generated
   actions; release their callbacks, listeners, timers and maps. Keep unmigrated
   branches on explicit legacy fallback.
2. Implement encrypted per-field drafts bound to account, flow, task, checksheet,
   step and schema revision. Cover media, dependencies, arrays, acknowledgement,
   discard and restore. Keep current recovery until parity is verified.
3. Integrate complete-model list APIs into task and grouped-checksheet callers.
   Port filtering, selection, bulk actions, expanded rows and pagination before
   enabling bounded DOM; full-DOM legacy handlers cannot inspect offscreen rows.
4. Run the full simulated eight-hour application workload, measure forward/Back
   on Edge 70 and a low-cost phone, complete the field checklist and a one-week
   pilot. Local renderer/component tests do not satisfy these acceptance gates.

## Reproduction and evidence

```sh
node --test EasyFormSE_finance/assets/www2/tests/*.test.cjs EasyFormSE_finance/assets/www2/LMS/tests/*.test.cjs tools/ui_phase2/*.test.cjs tools/ui_phase3/*.test.cjs
node tools/ui_phase3/audit-globals.cjs
node tools/ui_phase3/task-page-check.cjs
node tools/ui_phase3/checksheet-page-check.cjs
node tools/ui_phase3/home-renderer-check.cjs
node tools/ui_phase3/list-renderer-check.cjs
node tools/ui_phase3/online-list-renderer-check.cjs
node tools/ui_phase3/list-model-check.cjs
```

Browser tools use the existing host Acorn/Playwright runtime and local Chrome,
with `NODE_PATH`/`CHROME_BIN` configured as in the earlier phase checks. No app
package dependency was added. Required Android checks use the prescribed JDK 17
and Gradle tasks.

Current temporary evidence: `/private/tmp/mwfm-phase3-unit-current.log`,
`mwfm-phase3-audit-current.json`, `mwfm-home-renderers.log`,
`mwfm-phase3-task-final.log`, `mwfm-phase3-checksheet-final.log`,
`mwfm-phase3-shell-final.log`, `mwfm-phase3-search-final.log`,
`mwfm-phase3-offline-final.log`, `mwfm-phase3-online-final.log`,
`mwfm-phase3-current-build.log` and `mwfm-phase3-current-verification.json`.
Earlier installation evidence: `mwfm-phase3-adapter-usb-install.json`.
Temporary files may expire; the checked-in host tools reproduce the local checks.
Earlier foundation history is in `PHASE-1-READINESS.md` and
`PHASE-2-IMPLEMENTATION.md`.
