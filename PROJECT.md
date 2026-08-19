# EasyFormSE_finance — LMS / Home UI (agent handoff)

**Read this file first.** It is git-tracked and is the canonical catch-up doc for any new
session/agent picking up LMS work.

---

## New agent — start here

1. **Work only in this worktree and branch:**
   - Path: `.claude/worktrees/lms-ui-improvements-fd66a5`
   - Branch: `claude/lms-ui-improvements-fd66a5`
   - Do **not** use the main repo root (`easyform-android-atc` on `master`) or sibling worktree
     `new-session-a876a2` (`lms-ui-improvements`) — that line diverged and is missing fixes here.
   - **Exception, `5dc33ed` (2026-08-19):** small Assessments-listing/quiz-text LMS change made
     directly in `docs-review-67681f` (`claude/support-info-popup-92b681`) instead, at explicit
     owner instruction after being asked to confirm. Not a precedent — still route LMS work here
     by default; only deviate on an explicit, in-the-moment owner call like this one.

2. **UI scope:** `EasyFormSE_finance/assets/www2/` — Cordova WebView app (Framework7 9 + jQuery).

3. **⛔ This branch cannot be released as-is.** Commit `1334d16` committed the TEST-ONLY security
   bypasses: four disabled root/anti-tamper checks in `MainActivity.java` plus a UAT/debug build
   config. See [Release blockers](#release-blockers-must-fix-before-any-production-build). Older
   notes claiming these are "uncommitted" are wrong.

4. **Role Ids: never send a single role to a listing API.** `*_RoleWise` endpoints take the
   comma-separated `role_id_array` and return the union. Use `lms_get_listing_role_ids()`, never
   `lms_get_active_role_id()`, for an API `Role_Id`. Sending one role empties the whole LMS for
   multi-role users; this has already been broken once (`56c957c`) and fixed (`c9a83b8`).

5. **Never fabricate a value to fill a gap.** Unknown must stay unknown — no estimates, no
   placeholder scores, no deriving a resume position from a percentage. Two real bugs came from
   exactly that (`e3e9aa4`, and the reverted seed logic described in `LMS_API_SPEC.md`).

6. **Build & deploy** from this worktree (see [Build & device](#build--device)).

6a. **⛔ Backend URL rule (owner, settled 2026-08-15) — do not re-derive it:**
   **"build uat" → `mwfm-uat.altiusinfra.com`. "build prod" → `mwfm.altiusinfra.com`.**
   `OCR` is the one exception in both cases and always stays
   `atcmwfm.americantower.com/Azure-OCR/api/`. Paths never change, only the host.
   Never point the other URLs at `atcmwfm.americantower.com` — `main`'s *committed* `build.gradle`
   still has americantower everywhere, so a plain checkout does **not** satisfy this; swap the hosts
   after checkout. `main` being stale is not evidence against the rule.
   Also: `versionName` must be >= `ATC_19.6.37_F7_V1.11.2` or the backend rejects the app
   ("Please upgrade your Application!!!"), and account/flow coverage differs per host — ask the
   owner which account to test with. Full detail in `docs/BUILD-AND-DEPLOY.md`.

7. **Never send a raw APK file or share a debug build without a distribution channel** — Chat/Gmail
   auto-remove it as malware, and tap-installing it gets blocked by Play Protect. Use
   [Distributing QA builds](#distributing-qa-builds-2026-08-11) (Firebase App Distribution). This is
   not a bug to fix client-side — the permission audit in that section confirmed the app's real
   permission set is inherent to genuine features.

8. **Optional:** if a local `CLAUDE.md` exists in this worktree, it has longer session history and
   Mac-specific notes (gitignored).

---

## A second, unrelated feature also lives in this worktree: Universal Trip & Site Map

Everything above this line is about **LMS/Home UI** — the hard rule that all LMS work must start
from this worktree still applies. Separately, this worktree also carries the **Universal Trip &
Site Map** module (`trip/mapui/` Java package, `EFSE_Js/trip_map/` JS package — a read-only site
map reachable from the Home screen's bottom bar). It does not touch LMS code and the two features
are independent; nothing above changes for it. **This feature has also been ported to the real
production worktree** (`/Volumes/Bitcode/GitHub/easyform-android-atc`, `bitcode.bh/lms-ui-improvements`,
`com.easyform.atcpv`) — build/deploy steps for **both** the production and UAT targets, including
the machine-specific gotchas (JDK17, `local.properties`, the `atcmwfm.americantower.com` vs.
`altiusinfra.com` URL trap), are in
**[`docs/BUILD-AND-DEPLOY.md`](docs/BUILD-AND-DEPLOY.md)**. Product spec:
[`docs/PRD-Trip-Site-Map-v2.md`](docs/PRD-Trip-Site-Map-v2.md).

**As of `ca152a8` (2026-08-14): `geofence_tracking` is the map's only native data source, for
every profile type.** The earlier `task_master`-first fallback chain (`OfflineTaskReader.java`,
now **deleted**) was unusable in practice — `task_master` fills only once tasks are downloaded and
was repeatedly found empty on real accounts (including this worktree's own CPH2717 test device),
while `geofence_tracking` is populated by its own independent download step and reliably held data.
This also fixed a real cluster-filter bug: rows sourced from either native fallback carry
`clusterId ""` (neither table has a `circle_id` column), which under an `ASSIGNED_CLUSTER` profile
matched nothing and emptied the map — `MapSiteLoader.hasAnyClusterId()` now skips the cluster
filter (not silently applying it to nothing) whenever the payload has no real cluster data at all.

---

## A third feature in this worktree: Home Operations Dashboard (P1)

`EFSE_Js/home_dashboard/` — a configurable widget dashboard on `selection.html`'s Home screen.
Independent of both LMS and Trip & Site Map; nothing above changes for it either. Product spec:
[`docs/PRD-Home-Operations-Dashboard.md`](docs/PRD-Home-Operations-Dashboard.md). Landed `c5e35e1`
(2026-08-14) — **P1 only** (task counts + upload health; see the PRD's phased-delivery table for
P2+).

**Enabled by default** (`HomeDashboardConfig.DEFAULT_ENABLED = true`) — no backend ships
`home_dashboard_enabled` yet, so this local switch is what actually turns the cards on today, same
pattern as `selection.html`'s own `ischart_enabled`.

**Two former "dashboard widgets" are not dashboard widgets** — both were promoted to permanent
navbar/tabbar chrome instead, unconditional and not gated by the feature flag:
- `greeting_header` → the top navbar, beside the avatar (`selection.html`'s own inline script)
- `trip_status` → the bottom tab bar's "Start Trip" action (delegates to the existing
  `noti_Attendance_Click()` / `stop_trip_manualy_from_module_listing()`, zero reimplementation)

The in-dashboard TRIP card and `#noti_Attendance2` ("Your attendance is pending!") were both
removed as a result — Start Trip is the single entry point for that flow now, so both were
duplicate prompts.

**Two real, non-obvious CSS bugs came out of the navbar relocation** (see `c5e35e1`'s commit
message for full detail): `css/home_redesign.css` is **not loaded** by `selection.html` at all
(confirmed: no `<link>` references it anywhere) — writing the new layout there silently did
nothing, and the legacy `#div_dashboard_config` chart-edit controls (dead since `ischart_enabled`
is permanently `'false'`) were rendering at 197px wide, eating 46% of the navbar. Both fixed
directly in `css/home_nav.css`, the file that's actually loaded. **If you touch this navbar again,
verify which stylesheet is actually loaded before trusting a rule exists** — this codebase has
several CSS files written for a page but never wired into its `<head>`.

Data adapters (`home_dashboard_data.js`) deliberately never call the app's own
`get_counter_for_online_flow_profile()` (mutates the shared `profile_flow_Array` global, pops the
app-wide `loading()` spinner) or `pending_status.js`'s functions (hard-coupled to
`pending_status.html`-only DOM ids; one failure branch is an unbounded re-poll loop) — each issues
its own independent query/API call instead.

**P2 (`trip_stats`/`map_entry`/`attendance_chip`) shipped `5314afd` (2026-08-14).**
Full detail in `docs/PRD-Home-Operations-Dashboard.md` §12b. Summary:

- `trip_stats` scopes `track_master` by `date >= lat_plug.min_milli` (no `tid` column exists on
  that table — confirmed against `MySQLiteHelper.java`), mirroring `TrackPathReader.java`'s own
  native query. Km is a Haversine sum over ordered points, skipped above 5,000 points (PRD §11) —
  `km` stays `null` rather than estimated. Sites-visited reads `geofence_user_tracking_detail`
  (`is_send='1'`), not `geofence_tracking` (that table is only the downloaded site catalog, not a
  visit log). Card stays hidden unless a trip is actually active.
- `map_entry` gates on `TripSiteMap.isEnabled()` — the same check the existing hidden
  `#btn_trip_map` tab-bar button already uses — so a role with no map profile gets no card, not an
  empty one. Site count reads `TripMapCache.getSites()` only (no network/native call); OPEN MAP is
  the one action that calls the real `TripSiteMap.open()`.
- `attendance_chip`'s `Get_Attendance` response has no live checked-in/out boolean anywhere in the
  app (checked `AttendanceJson[0].Punchin_Status`/`Punchout_Status` as a possible offline shortcut
  first — they turned out to be static flow-config constants, not live per-day state). "Checked in
  today" is derived the same way the rest of the app already does: a record whose `AssignDate`
  matches today. Tap always delegates to the existing `noti_Attendance_Click()` — the same call the
  Start Trip tab uses — so there's exactly one punch-in implementation. Did not revive the PRD's
  `noti_Attendance1` profile-photo warning (dead/commented code, no live trigger left to port).
- Deliberately **not** added to `HomeDashboardConfig.DEFAULT_PROFILE` (unlike P1's two widgets) —
  per the PRD's own persona table, trip/map/attendance aren't universal (an Auditor has no trips or
  map profile). Marked `IMPLEMENTED: true` so a real `dashboard_profile`/`dashboard_role_map` can
  use them immediately, but invisible today without one — same lifecycle the `IMPLEMENTED`-gate
  comment already anticipated for future widget types.
- Live-verified over CDP against the real running UAT session (role 305, `anup.ce`) — all three
  render/hide correctly; `attendance_chip`'s result confirmed a real `Get_Attendance` network round
  trip against live UAT data. Rebuilt from source, reinstalled, and re-verified against a second
  real logged-in session (role 364, active trip) before committing (`5314afd`).

**P3 (`notifications_summary`/`feature_links`) shipped `46764b8` (2026-08-14) — `approvals_pending`
deferred, not built.** Full detail in `docs/PRD-Home-Operations-Dashboard.md` §12c. Summary:

- `notifications_summary` issues its own independent `Get_NotificationList_For_User` call (same
  endpoint/params `get_user_notifications()` already uses) rather than calling that function
  directly, since that function also force-opens the real `.popup-notifications` panel — a side
  effect a background dashboard render must not trigger. `hasUnread` reads the existing
  `localStorage.new_notification` flag the navbar bell badge already uses. Tap delegates to the real
  `get_user_notifications()` — one notification-panel implementation, not two.
- `feature_links` reuses the real gating flags (`localStorage.getItem('KYFF'|'Chart'|'Tech_Report'|
  'Live_Alarm_Report'|'Scoreboard')`, exact `'True'` literal) and the exact `onclick` behavior copied
  from `selection.html`'s own `#menu_MISC` list — **not** the `menu_KYFF`-style element ids the PRD's
  original catalog table names, which are only DOM ids, not the actual flags. `menu_Attendance` in
  that same block was excluded on purpose: its `onchange` handler is empty (dead legacy toggle), and
  P2's `attendance_chip` already covers real attendance status.
- `approvals_pending` was **not built**. `WCF_Bulk_approval` is a write-only submit endpoint that
  posts whatever's checked in a specific flow's on-screen `#site_list` — there is no server API in
  this codebase that returns a standalone pending-approval count. Building it as spec'd would mean
  fabricating the number it exists to show, against this codebase's own repeatedly-stated
  "never fabricate a value" rule. Needs a real backend endpoint; not in `HomeDashboardConfig
  .IMPLEMENTED`.
- Live-verified over CDP against a real UAT session: real notification data rendered and tap
  correctly opened the actual native panel; `feature_links` confirmed both its real empty state (all
  flags false) and, with flags temporarily forced true, correct rendering of all 5 links — reverted
  cleanly afterward. Confirmed via a from-source rebuild+reinstall before committing.

**P4 (`analytics_strip`) deferred, not started.** Full detail in
`docs/PRD-Home-Operations-Dashboard.md` §12d. A stronger blocker than `approvals_pending`'s missing
endpoint: `analytics_strip`'s data source (`Dashboard_count_new`) can't be independently called at
all — it needs a `dashboard_menu_array[0]` config object (chart type, pivot config, a `counter` tied
to a specific `#menucardid_<n>` DOM element) that only exists after `selection_dashboard.js`'s own
`Select_DashboardMaster` call populates it, and the response can't be correctly interpreted without
that same file's per-card branching logic. More fundamentally, the only path that ever populates
that config — `get_dashboard()` — only runs when `selection.html`'s `ischart_enabled` is `'true'`,
and that's a **hardcoded literal `'false'`** (`var ischart_enabled = 'false'; // will enable it once
finalized`), not a server/role flag. The entire legacy analytics subsystem is switched off for every
account today, by explicit prior developer decision — not something to route around client-side.
Considered a numberless, self-gated "Analytics" entry card (same self-gating pattern P2's
`map_entry`/`trip_stats` use) but decided against it: it wouldn't deliver the widget's actual
purpose, and there's no guarantee the eventual finalized dashboard keeps this same API shape.
Revisit once `ischart_enabled` is actually turned on.

**`site_summary` — new top card, outside the original PRD catalog, by explicit request
(2026-08-14).** Replaces `task_summary` as `HomeDashboardConfig.DEFAULT_PROFILE`'s first widget
(`task_summary` itself is untouched and still `IMPLEMENTED`, just no longer the default — a role can
still get it back via a real `dashboard_profile`/`dashboard_role_map`). Two stats:
- **Total Sites** — `count(distinct place_id)` from `geofence_tracking` (the downloaded site
  catalog). That table has no `username`/`user_id` column at all; safe to read unscoped because
  `delete_database`'s `'nck'` action (called from `login.js` on user switch) unconditionally wipes
  it, so it can never hold another user's rows — confirmed by reading that Java file directly, not
  assumed.
- **Visited Today** — reuses the exact `geofence_user_tracking_detail` / `is_send='1'`
  confirmed-dwell query P2's `trip_stats` already established, additionally scoped by `user_id`
  (independent of whether a trip is active, unlike `trip_stats`'s version).
- Tap delegates to `TripSiteMap.open()` when available; a no-op otherwise (that function already
  guards on its own profile resolution), so the card needs no `isEnabled()` gate of its own.
- Live-verified over CDP (both tables genuinely empty on the test device/account — confirmed via a
  direct SQL count, not assumed from the UI) and confirmed on a from-source rebuild+reinstall before
  committing.

---

## A fourth area touched in this worktree: Stop Trip reliability + recording indicator

Unlike the three features above, this is **not** new dashboard/map surface — it's a small,
deliberately narrow change to the actual trip engine (`AutoTripStopService.java`, on this worktree's
own "engine sacred" blocklist) plus a Home-tab UI indicator. First commit in this worktree to touch
a blocklisted engine file; done only after explicit user direction on scope, not a dashboard-driven
change (the pre-commit hook doesn't fire here since this commit touches no `home_dashboard`/
`trip_map` paths).

**What changed, and — just as importantly — what didn't:**
- **Recording indicator**: a small blinking red dot on the bottom tab bar's Start Trip icon
  (`.trip-recording-dot` in `css/home_nav.css`), shown only while `trip_status === '0'` — the same
  read-only signal `refreshHomeTripTab()` already used for the "On Trip" label/active state. Pure
  UI, no engine involvement.
- **Stop-trip confirmation popup**: `homeTabbarTripClick()` (`selection.html`) now shows an
  `myApp.confirm(...)` dialog before stopping — on confirm it calls the existing, **completely
  unmodified** `stop_trip_manualy_from_module_listing()` (with a safe fallback to the old
  immediate-stop behavior if `myApp.confirm` is unavailable).
- **`ISExitGeofence` finally wired in** (`AutoTripStopService.java`): this flag was already being
  set by `GeofenceTrasitionServicenew.java` (device exits the 200m start-point geofence a
  late-starting trip gets via `TripMapUi.startgeofence()`) and already being read+reset in
  `AutoTripStopService`'s stop-decision block — but never actually consulted. It's now a real
  **alternate** trigger alongside the existing duration check
  (`isTripFinished_hourbase(...) || ISExitGeofence`), not a replacement for it. `stopTrip()`'s own
  DB-write logic is untouched.
- **Explicitly did not** try to unify the three separate stop-trip code paths that exist in this
  codebase (`start_stop_trip()` via `TripPlugin`, `stop_trip_manualy_from_module_listing()`'s direct
  SQL, and `AutoTripStopService.stopTrip()`'s own native writes) — confirmed via research that a
  native background service has no bridge to WebView JS anywhere in this codebase (so routing the
  automatic path through the JS function would trade reliability for code-sharing, exactly backwards
  for a safety-tracking feature), and separately learned from the user that the Home button's
  lightweight path is intentionally kept apart from the full `TripPlugin`→`TripMapUi` flow (avoids
  navigating the user into the module listing). Keep it that way — do not attempt to merge these
  three implementations without asking again.
- Verified: blinking dot and confirm popup both live-verified via CDP on a real active trip (role
  `anup.vt`) with zero disruption — the confirm test used a no-op callback specifically so there was
  no chance of actually ending the real trip. `ISExitGeofence` compiles cleanly but could not be
  end-to-end field-tested in-session (needs a real geofence exit or duration timeout) — worth
  watching in real usage.
- The reinstall needed to test the native change did interrupt the real active trip that happened to
  be running at the time (`trip_status` reset, its pending upload cleared) — done only after the user
  explicitly confirmed it was fine to proceed anyway.

---

## What this branch is

`claude/lms-ui-improvements-fd66a5` — LMS module + Home screen UI/UX on top of user's branch
`bitcode.bh/lms-ui-improvements` (base `b60360d`). **Not merged back** to user's branch yet.

Package on device (test build): `com.easyform.atctesting` (UAT `mwfm-uat.altiusinfra.com`).

---

## Release blockers (must fix before any production build)

**✅ The four root/anti-tamper bypasses are GONE (2026-08-15).** `MainActivity.java`'s four
`if (false)` markers have been replaced with the real calls. **The CPH2717 is not rooted**
(`release-keys`, `verifiedbootstate=green`, locked bootloader, no `su`), the real checks pass on it,
and a prod-configured build was verified running there. **Do not reintroduce a bypass, and do not
claim device testing requires one** — that stale claim survived in this file for days and repeatedly
led agents to propose reverting correct production config.

Remaining items before a real signed release:

| Item | Current | Production |
|---|---|---|
| `build.gradle` signing | falls back to `easyform-debug.jks` | real release keystore (**secret — ask the owner**) |
| `AndroidManifest.xml` | `usesCleartextTraffic="true"` | `false` (all URLs are https) |
| `res/xml/network_security_config.xml` | trusts user CAs, **unreferenced/dead** | delete |

`build.gradle`'s `applicationId` and URLs are **not** blockers — they are the per-env switch, set per
the URL rule in `docs/BUILD-AND-DEPLOY.md` ("build uat" → `mwfm-uat.altiusinfra.com`, "build prod" →
`mwfm.altiusinfra.com`, OCR always americantower).

**Still worth doing** — `buildTypes` already define `isCheckRoot` / `isCheckDebug` build config
fields per build type, and nothing uses them for this. Gating the checks on build type would make a
release safe by construction rather than by checklist.

> Note: `CheckAuthOfApplication.isCheckRoot()` / `isCheckDebug()` are **native** (`cpp/native-lib.cpp`)
> and hardcoded to `true` / `false` — they are NOT wired to the Gradle `buildConfigField` of the same
> name. That mismatch is why a crude `if (false)` was used in the first place.

**Separate from the four bypasses above — a real bug, fixed `f1f1c8d` (2026-08-14):**
`MainActivity.java:125` calls `MeatGrinder.isRooted(this)` completely unconditionally (its own
alert-and-exit side effect, not gated by any of the four `if (false)` markers, so it ran on every
build variant including this one). It showed a blocking "This device is rooted" dialog on the
CPH2717 test device **after it was genuinely, verifiably unrooted** (`release-keys`,
`verifiedbootstate=green`, locked bootloader, no `su` binary anywhere — confirmed live). Root
cause: `isFoundDangerousProps()`/`isDetectedTestKeys()`/`isDetectedDevKeys()` in `native-lib.cpp`
treated a system property this app's process **can't read** (SELinux `untrusted_app` sandboxing,
common on modern Android) the same as one that's genuinely present with a bad value. Fixed at the
three call sites that had `isObligatoryProperty=true`; an actual value match still correctly flags
a real rooted device. **This fix is real production behavior, not a test bypass** — it was also
ported to `main` (`bitcode.bh/lms-ui-improvements`) since a genuinely clean user could hit the same
false positive in `com.easyform.atcpv` today. It does not reduce or replace the four bypasses
above, which are still fully in place and still block a real release.

### Manifest permission audit (2026-08-11, `8107b33`)

Investigated after real-device Play Protect blocks (see "Distributing QA builds" below) — for each
permission that looked like it could be part of the risk cluster, confirmed whether live code
actually uses it before touching anything.

| Permission | Status | Used by |
|---|---|---|
| `READ_PRIVILEGED_PHONE_STATE` | **Removed (`8107b33`)** | Nothing — signature/system-only permission a third-party app can never be granted; zero code references |
| `SEND_SMS` | **Kept — genuinely used** | Fall-detection SOS alert (`FallAlertActivity`), trip/driving safety (`TripMapUi`) |
| `SYSTEM_ALERT_WINDOW` | **Kept — genuinely used** | `FloatingBubbleService` (trip-tracking floating bubble) |
| `REQUEST_INSTALL_PACKAGES` | **Kept — genuinely used** | In-app self-update (`AppDownloadActivity`) |
| `RECEIVE_BOOT_COMPLETED` + `BootReceiver` | **Kept — genuinely used** | Redraws geofences on reboot |
| `ACCESS_BACKGROUND_LOCATION` | **Kept — genuinely used** | Field-worker tracking (`TripMapUi`, `MainActivity`, `ph_s`) |

**Conclusion: this app's real permission cluster (SMS + overlay + install-packages + boot receiver +
background location) is inherent to its actual safety/tracking features, not vestigial.** There is
no client-side permission trim that makes this "Play Protect safe" without removing a real feature —
see "Distributing QA builds" below for what actually unblocks installs instead.

---

## Build & device

```bash
cd .claude/worktrees/lms-ui-improvements-fd66a5
./gradlew :EasyFormSE_finance:assembleDebug
# APK: EasyFormSE_finance/build/outputs/apk/debug/EasyFormSE_finance-debug.apk

adb install -r EasyFormSE_finance/build/outputs/apk/debug/EasyFormSE_finance-debug.apk
adb shell am start -n com.easyform.atctesting/com.sky.atc.easyformse.MainActivity
```

- **Test device:** Oppo CPH2717 — **not rooted**; the real root/anti-tamper checks pass on it.
- **Wireless ADB:** `adb tcpip 5555` then `adb connect <device-ip>:5555` (used at `192.168.1.5:5555`).
- **Login is manual** — never auto-enter credentials. Reinstall sends user back to login.
- **CDP:** `adb forward tcp:9222 localabstract:chrome_devtools_remote` → inspect
  `LMS_Dashboard.html` / `selection.html` WebViews.

---

## Distributing QA builds (2026-08-11)

**Do not send the raw `.apk` file directly** (Chat/Gmail attachment) — Google's scanner treats an
unpublished, debug-signed APK with this app's permission set (see the manifest audit above) as
malware and silently removes it on upload. Separately, tap-installing that same file on a phone
gets blocked by **Play Protect's live scan** (confirmed via logcat: `com.android.vending`'s
`PackageVerificationReceiver` fires and blocks the install) — neither is a bug in this branch, both
are Google's reputation system reacting to a genuinely unpublished package + real permission cluster.
Reducing the manifest further isn't the fix (see above); **the fix is the distribution channel.**

**Use Firebase App Distribution instead** — testers install through Google's own trusted pipeline,
which sidesteps both problems:

- Firebase project: **`bitcode-mwfm`** (owner: `bitcode.bh@gmail.com`) — a fresh project made for
  this purpose, separate from the app's existing Crashlytics/push project (`wipro-86aed`, whose
  `google-services.json` is what's checked into the repo; `bitcode.bh@gmail.com` does not have
  access to that org's project, hence the new one).
- Registered app: `com.easyform.atctesting` → App ID `1:188691984700:android:3db2ac1f17f48a069fae39`
- CLI: `npm install -g firebase-tools`, then `firebase login` (interactive browser auth — cannot be
  scripted, has to be done by whoever owns the distributing account).

```bash
# One-time: add a tester
firebase appdistribution:testers:add someone@example.com --project bitcode-mwfm

# Upload + distribute (re-running with an unchanged APK just grants access
# to new testers without re-uploading — safe to re-run after adding testers)
firebase appdistribution:distribute \
  EasyFormSE_finance/build/outputs/apk/debug/EasyFormSE_finance-debug.apk \
  --app "1:188691984700:android:3db2ac1f17f48a069fae39" \
  --testers "email1@x.com,email2@x.com" \
  --release-notes "..." \
  --project bitcode-mwfm
```

**Current testers:** `bitcode.bh@gmail.com`, `rahul.sharma@skyproductivity.com`,
`mukesh.m@skyproductivity.com`, `jayanti.suthar@skyproductivity.com`, `aakash@skyproductivity.com`.

**What this does and doesn't fix:** solves the sharing block completely, and likely reduces the
Play Protect warning (install goes through the Firebase App Tester app instead of a bare file tap).
**Does not remove the underlying cause** — still debug-signed, security checks still off, still an
unpublished package. A tester may still see a Play Protect warning; the actual fix for that is the
release-build conversion in "Release blockers" above, which needs the real release keystore this Mac
doesn't have.

---

## LMS file map (where to look)

| Area | Files |
|---|---|
| Entry HTML | `LMS_Dashboard.html`, `selection.html` |
| Modules listing + lessons | `LMS/safety_modules.js`, `LMS/safety_modules.css` |
| Assessments | `LMS/assessments.js`, `LMS/assessments.css` |
| Dashboard KPIs + charts | `LMS/dashboard.js`, `LMS/dashboard.css` |
| Micro Learning reels | `LMS/micro_learning.js`, `LMS/micro learning.css` |
| Shared helpers, tabs, watch-time | `LMS/LMS_Misc.js`, `LMS/LMS_Misc.css` |
| Cache-first API layer | `LMS/lms_data.js` (`LmsData`) |
| Offline write queue | `LMS/lms_state.js` (`LMS_State`) — only video log wired |
| **Server-progress seam** | `LMS/lms_backend.js` (`LmsBackend`) — see below |
| Login / localStorage wipe | `EFSE_Js/login.js` → `clear_localStorage()`, `finalize_login_lms_storage()` |
| Logout cache wipe | `EFSE_Js/common-functions.js` → `lms_clear_vapt_cache()` |
| Home role switch | `EFSE_Js/selection.js` → `redirect_on_module_click()` updates `storage.role_id` |
| Home → LMS nav | `LMS_Dashboard.html` tab-5 → `crossToLMS('selection.html')`; Home opens LMS via `changeurl('LMS_Dashboard.html')` (full page reload) |

### Script load order (`LMS_Dashboard.html`)

`lms_state.js` → `lms_data.js` → **`lms_backend.js`** → `safety_modules.js` → `assessments.js` →
`dashboard.js` → `ml_video_cache.js` → `micro_learning.js` → **`LMS_Misc.js` last**
(owns `$(document).ready` init). `lms_backend.js` must load before any consumer.

---

## LMS architecture (data flow)

### APIs (all under `global_wcf_url_lms`, set in `LMS_Dashboard.html`)

| Purpose | Endpoint | Caller |
|---|---|---|
| Module cards | `LMS_Select_Module_RoleWise` | `get_safety_module_listing()` |
| Module lessons | `LMS_Select_Skill_Master_RoleWise` | `get_target_skill_by_module_id()` |
| Assessments | `LMS_Select_Assessments_Master_RoleWise` | `get_assessments_listing()` |
| Micro Learning catalog | `LMS_Select_Micro_Learning_Master_RoleWise` | `get_micro_learning_videos()` |
| ML user activity | `LMS_Select_Micro_Learning_User_Activity` | `get_user_activities()` |
| Dashboard trend data | `LMS_Select_Dashboard` | `get_dashboard_data()` |

### Role identity (common bug source)

- **`storage.role_id`** (jStorage) — **active** role; updated when user switches role on Home
  (`selection.js`).
- **`localStorage.role_id_array`** — set **once at login** (`login.js`); stale after multi-role switch.
- **Always use** `lms_get_active_role_id()` in `LMS_Misc.js` for `Role_Id` API params (falls back to
  `role_id_array`).

### User identity & localStorage

- **`storage.user_id`** — current logged-in user.
- **`lms_owner_user_id`** — written on LMS open / login finalize; mismatch triggers
  `lms_clear_all_local_state()`.
- **Login** (`clear_localStorage` in `login.js`): wipes all `localStorage`, then
  `finalize_login_lms_storage(user_id)` restores LMS watch-time keys **only if same user_id**.
- **Logout** (`lms_clear_vapt_cache`): full LMS wipe via `lms_clear_all_local_state()`.

### LmsData cache (`LMS/lms_data.js`)

- Keys: `lms_cache_v1_<cacheKey>` in localStorage.
- Cache keys (since `56c957c`): **per user** via `lms_listing_cache_key()`:
  - `modules_<userId>_<roleId>`
  - `assessments_<userId>_<roleId>`
  - `dashboard_<userId>`
- `LmsData.fetch(cacheKey, url, params, onData, onError, { force: true })`:
  - Skips cache paint
  - Clears inflight dedup so network always runs
- Wired in: `get_safety_module_listing`, `get_assessments_listing`, `get_dashboard_data`.
- **Not wired:** Micro Learning (`get_micro_learning_videos` always hits network directly).

### Refresh triggers (current code)

| Trigger | What runs |
|---|---|
| LMS `document.ready` | `get_safety_module_listing(true)`, `get_assessments_listing(true)`, `get_dashboard_data(true)`, `get_user_activities()` |
| Tab show tab-1/2/3/4 | Modules/Assessments/Dashboard force refresh; ML calls `get_user_activities()` |
| Dashboard pull-to-refresh (`ptr:refresh` on `#tab-3`) | All listings + `get_dashboard_data(true)` — **was broken** (wrong function names) until `56c957c` |
| Role change (Home) | `lms_reset_listings_if_role_changed()` on tab show |
| `pageshow` (bfcache) | Force refresh listings if `ev.persisted` |
| Lesson submit | `get_safety_module_listing(true)` |

### Local-only metrics (no server field)

Watch time, ML quiz scores, assessment completion trend logs are **client localStorage only**
(`lms_watch_seconds_*`, `lms_ml_quiz_*`, `lms_assessment_completion_log`). Dashboard mixes these with
server listing data — stale local keys can show wrong KPIs even when API lists are correct.

### `LmsBackend` — the server-progress seam (`LMS/lms_backend.js`)

The single place the app asks *"how far has this lesson been watched"*. Built so the backend work in
`LMS_API_SPEC.md` is a drop-in rather than a client rewrite. **It changes nothing today.**

- **Auto-detecting, no flag.** The first skill row carrying a numeric `Watch_Seconds` or
  `Resume_Position` flips that capability on for the session. No constant to edit, no release needed.
- **Ingest:** `get_target_skill_by_module_id()` passes raw server rows to
  `LmsBackend.ingestSkillRows(data)` before rendering.
- **Read:** `lms_get_lesson_elapsed_seconds()` takes `max(server, local)`. The server can lag (a
  session watched since the last upload is only known on-device) but can never be ahead.
- **Reset:** `lms_clear_all_local_state()` calls `LmsBackend.reset()`, so a shared device cannot show
  one learner's server progress to the next.
- **Capability is per-session and never persisted** — pointing the app at a different environment
  cannot leave a stale "supported" flag behind.

**A resume position is never derived from `Progress% × duration`.** That reconstructs a playhead the
learner never reached. If the server does not send `Resume_Position`, the seam reports `null` and the
real local measurement is used. An earlier client-side implementation that did derive it was written
and deliberately reverted — see the "Client status" section of `LMS_API_SPEC.md`.

### Listing guard flags

- `safety_module_listing_requested` / `assessment_listing_requested` — block duplicate fetches unless
  `force_refresh=true` resets them.

---

## Commit `56c957c` — refresh fix (two of its changes were later reverted)

**Intent:** Fix stale modules/assessments/dashboard after user switch, role switch, admin assignment,
and pull-to-refresh.

**Changes:**

| File | What |
|---|---|
| `LMS/lms_data.js` | `opts.force` bypasses cache + inflight dedup |
| `LMS/LMS_Misc.js` | `lms_get_storage_user_id`, `lms_listing_cache_key`, `lms_clear_all_local_state`, `lms_reset_runtime_listings`, `lms_finalize_login_user`, `lms_reset_listings_if_role_changed`, session guard on LMS open |
| `LMS/safety_modules.js` | User-scoped cache key; `force_refresh` through LmsData; prune removed modules on network refresh |
| `LMS/assessments.js` | Same pattern as modules |
| `LMS/dashboard.js` | Fixed `ptr:refresh` handlers; `get_dashboard_data(force_refresh)`; dashboard KPI/chart alignment work |
| `LMS/micro_learning.js` | Uses `lms_get_active_role_id()` for `Role_Id` |
| `EFSE_Js/login.js` | LMS backup only restored for same `user_id`; `finalize_login_lms_storage()` |
| `EFSE_Js/common-functions.js` | Logout calls full `lms_clear_all_local_state()` |

**Outcome:** two of its changes were regressions and were reverted in `c9a83b8` (see below). The
rest stands.

---

## Fixed and verified (do not re-investigate)

### Empty listings for multi-role users — fixed `c9a83b8`

`56c957c` switched every `*_RoleWise` `Role_Id` from `role_id_array` to a single active role, so any
user whose content sits on a different role saw an empty LMS. Proven against UAT for user 41127
(roles `305,375`, content on 305): `Role_Id "375"` → `status 2 No Record Found`;
`Role_Id "305,375"` → `status 1`, 3 modules. Fixed via `lms_get_listing_role_ids()`.

This is very likely the same root cause as the original "assignments don't appear" report — content
assigned under a non-active role could never show. **If that symptom recurs, retest with a real
assignment change before assuming it is a cache bug.**

### Logout destroying watch history — fixed `c9a83b8`

`56c957c` pointed the VAPT logout wipe at `lms_clear_all_local_state()`, deleting watch time, ML quiz
scores and resume positions that have no server copy. Logout now clears cached server content only.
Verified by running the real `lms_clear_vapt_cache()` on-device: watch seconds and
`video_progress_*` preserved, `lms_cache_*` keys 3 → 0.

### Module card vs lesson watch-time mismatch — fixed, verified `c9a83b8` era

Previously "module 19 card `00:50`, lessons `00:00`". Root cause was that a bare native `pause`
(backgrounding, screen lock, native control) had no save path, while the wall-clock tracker did.
Verified end-to-end on device: after playing lesson 22 and closing via the **programmatic** route,
module 19 card and lesson row both read `00:27`, `..._modules_by_item {"19":27.7}` matches
`..._skills_by_item {"22":27.7}`, and lesson 18 correctly stayed `00:00` (no cross-attribution).

### Fabricated assessment score — fixed `e3e9aa4`

Submit logged completion on a 1600ms timer and fell back to a hardcoded `100` when the assessment was
not yet in refreshed data, writing a fake 100% into the dashboard log. Now driven by a real
post-refresh callback, and an unknown score records nothing. 8/8 logic tests.

---

## Working-tree state as of 2026-08-15

Clean — everything from this session is committed on this branch, not yet pushed as of this writing.
Every commit below was built, installed on the CPH2717, and verified live (either by inspecting the
APK's unpacked assets with `unzip`/`grep`/`diff` before install, or by direct on-device interaction —
real IME for the keyboard fix, `aapt dump --values resources` for the URL/build config) rather than
assumed from source.

| Commit | What |
|---|---|
| `bdb3808` | App-wide top bar color match (background **and** text — F7 pairs them) + keyboard-safe bottom bar (hidden while typing, via a `keyboard-open` class on `<html>`, not a manifest change) |
| `5464823` | Safety Passport wired into Home's side menu (`panel-sp` + menu entry) — was never there, all other pages have it |
| `66f08cc` | App-wide accent color swap `#215ba8` → `#2a3086`, sampled from the Altius logo's own pixels — 10 files, pure hex swap, verified line-by-line |
| `d39dbf6` | Login field slimming/centering (root cause was `.item-inner`/`.item-media`, not the input), button radius synced to the fields, Need Help button shrunk + screen-pinned against keyboard drift |
| `7414a01` | Altius brand theme for `Login.html` — faceted background, bordered fields, circular checkbox, solid-blue button |
| `e42fae9` | `build.gradle` prod config (`com.easyform.atcpv`, `mwfm.altiusinfra.com`, OCR on americantower) + `MainActivity.java` real root/anti-tamper checks restored (all four `if (false)` bypasses gone) |
| `4ee4f0d` | `site_summary` loading indicator (red + blinking while the count queries run) and a real pull-to-refresh fix for module card counts |
| `3c7a1a8` | Docs correction — settled the URL rule as a table, deleted the stale "device is rooted" claim |
| `a64b562` | Zero-flow infinite-reload fix in `selection.js` |

**Note on scope:** a full Home dashboard theme (navy palette, faceted background, card restyling) was
explored mid-session and **explicitly reverted at the owner's request** — Home's structure/styling is
otherwise untouched from before this session, aside from the Safety Passport menu fix and the
app-wide accent/navbar/keyboard changes above (which apply everywhere, Home included, but are
color/behavior only, not layout).

**Build gotcha hit and fixed this session:** `JAVA_HOME` pointing at `~/.jdks/jdk-17.0.19+10`
instead of `.../Contents/Home` makes `gradlew` print "JAVA_HOME is set to an invalid directory" **and
still exit 0** — the build silently does not run, and a stale APK gets installed while looking like a
successful rebuild. Always confirm the output APK's mtime moved and re-check its baked-in resources
after a build that matters.

### Resolved: blank Home / no modules loading, and the module counts not updating on pull-to-refresh

Both were live-diagnosed and fixed this session, not left open.

**Blank Home / zero modules — root cause was a stuck incremental-download watermark, not the
`selection.js` fix.** `User_Define_Flow_Master` on the test device held exactly one row: a
soft-deleted (`is_delete=1`) tombstone whose `p_id` pointed at a parent row that had never
downloaded. The structure sync in `DownloadMainStructure.java` is incremental — it sends
`MAX(millisecond)` from the local table and the server returns only newer rows — so the real
top-level flows (older than that tombstone) could never arrive; the sync reported success every
time because it correctly found nothing newer. Fixed by clearing the device's app data (`pm clear`),
which resets the watermark and forces a full re-download. **This is a real device-recovery step,
worth remembering**: if a user reports flows/modules never appearing despite repeated
pull-to-refresh, check whether the local `User_Define_Flow_Master` watermark is stuck ahead of the
server's real data before assuming a server-side assignment problem.

**Pull-to-refresh not updating module counts — real gap, now fixed (`4ee4f0d`).**
`check_table_availabililty()` (the PTR handler's first call) only re-reads the download *counters*;
when they already report `status=2` (complete) it stops at `check_for_notification()` and never
recomputes the module card counts from `task_master`. So PTR could report "done" while the visible
counts stayed frozen at whatever they were on page load, indefinitely. PTR now also calls
`get_data_from_ufm()` — the same entry point `pageload_main()` uses — every pull. Verified live: a
programmatically fired `pullend` moved Total Sites from 4217 → 6604 within 100ms.

---

## Open bugs (prioritized)

### 1. Graded submits are fire-and-forget (data loss)

`LMS_InsertUpdateDelete_{Assessment,Skill,Micro_Learning}_Question_Log_Master` and
`LMS_InsertUpdate_User_Assessment_Rating` are called with **no queue and no retry**. A network drop
during submit permanently loses a completed attempt; the shared `onfail` just shows a message.

**Deliberately not fixed on the client.** The SQLite offline queue exists (`LMS/lms_state.js`) but
routing submits through it is unsafe until the server accepts an `Attempt_Guid` and dedupes replays —
otherwise retries create duplicate attempts and double-counted scores, which is worse. See P0 in
`LMS_API_SPEC.md`. Currently accepted: dev/test only, data loss tolerated at this stage.

### 2. All learner metrics are device-local

Watch time, ML quiz scores and the assessment completion log live only in `localStorage`, so they die
on app-data clear / reinstall / device change, and dashboard KPIs are per-device rather than per-user.
The client seam for this is already built and inert (`LMS/lms_backend.js`) — it needs the server
fields in `LMS_API_SPEC.md` (P1/P2). **Do not work around this locally.**

### 3. Other deferred

- Video-playback sticky player on-device verify (`827ca85`)
- Port biometric login from sibling branch
- Sync branch to `bitcode.bh/lms-ui-improvements` when stable
- Test account `anup.vt` (role 364) has **no LMS content assigned** — confirmed server-side, all
  endpoints return `No Record Found`. Test-data gap, not an app bug.

---

## Progress (commits, newest first)

| Commit | Summary |
|---|---|
| `b0a7ff4` | Assessment quiz review/read-only gate now trusts `log_data.length > 0` (real prior-answers rows, from `LMS_Select_Assessment_Question_Log_Master_ByAssessmentId`) as well as `Progress=="100"` (the separate listing call) — a submitted assessment stayed fully editable, and could be resubmitted, whenever the two disagreed. Reported after a fresh install/re-login; **not fully root-caused** without a live network capture of that exact scenario (needs the owner's login) — if it resurfaces, add on-screen debug output for it rather than guessing further |
| `29cc0c9` | Assessment cards: `.sample-module-progress` was nested inside `.sample-module-card-body` (inheriting its padding) instead of being the card's own flush last child, like Safety Modules' — fixed to match. `.sample-module-image`'s 168px height (sized for Modules' real photos) shortened to 46px for assessments (`#dv_Assessments_List`-scoped), since it was just empty fill under the Tag/Score badges with no image at all |
| `7d6f714` | Micro Learning: removed the "1 Watched / 0s / 14s" reel-tab overlay badge. Reworked `5dc33ed`'s assessment cards per follow-up request: exact same `sample-module-image`/`-tag`/`-score-tag` markup as Safety Modules (not the bespoke flat row `5dc33ed` used), just without `<img>` — `img-ready`/`on-light-bg` added directly since nothing triggers the `<img onload>` that would normally set them |
| `5dc33ed` | LMS: Assessments listing cards no longer show thumbnails (superseded by `7d6f714` — see above); Assessment Quiz description top bar sized up (11.5px → 17px) to match the listing card's own title size (still current) |
| `bc90eee` | Tower-photo backdrop on the permission-request screen (`permission_lay.xml`, `MainActivity`'s launcher entry point) — was plain white + logo, now matches Login's branding |
| `7653ef0` | Login.html: coverage-tower photo backdrop (keyed onto white, not thresholded — see the commit message for why), `--login-bg-size` JS-computed sizing so `background-size:cover` can't rescale/pan when the keyboard's adjustResize shrinks the viewport; fields/buttons sized down to regular weight; eye-icon spacing + keyboard-preserving toggle fix |
| `b1265ef` | Home dashboard: PM Pending / Energy Reading Pending cards replace Total Sites/Visited Today, reading the existing module-badge counter's cache (zero new server calls); fixed `getTaskCounts()`'s WCF_OnlineTaskList_Native_Count call to match the caller that actually works (`system_var`, `cont_[]` summing, `data`/`message` fallback) — blocked server-side, see commit message |
| `3a86775` | Attendance task-create popup now reflects the real trip outcome instead of a native toast that fired before the JS layer knew what would happen next |
| `885ff8f` | Support Info / App Info popovers on Login now close on back button instead of falling through to the exit confirmation |
|---|---|
| `dfdf294` | Real Support Info popup: `format_support_info()` parses the tenant's raw `support_refrences1` server text into structured rows (was an unstyled dump), Altius-navy header with hours inline before the tagline, plain icon rows for IMEI/APK Link, full-width flush-to-bottom popover |
| `bdb3808` | App-wide top bar color match to Home's `#ecedef`/`#0f1729` (background+text together, via `styles_low.css`) + keyboard-safe bottom bar (hides `.toolbar.tabbar`/`#div_new_tabbar` while a keyboard-open class is set, instead of changing `windowSoftInputMode` app-wide) |
| `5464823` | Safety Passport menu entry + `panel-sp` container added to Home's side menu — pre-existing gap, not a regression |
| `66f08cc` | Accent color swap `#215ba8` → `#2a3086` (sampled from the Altius logo) across Home, LMS, and notifications — 10 files, verified pure hex-only diff |
| `d39dbf6` | Login field height/centering fixed at the real cause (`.item-inner`/`.item-media`, not the input), button radius synced to 15px fields, Need Help button shrunk to 44px and screen-pinned so it can't drift with the keyboard |
| `7414a01` | Altius brand theme for `Login.html` — faceted background (blended logo via `mix-blend-mode`), bordered fields, circular checkbox, solid-blue button |
| `e42fae9` | Prod build config (`com.easyform.atcpv`, `mwfm.altiusinfra.com`, OCR on americantower) + real root/anti-tamper checks restored in `MainActivity.java` — verified running on the non-rooted CPH2717 |
| `4ee4f0d` | `site_summary` loading indicator (red/blinking while counts resolve) + pull-to-refresh now recomputes module card counts (previously silently stale after the counters reported "complete") |
| `3c7a1a8` | Docs: settled URL rule as a single table, removed the stale "test device is rooted" claim from `PROJECT.md`/`BUILD-AND-DEPLOY.md` |
| `a64b562` | Zero-flow infinite reload fix in `selection.js` — see the resolved-issues section above for the stuck-download-watermark bug this then uncovered |
| `f61a94a` | `site_summary` — new top card (Total Sites / Visited Today), replaces `task_summary` as the default first widget — see the P4 section above |
| `46764b8` | Home Operations Dashboard P3 — `notifications_summary`, `feature_links` (`approvals_pending` deferred, needs a real backend endpoint — see the P3 section above) |
| `4f6191d` | Finish wiring `ISExitGeofence` into auto trip-stop, Stop Trip confirmation popup, recording indicator dot — see the dedicated section above |
| `5314afd` | Home Operations Dashboard P2 — `trip_stats`, `map_entry`, `attendance_chip` widgets (see the P2 section above and PRD §12b) |
| `93fdff0` | LMS reel/lesson video randomly pausing mid-playback — `tab:show` pausing reels while already on tab-4, Swiper misreading a tap as a swipe, tap-vs-play()-promise races (centralized `ml_safe_pause`), a background refresh destroying the actively-playing `<video>`, and the Safety Module preloader stalling playback on autoplay start |
| `8107b33` | Remove unused `READ_PRIVILEGED_PHONE_STATE` permission — the only manifest permission with zero code references; everything else in the flagged cluster confirmed genuinely load-bearing (see the manifest audit above) |
| `07d22b5` | `LmsBackend` server-progress integration seam (auto-detecting, inert until the backend ships the fields) + real user-facing message in `onfail()` instead of alerting the raw XHR object |
| `0ee7e3c` | `LMS_API_SPEC.md` — prioritised (P0–P3) backend requirements, written from a live audit of the UAT API |
| `e3e9aa4` | Never record a fabricated assessment score (hardcoded `100` fallback + `\|\| 0` coercion both removed) |
| `c9a83b8` | Fix two regressions from `56c957c`: empty listings for multi-role users, and logout wiping all locally-measured progress |
| `56c957c` | Listing/dashboard refresh: user-scoped LmsData keys, login/logout LMS guards, fixed dashboard ptr handlers, force API on LMS open/tab switch. Two of its changes were regressions — see `c9a83b8`. |
| `5393a69` | Quiz frozen header/footer, radio-only options, real lesson scores, video-time race fix, `video_progress_*` preserved across login |
| `827ca85` | Top-bar unification, filter chip redesign, lesson list + quiz overhaul, theme accents |
| `8c0852c` | Opaque sticky header, YouTube-style duration badge |
| `e971fe3` | Filter-chip corner badge |
| `f646bef` | Sticky info-bar on Modules/Assessments |
| `4188207` | Transparent-PNG thumbnail contrast fix |
| `b324491` | Corner-label redesign, adaptive contrast |
| `dac97a7` | Assessments thumbnail, unified info-bar, module card overhaul |
| `222f966` | Per-category Dashboard charts, local watch-time tracking |
| `990c939` | Full-width video player, Dashboard KPI redesign |
| `c6fb3cb` | Search perf, empty/error states, video fixes |
| `56aeb2a` | LmsData cache-first layer + offline write queue |
| `af7edb5` | VAPT logout cache wipe |
| `4ce440d` | Back→Dashboard, tab theme sync |
| `173b982` | Home↔LMS veil transition, cached home list |
| `16dc493` | Align www2 to UAT reference APK |

---

## Working conventions

1. **Verify with CDP before rebuilding** when debugging UI/data issues — reinstall forces re-login.
2. **Fix root cause** — don't stack overrides; grep all rules touching an element first.
3. **Minimize scope** — this branch already has a large `LMS_Misc.js`; don't add parallel abstractions.
4. **Do not merge** sibling `lms-ui-improvements` / APK wholesale — port features deliberately.
5. **Never fabricate a value.** No estimates, placeholder scores, or values derived to fill a gap —
   record nothing rather than something invented. Two shipped bugs came from this.
6. **Never send a single `Role_Id`** to a `*_RoleWise` listing API — use `lms_get_listing_role_ids()`.
7. **If the correct fix needs the backend, don't work around it locally** — add it to
   `LMS_API_SPEC.md` and raise it. A local workaround for a server problem has already had to be
   written and reverted once.
8. **Test-only, do not ship** — the root bypasses and UAT build config are **committed** on this
   branch (not uncommitted, as older notes claimed): see
   [Release blockers](#release-blockers-must-fix-before-any-production-build). The `gradlew` JDK17
   patch is a local, uncommitted Mac workaround.

---

## Server / environment notes

- UAT: `https://mwfm-uat.altiusinfra.com/` — LMS API base set in `LMS_Dashboard.html` when
  `global_wcf_url` contains `dev.easyform.in` vs UAT host.
- Prod unregistered IMEI → `status:2` empty module list (not a client bug).
- `clear_localStorage()` runs on every successful login and wipes jStorage + localStorage then
  re-seeds session keys.

---

*Last updated: 2026-08-19 — after `b0a7ff4`. This session (branch `claude/support-info-popup-92b681`,
worktree `docs-review-67681f` — separate from the LMS worktree rule above, this session's work is
Login/Home dashboard/attendance-trip, not LMS): Support Info back-button fix, attendance task-create
popup, Home dashboard PM/Energy Reading Pending cards, and a full Login screen redesign (tower-photo
backdrop on both Login and the permission-request screen, keyboard-safe background sizing, field/
button sizing) — see Progress table. Note found and corrected mid-session: the Support Info
back-button guard and a TripMapUi.java GPS-permission fix had both been *described* as done in an
earlier compacted summary but were never actually committed to this worktree — re-verify described-
but-uncommitted work against `git log`/`git status` rather than trusting a summary. All five commits
above verified on-device (fresh install); the TripMapUi.java GPS-permission fix from that
investigation was never actually implemented and remains open if trip-start issues resurface.
Previous entry: Last updated 2026-08-14 — after `c5e35e1`. LMS: `93fdff0` fixed the reel/lesson
"video randomly pauses" reports (see Progress table). Trip & Site Map: `ca152a8` switched the map to
`geofence_tracking` as its only native source and fixed a cluster-filter bug that was emptying the
map entirely; `f1f1c8d` fixed a genuine root-detection false positive in `native-lib.cpp` (ported to
`main`/production too, see Release Blockers). Home Operations Dashboard P1 shipped `c5e35e1` — see
its own section above, including two real CSS bugs (wrong stylesheet, `.center` eating 46% of the
navbar) found while wiring the navbar redesign. Remaining LMS work is still backend-dependent
(`LMS_API_SPEC.md`) plus the four release blockers, which are unrelated to and unaffected by any of
this session's fixes.*
