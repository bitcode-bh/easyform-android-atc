# Phase 2: shared shell foundation

Started 2026-10-18 after the owner's explicit instruction to continue the next
phases. This document records the Phase 2 build. The owner subsequently
authorized continuing Phase 3 source work without waiting for phone access;
see `PHASE-3-PROGRESS.md`. Production page conversion belongs to Phase 3. Work remains on the isolated `codex/phase-1-responsiveness`
worktree, with Phase 1 changes uncommitted. Do not commit, push or update main
without an explicit request.

## Contract

- Keep the 27 current pages, layouts, colours and content. Every production
  route starts in full-reload fallback. No legacy page scripts are injected into
  the persistent document: that would replay their global startup handlers and
  introduce the very state collisions assigned to Phase 3.
- Add `app-shell.html`, loading Cordova, jQuery, Framework7, storage/database
  access and the existing REST client once per shell document. A full-reload
  fallback intentionally leaves that document; it does not pretend to retain
  the single-session performance benefit while legacy pages still own startup.
- Keep interception inside `changeurl()`. Disabled, unknown or unregistered
  pages retain its existing next-tick and navigation retry behavior. A failed
  migrated adapter also falls back to its original HTML page.
- Use an account-scoped optional `ui_shell` setting from the existing successful
  login response / downloaded flow configuration. Require actual booleans for
  `enabled` and each `pages[filename]`; omitted settings disable the shell. No
  new server endpoint or production configuration writes. Flow metadata is
  bound to the account when `list_json` is written; cached metadata from a
  prior login cannot opt in another user. Explicit login `enabled: false`
  overrides flow settings (the explicit QA preview remains a temporary override).
  Backend delivery
  remains unverified until the server team supplies this field.
- Provide an account-scoped, expiring session preview for phone testing. Keep
  every production page switch false for the Phase 2 phone demonstration.
- Registered future adapters have explicit create/reset/open/leave/dispose and
  optional canLeave/capture/restore hooks. Their timers, listeners and callbacks
  are scoped and released on leave; document.ready/deviceready belong only to
  the shell. Store history state in memory, not form answers in new storage.
- Back restores the saved scroll, tab and opt-in filter state. Failed or
  cancelled navigation must not consume history or change the active page.
  Legacy/external destinations must also respect the active leave guard.
- Shared components cover top bar, side menu, bottom tabs, integrated search,
  notices, loading placeholders, empty lists and popups. Reuse Framework7,
  AppLoader, AppPhase1 notices, AppListing, existing icon classes and current
  Home design. Do not replace the current pages' markup in this phase.
- Add one token stylesheet for the existing colour/spacing/type/radius values,
  ATC/Vodafone overrides and explicit opt-in dark mode. Do not automatically
  change the existing light screens or retire their stylesheets (Phase 4).

## Implementation checklist

- [x] Central shell/config/router/lifecycle module and changeurl integration.
- [x] Shell document with one core bootstrap and safe fallback entry.
- [x] Shared component factories and existing-design tokens.
- [x] Account isolation, typed switches and missing-setting clearing on login.
- [x] Local tests of fallback, lifecycle cleanup, navigation cancellation,
  Back restoration, repeated taps, load failure and reduced motion.
- [x] Browser checks using real Framework7 and synthetic local page adapters;
  block all external requests and do not include test adapters in the APK.
- [x] Required Android assembleDebug and all unit tests pass.
- [x] Verify source assets match the built APK. Installation still requires fresh
  Home/Login, no-popup, idle-call and SELECT-only no-live-trip gates.
- [x] Show the shell entering and returning to the unchanged Home through full
  reload fallback on the Motorola. Verify menu/viewer and existing navigation.
- [x] Record actual results and unavailable full-day, second-phone,
  hardware/upload and production backend checks. No acceptance claim without
  evidence; obtain the owner's phase approval before page migration.

## Implementation and evidence

`js/app_shell.js` supplies typed/scoped configuration, one device-ready promise,
the adapter registry, guarded navigation and lifecycle resource scopes.
`changeurl()` retains its existing deferred full-reload path when the shell or
page is disabled or no production adapter exists. `ui_shell` is read only from
existing successful login/flow responses. No server endpoint or server-side
configuration has been changed.

Example optional response field (not sent to production during testing):

```json
{"ui_shell":{"enabled":true,"pages":{},"theme":"default","colorScheme":"light"}}
```

An empty `pages` map keeps every page on fallback. A flow/preview pages map
replaces the previous map rather than merging old page approvals. Even a true
page flag cannot migrate a page until its adapter exists; no production
adapters are registered in Phase 2.

The shell's history is an in-memory Cordova navigation stack (maximum 20
entries); hardware/app Back uses that stack. Its URL is updated with
`replaceState`, without adding extra browser-history entries. Only explicitly
marked filter/tab fields and scroll positions are restored; password/file
inputs are excluded. A different account starts a fresh document so shared
menu/popups and old helper aliases cannot be reused across logins.

Adapters implement `create(document, context)`, `reset(context)`,
`open(context)`, `leave(context)`, `dispose(context)` and optional
`canLeave`, `capture`, `restore`, `onBack`. Use `context.scope` for listeners,
timers, cancellation and guarded asynchronous callbacks. `context.state` is
available during creation/open on Back. Module/reset/open/leave startup has a
15-second limit; failed or retired loads cannot subsequently remount a page.
Confirmations are not subjected to that startup timeout.

Phase 3 adds page-owned service wrappers to `context.services`: use its
`cordova.exec` and `request` constructor rather than the raw global versions.
Native callback arguments, nulls and repeated watcher replies are preserved;
callbacks and new calls are ignored after disposal or an account change.
Pending shared REST requests cancel on leave, including their active retry.
Completed/cancelled requests and fired timeouts release their cleanup entries.
`scope.release(cleanup)` unregisters a deferred cleanup without invoking it.
`AppShell.ready()` still returns the original core services. Native watches
that need a stop action must register their existing stop operation with
`scope.defer`; ignoring late callbacks does not stop a native watcher.

`js/app_components.js` reuses `f7_navbar.html` once for the existing side menu
and shared popups. It does not rebuild or restyle their layout. The other
factories use current Framework7/Home classes, sharp icons, native confirmation,
AppPhase1 notices, AppListing styles and AppLoader's existing drawing.
`css/app_tokens.css` contains existing values and named theme overrides;
`css/app_shell.css` scopes the new page movement and component layout to the
shell. Legacy menu/icon rules use the same literal fallbacks when shell tokens
are absent. Dark mode is explicit opt-in and does not follow the OS by default.

Verified locally:

- 35 JavaScript tests passed, including 17 shell tests. Coverage includes all 27
  production routes remaining fallback even when their flags are true,
  account/preview expiry isolation, failed/cancelled leave guards, released
  timers/listeners/late callbacks, Back restoration, repeated taps, load retry,
  hung startup, account change during unfinished opening, stale flow ownership,
  the login kill switch and guarded legacy/external destinations.
- Actual shell HTML/core and Framework7 passed four browser cases: all-fallback
  and synthetic migrated pages, each with normal/reduced motion at 390/320 px.
  Core scripts and the shared menu load once per shell document. Back restores
  search, bucket and scroll; old component callbacks stop; photo/menu/popups
  close/reopen, including the existing legacy photo Back handler. The latter
  reproduced a cleanup defect: immediate `hide()` suppressed Framework7's
  transition completion. Animated close now lets Framework7 release its viewer;
  the existing no-transition hiding behavior remains. Default dimensions/colours
  remain as before even on a dark OS.
  ATC/Vodafone/dark tokens are checked. All requests were fulfilled locally;
  no external requests or native service calls occurred.
- The existing Phase 1 browser regression suite passed, covering list caches,
  lazy controls, notices, initialization and viewer/menu behavior.
- Required JDK 17 Android build/test command succeeded in 18s. Native code is
  unchanged; Gradle reused its up-to-date 93 clean unit-test results (zero
  failures/errors/skips).
- All 26 changed/new app assets match the APK. New test adapters/fixtures are
  outside the app assets and are not packaged. No production adapter has been
  registered. All 147 dex/native-library/resource/manifest entries are byte
  identical to the preserved Phase 1 APK. `git diff --check` passes.

Built Phase 2 APK SHA-256:
`a3c531924226f797060602b96ad173b9d9169fe4aa9b1a20df944ecda6b6d7b5`.
It was installed by USB on Motorola `ZA223MDVR8` on 2026-10-18, after
foreground Home, idle call/audio, no popup and SELECT-only zero-active-trip
checks. The installed checksum matched this exact APK. An exact host backup is
`/private/tmp/mwfm-phase2-a3c53192.apk`; the earlier Phase 1 backup remains
`/private/tmp/mwfm-phase1-a9efbb9c.apk`.

On the phone, an account-scoped preview with an empty page map entered the
shell and returned to Home. `lastBoot` confirmed ready Cordova, jQuery,
Framework7, storage and REST core, zero registered adapters and `page-disabled`
fallback. The temporary shell preview was then cleared; normal rollout is off.
Normal native taps and hardware Back closed/reopened the photo viewer twice,
closed/reopened the menu, left no stale photo popup and produced no fresh JS
exception. No screenshots, settings changes, direct database writes or form
submissions were used. The phone returned to Home.

Phone evidence: `/private/tmp/mwfm-phase2-usb-install.json`,
`/private/tmp/mwfm-phase2-installed-checksum.json`,
`/private/tmp/mwfm-phase2-menu-photo-usb.json`.

Evidence: `/private/tmp/mwfm-phase2-js.log`,
`/private/tmp/mwfm-phase2-browser.log`,
`/private/tmp/mwfm-phase2-legacy-browser.log`,
`/private/tmp/mwfm-phase2-build.log`,
`/private/tmp/mwfm-phase2-build-verification.json`.

Reproduction:

```sh
node --test EasyFormSE_finance/assets/www2/tests/*.test.cjs EasyFormSE_finance/assets/www2/LMS/tests/*.test.cjs tools/ui_phase2/*.test.cjs
NODE_PATH=/Users/anupsharma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules CHROME_BIN='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node tools/ui_phase2/local-check.cjs
```

Phone shell entry and menu/viewer checks passed. The full field checklist,
a second device, full-day testing and actual backend flag delivery remain
unverified. Do not infer
production performance targets or Phase 2 acceptance from synthetic adapters.

## Phone rules retained

Motorola `ZA223MDVR8`; current wireless endpoint was `192.168.1.14:37043`.
Rediscover rather than assuming the endpoint remains valid. No screenshots,
recordings, permission grants, settings changes or direct database writes.
The owner now authorizes agent login using supplied or app-filled credentials;
never guess or print credentials. Do not interrupt another foreground app.
Do not create tasks, submit forms or manufacture server arguments for testing.
