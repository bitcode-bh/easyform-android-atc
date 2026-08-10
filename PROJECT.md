# EasyFormSE_finance — LMS / Home UI branch status

Quick orientation for anyone (or any new Claude Code session/account) picking this branch up. This
file is git-tracked and travels with the repo. For Mac-local build workarounds and a test-only debug
bypass that must never ship, see the gitignored `CLAUDE.md` in this same worktree (local only, not
in git history).

## What this branch is

`claude/lms-ui-improvements-fd66a5` — Cordova/Android app, UI work scoped to the **LMS module and
Home screen**, all in `EasyFormSE_finance/assets/www2/`. Built on top of the user's own branch
`bitcode.bh/lms-ui-improvements` (this branch's base: `b60360d`). Not yet merged back — sync when
ready.

If you're a new session and a local `CLAUDE.md` exists in this worktree, read it first — it has the
full session-by-session history, live-verification workflow, and current in-progress state that this
file only summarizes.

## Progress (newest first)

| Commit | Summary |
|---|---|
| `5393a69` | Quiz frozen header/footer layout (description pinned top, submit pinned bottom, only questions scroll), shared radio-only quiz option design, disabled-until-answered submit button, **real per-lesson scores** (was answered-count not correct-count), genuine "In Progress" lesson status, local-progress capped at 99 so watching alone can't mark Completed, real cached video duration preferred over the often-empty server field, **fixed async pause-event race** in watch-time tracking (item id captured at play-start, not at flush — was misattributing watch seconds to whichever module opened next), `video_progress_<Skill_Id>` keys preserved across login instead of resetting |
| `827ca85` | Top-bar/page bg unification (one literal color, not three near-misses), filter chip redesign (counters → summary line), theme-color accents (selected chip/progress bars now track the live brand color instead of a server-driven site color), lesson list overhaul (time under thumbnail, real "In Progress" state, **fixed lesson scores that were showing answered-count instead of correct-count**), video-playback screen pinned player, quiz restyle shared between lesson video and Assessments (fixed a persistent focus-ring outline that looked like a selection border) |
| `8c0852c` | Opaque rounded sticky header, YouTube-style duration badge |
| `e971fe3` | Filter-chip count → corner badge, dropped sticky header bg fill |
| `f646bef` | Sticky info-bar/filter header on Modules and Assessments, dynamic tag counts |
| `4188207` | Fixed transparent-PNG thumbnails always sampling as black, tightened card spacing |
| `b324491` | Minimal corner-label redesign for Tag/Score/Duration, adaptive per-corner contrast |
| `dac97a7` | Assessments thumbnail fix, unified info-bar, module card overhaul |
| `222f966` | Per-category Dashboard charts, real local watch-time/score tracking |
| `990c939` | Full-width video player, mandatory full-screen quiz, Dashboard KPI/chart redesign |
| `c6fb3cb` | Search perf, empty/error states, video fixes, ML-style quiz modal |
| `56aeb2a` | Cache-first data layer + offline write queue (Phase 1 & 2) |
| `af7edb5` | Wipe offline queue + cached reel videos on logout (VAPT) |
| `4ce440d` | Back-to-Dashboard, tab theme sync, module/lesson list polish |
| `173b982` | Smooth Home↔LMS switch, cached module list, seamless search bar |
| `16dc493` | Aligned LMS/home web assets to the UAT reference build |

Full detail (why, not just what) for each is in the local `CLAUDE.md`'s dedicated sections.

## Pending / next

- **Open bug, not yet fixed:** home module-card watch-time and in-lesson watch-time still don't agree
  (module 19's card showed `00:50` while both its lessons showed `00:00`, even after the `5393a69`
  play-start-attribution fix). These are two architecturally different metrics — card total is
  wall-clock play/pause time (`lms_watch_seconds_modules_by_item`), lesson elapsed is playhead
  position (`video_progress_<Skill_Id>.currentTime`) — so "sync" may need a real design decision, not
  just a bug fix. Live CDP dump for that module: `lms_watch_seconds_modules_by_item["19"] = 50.46`,
  but `video_progress_18 = {currentTime:0}` and no `video_progress_<other skill>` key existed at all —
  suggests the lesson-level tracker isn't writing for this module's skills, not just a display mismatch.
  Investigate `video_progress_` writes for module 19/22's actual skill ids before assuming the two
  metrics were ever meant to match.
- On-device end-to-end verification of `827ca85`'s video-playback screen: confirm the sticky player
  actually stays pinned against the real scroll container (an assumption that was wrong once already
  for the filter header in this same session), and spot-check the Assessments quiz restyle on a fresh
  assessment.
- Wire critical answer-submits (assessment/skill/ML question + rating) through the offline write
  queue — only the video-watch log is queued today.
- Security-manifest hardening: `usesCleartextTraffic="true"` in `AndroidManifest.xml` (all URLs are
  https), and an unreferenced/dead `network_security_config.xml` — not applied, needs a network
  smoke-test since it touches all builds.
- Port biometric login from the sibling branch `lms-ui-improvements` (worktree `new-session-a876a2`).
- Deferred: reel `<video>` memory disposal, session/scroll restore, chunked module rendering.
- Sync this branch onto `bitcode.bh/lms-ui-improvements` once the above is confirmed.

## Working conventions established on this branch

- **Verify UI changes live over CDP before rebuilding.** Reinstalling the debug APK restarts the app
  back to the login screen, and login is manual (never auto-entered) — a wrong guess costs a real
  re-login, not just a rebuild. Attach via `adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>`,
  inject/measure with `Runtime.evaluate`, screenshot + pixel-sample to confirm, only then edit source
  and build.
- **Fix the property causing a visual, don't add a compensating one on top.** This branch had a case
  where three successive patches shifted a "looks separate" symptom around instead of finding the
  `border-radius`/`box-shadow` actually causing it — grep every rule touching an element before
  guessing, and prefer deleting to overriding.
- A sibling worktree, `new-session-a876a2` (branch `lms-ui-improvements`), is a **separate, diverged**
  line of LMS work — do not sync from it or the shipped APK; port specific features deliberately if
  needed (see local `CLAUDE.md` for what was/wasn't already ported).
