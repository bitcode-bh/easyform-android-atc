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

7. **Optional:** if a local `CLAUDE.md` exists in this worktree, it has longer session history and
   Mac-specific notes (gitignored).

---

## What this branch is

`claude/lms-ui-improvements-fd66a5` — LMS module + Home screen UI/UX on top of user's branch
`bitcode.bh/lms-ui-improvements` (base `b60360d`). **Not merged back** to user's branch yet.

Package on device (test build): `com.easyform.atctesting` (UAT `mwfm-uat.altiusinfra.com`).

---

## Release blockers (must fix before any production build)

These are **committed on this branch** (swept in by `1334d16`, a checkpoint commit). A release
built from this branch today ships with device security disabled, under the test package id,
pointed at UAT, signed with a debug key.

| Item | Current (test) | Production |
|---|---|---|
| `MainActivity.java` L114 | `if (false)` — Xposed detection disabled | `MeatGrinder.isFoundXposed()` |
| `MainActivity.java` L119 | `if (false)` — Frida / process scan disabled | `CheckAuthOfApplication.isFridaServer() \|\| checkRunningProcesses(this)` |
| `MainActivity.java` L126 | `if (false)` — root check disabled | `RootUtils.checkRooted()` |
| `MainActivity.java` L297 | `if (false)` — root check disabled | `DeviceUtils.isDeviceRooted() \|\| RootBeer(...).isRooted() \|\| ...isRootedWithoutBusyBoxCheck()` |
| `build.gradle` applicationId | `com.easyform.atctesting` | `com.easyform.atcpv` |
| `build.gradle` URLs | `mwfm-uat.altiusinfra.com` | `atcmwfm.americantower.com` (OCR already prod) |
| `build.gradle` signing | falls back to `easyform-debug.jks` | real release keystore (**secret — ask the owner**) |
| `AndroidManifest.xml` | `usesCleartextTraffic="true"` | `false` (all URLs are https) |
| `res/xml/network_security_config.xml` | trusts user CAs, **unreferenced/dead** | delete |

**The bypasses exist because the test handset (CPH2717) is rooted** — restoring them stops the app
launching there, which ends on-device testing. Do not silently flip them.

**Recommended fix** — the project already has the right mechanism and the bypasses ignored it:
`buildTypes` already define `isCheckRoot` / `isCheckDebug` build config fields per build type. Gate
the restored checks on build type (debug = skip, release = enforce) instead of hardcoding `false`,
and move the URL `resValue`s into a `release` override. Then debug keeps working on the rooted
device and a release build is safe by construction rather than by checklist.

> Note: `CheckAuthOfApplication.isCheckRoot()` / `isCheckDebug()` are **native** (`cpp/native-lib.cpp`)
> and hardcoded to `true` / `false` — they are NOT wired to the Gradle `buildConfigField` of the same
> name. That mismatch is why a crude `if (false)` was used in the first place.

---

## Build & device

```bash
cd .claude/worktrees/lms-ui-improvements-fd66a5
./gradlew :EasyFormSE_finance:assembleDebug
# APK: EasyFormSE_finance/build/outputs/apk/debug/EasyFormSE_finance-debug.apk

adb install -r EasyFormSE_finance/build/outputs/apk/debug/EasyFormSE_finance-debug.apk
adb shell am start -n com.easyform.atctesting/com.sky.atc.easyformse.MainActivity
```

- **Test device:** Oppo CPH2717 (rooted — MainActivity has a TEST-ONLY root bypass, uncommitted).
- **Wireless ADB:** `adb tcpip 5555` then `adb connect <device-ip>:5555` (used at `192.168.1.5:5555`).
- **Login is manual** — never auto-enter credentials. Reinstall sends user back to login.
- **CDP:** `adb forward tcp:9222 localabstract:chrome_devtools_remote` → inspect
  `LMS_Dashboard.html` / `selection.html` WebViews.

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

*Last updated: 2026-08-11 — after `07d22b5`. LMS verified working against UAT test data (3 modules,
2 assessments, 3 reels, no errors); watch-time, role and fabricated-score bugs fixed and verified
on-device. Remaining work is backend-dependent (`LMS_API_SPEC.md`) plus the release blockers above.*
