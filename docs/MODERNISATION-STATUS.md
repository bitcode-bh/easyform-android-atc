# MWFM modernisation: status

As of 20 Oct 2026, on `main`. Percentages are estimates of the plan's scope, not measurements. "Verified" means checked on the Motorola Edge 70 (Android 17) with the test user.

## By phase

| Phase | Done | State |
|---|---|---|
| 1. Quick wins | ~90% | Notices, press feedback and motion are on by default in the app. Lazy scripts and saved lists stay off. |
| 2. Shell, shared design and components | ~80% | The shell is on by default for every page except Login, with its own history, Back and animation. The shell keeps one top bar and one bottom bar on screen (`js/app_chrome.js`), copied from the page's own bars. Not done: retiring the layered stylesheets. |
| 3. Busy pages | ~92% | Task lists, checksheet lists, Home and the forms run in the shell. Draft restore verified. Memory soak: flat over 240 page switches (a 12-minute preview, stopped early). Not done: the 8-hour soak, low-cost phone timings, the pilot. |
| 4. Remaining pages | ~85% | All pages except Login run in the shell as the original page in a frame. OTP, Aadhar, bank and sign-up pages were removed from the build. |
| 5. One field service, Android 15 target | ~20% | Target SDK held at 29 on purpose: the app is not on Google Play and, from target 30, photo evidence already on shared storage becomes unreadable. Every declared service is started somewhere, so none could be removed safely. Merging services needs a real day of driving. |
| 6. Sync outbox | ~15% | "N waiting to upload" badge from the same counts the pending-status page uses. Not done: the outbox table, the single uploader and server-side repeat protection (needs the server). |
| 7. Typed bridge | ~35% | Named, parameterised reads (`DataQueries`, `DataBridge`, `js/app_bridge.js`) with a contract test. The shell's list adapters use them. About 140 SQL call sites in the pages still use `SqlitePlugin`. See `TYPED-BRIDGE.md`. |
| 8. Smaller app | ~45% | Release APK 93.5 MB, bundle 97 MB (debug APK 123 MB); a phone downloads only its own ABI from a bundle. Stray `www2.zip` removed. Not done: Jitsi/WebRTC (about 22 MB) and the face model (24 MB) as on-demand modules, which need Play delivery testing. |
| 9. Keys and push | ~35% | Legacy FCM server keys removed from the app (the API was shut down in 2024). Release signing details can come from properties. Not done: the service-account key in `AccessToken.java` still signs FCM v1 pushes from the app; removing it needs the server to send those pushes. |

## Timings (shipped build, five runs each, median)

| Move | ms | Target |
|---|---|---|
| Home to FAQ | 27 | 150 |
| Home to Employee list | 89 | 150 |
| Home to LMS | 425 | 150 |
| LMS to Home (Back) | 233 | 100 |
| Employee list to Home (Back) | 158 | 100 |
| FAQ to Home (Back) | 241 | 100 |

Light pages meet the forward target. Home and LMS do not, and Back to Home does not: each visit rebuilds the Home page, which is deliberate, because Home depends on stored module state. Keeping Home alive would make Back instant but would show stale module levels.

## What needs a person or the server

- Camera test of a target-35 build (a person taking a photo).
- 8-hour soak and a low-cost phone.
- A driving day before any change to the tracking services.
- The server team: pushes from the server (then the embedded service-account key can go), repeat-safe batch upload for a full outbox.
- A Play test track before moving Jitsi and the face model to on-demand modules.

## Switches

- `localStorage mwfm_shell_off = '1'`: the shell off on that phone.
- `localStorage mwfm_chrome_off = '1'`: the shared bars off on that phone (pages keep their own bars).
- Server `ui_shell` with `enabled: false` still turns the shell off.
