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

3. **Top priority open bug:** LMS listings and dashboard **do not reliably refresh** when content is
   assigned/removed or when a different user logs in. Commit `56c957c` added partial mitigations;
   **device verification still fails** — see [Open bugs](#open-bugs-prioritized).

4. **Before patching again:** trace the four listing APIs over CDP/network (see investigation
   checklist). Do not add more cache layers until you know whether the API response or the apply
   callback is wrong.

5. **Build & deploy** from this worktree (see [Build & device](#build--device)).

6. **Optional:** if a local `CLAUDE.md` exists in this worktree, it has longer session history and
   Mac-specific notes (gitignored).

---

## What this branch is

`claude/lms-ui-improvements-fd66a5` — LMS module + Home screen UI/UX on top of user's branch
`bitcode.bh/lms-ui-improvements` (base `b60360d`). **Not merged back** to user's branch yet.

Package on device (test build): `com.easyform.atctesting` (UAT `mwfm-uat.altiusinfra.com`).

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
| Login / localStorage wipe | `EFSE_Js/login.js` → `clear_localStorage()`, `finalize_login_lms_storage()` |
| Logout cache wipe | `EFSE_Js/common-functions.js` → `lms_clear_vapt_cache()` |
| Home role switch | `EFSE_Js/selection.js` → `redirect_on_module_click()` updates `storage.role_id` |
| Home → LMS nav | `LMS_Dashboard.html` tab-5 → `crossToLMS('selection.html')`; Home opens LMS via `changeurl('LMS_Dashboard.html')` (full page reload) |

### Script load order (`LMS_Dashboard.html`)

`lms_state.js` → `lms_data.js` → `safety_modules.js` → `assessments.js` → `dashboard.js` →
`ml_video_cache.js` → `micro_learning.js` → **`LMS_Misc.js` last** (owns `$(document).ready` init).

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

### Listing guard flags

- `safety_module_listing_requested` / `assessment_listing_requested` — block duplicate fetches unless
  `force_refresh=true` resets them.

---

## Commit `56c957c` — partial refresh fix (still open on device)

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

**User report after deploy:** still not fixed — treat as open.

---

## Open bugs (prioritized)

### 1. Listings / dashboard do not refresh (BLOCKER)

**Symptoms:** New or removed modules, assessments, micro-learning not appearing; old cards remain;
dashboard KPI counts wrong after user switch or admin assignment; pull-to-refresh and Home→LMS don't
help reliably.

**Investigation checklist (do this before more code):**

1. **CDP network tab** on `LMS_Dashboard.html` — do the four APIs return updated JSON when you
   reproduce? If API is stale, this is server/role assignment, not client cache.
2. **Log apply callbacks** — does `apply_safety_modules(txt, isRefresh)` run with `source === 'network'`?
   Add temporary `console.log` in the LmsData onData callback if needed.
3. **`Role_Id` param** — `Runtime.evaluate`: `lms_get_active_role_id()` vs what admin assigned under.
4. **Inflight race** — `document.ready` and `tab:show` both call `get_safety_module_listing(true)` on
   first open; verify second call isn't swallowed (force should clear inflight — confirm on device).
5. **Micro Learning** — no LmsData; if stale, check `get_micro_learning_videos` response and
   `ml_catalog_ml_ids` / reel re-render in `micro_learning.js`.
6. **Dashboard KPIs** — distinguish server (`dashboard_kpi_data` from `LMS_Select_Dashboard`) vs local
   (`lms_watch_seconds_*`, completion logs). Clear local keys in repro to see if KPIs fix without API
   change.

### 2. Module card vs lesson watch-time mismatch (open since `5393a69`)

Module card shows wall-clock total (`lms_get_module_watched_seconds`); lesson row shows playhead
(`video_progress_<Skill_Id>`). Module 19 example: card `00:50`, lessons `00:00` — lesson tracker may
not be writing for that module's skill IDs. Investigate `set_progress_local()` before assuming one
metric should mirror the other.

### 3. Other deferred

- Video-playback sticky player on-device verify (`827ca85`)
- Wire assessment/skill/ML submits through offline queue (only video log queued today)
- Security manifest hardening (`usesCleartextTraffic`)
- Port biometric login from sibling branch
- Sync branch to `bitcode.bh/lms-ui-improvements` when stable

---

## Progress (commits, newest first)

| Commit | Summary |
|---|---|
| `56c957c` | **Partial** listing/dashboard refresh: user-scoped LmsData keys, login/logout LMS guards, fixed dashboard ptr handlers, force API on LMS open/tab switch. **Open on device.** |
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
5. **Uncommitted test-only** (do not ship): `applicationId com.easyform.atctesting`, MainActivity root
   bypass, `gradlew` JDK17 patch — see local `CLAUDE.md` if present.

---

## Server / environment notes

- UAT: `https://mwfm-uat.altiusinfra.com/` — LMS API base set in `LMS_Dashboard.html` when
  `global_wcf_url` contains `dev.easyform.in` vs UAT host.
- Prod unregistered IMEI → `status:2` empty module list (not a client bug).
- `clear_localStorage()` runs on every successful login and wipes jStorage + localStorage then
  re-seeds session keys.

---

*Last updated: 2026-08-10 — after commit `56c957c` (listing refresh partial, still open on device).*
