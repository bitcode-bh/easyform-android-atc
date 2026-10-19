# Phase 1 phone test checklist

Updated 2026-10-18. **Partially executed; see PHASE-1-READINESS.md for evidence.** Keep the existing screen layout, colours
and content. The owner authorized Phase 2 on 2026-10-18 after the Phase 1 demo;
the remaining acceptance items below have not thereby become passed tests.

## Device and install gate

| Item | Motorola Edge 70 | Low-cost phone |
| --- | --- | --- |
| ADB serial | `ZA223MDVR8` | Owner to identify |
| Android / WebView version | Android 17 / API 37; WebView 154 | Not available |
| Existing package/version/signature | Not read | Not read |
| Baseline source/build identity | Not verified | Not verified |
| Foreground MWFM, Home or Login | Passed immediately before seven installs | Not available |
| `localStorage.trip_status` and no live trip | Passed; SELECT active-trip count 0 | Not available |
| No call, open form or popup | Passed before all seven installs | Not available |

Verify these conditions immediately before each install using ADB and read-only
WebView DevTools. Never install over another foreground app or a live workflow.
Do not grant permissions, change settings, write to the phone database, clear
app data, or capture screenshots/recordings. The owner later authorized agent
login; use only owner-supplied or app-filled credentials, without guessing or
printing them. The owner handles settings changes needed for test scenarios.

Forward only the actual running WebView socket:
`adb -s ZA223MDVR8 forward tcp:9333 localabstract:webview_devtools_remote_<pid>`.
Discover the PID/socket first; do not assume a fixed PID.

## Tap-to-drawn measurements

Use the same real navigation path and data context on each run. Record the tap
timestamp, initial paint, populated content paint and end of motion separately;
an early blank page paint is not a populated list/form measurement. Note cold
versus warm state, row count, filter/tab/scroll and whether refreshed data has
arrived. Observe existing requests only; no synthetic production load or guessed
IDs/arguments. Do not inject cache values or seed records on the phone.

Enter measured milliseconds below, with raw event evidence saved separately.
An em dash means unmeasured, not zero. For each cell, record repeated bounded
samples with the sample count and median/range; do not infer results from script
bytes or desktop timings.

| Device | Stage | Home | Task list | Site/checksheet list | Form |
| --- | --- | ---: | ---: | ---: | ---: |
| Edge 70 | Baseline | — | — | — | — |
| Edge 70 | Notices | — | — | — | — |
| Edge 70 | Press feedback/tap handling | — | — | — | — |
| Edge 70 | First-use scripts | — | — | — | — |
| Edge 70 | Directional motion | — | — | — | — |
| Edge 70 | Saved lists/background refresh | — | — | — | — |
| Low-cost | Baseline | — | — | — | — |
| Low-cost | Notices | — | — | — | — |
| Low-cost | Press feedback/tap handling | — | — | — | — |
| Low-cost | First-use scripts | — | — | — | — |
| Low-cost | Directional motion | — | — | — | — |
| Low-cost | Saved lists/background refresh | — | — | — | — |

Routes: `selection.html`, `selection_survey.html`,
`viewsitelist_pm_grouplist.html`, `viewsitedata.html` and
`viewsitedata_task.html`. Include `viewcustomerlist_on.html` when used by the
real workflow. Use existing assigned modules/tasks selected by the owner.

## Functional coverage on each phone

Record Pass / Fail / Not run plus evidence. Owner login and the bounded Home/task
list navigation checks passed. Notices, rollout and first-use controls have local
fixture coverage; Demo 2.0 form loading and real-touch Back passed without edits.
The reference images were conditionally hidden and were skipped by the hit-tested
probe; the earlier direct-handler probe is not visible-control acceptance.
The minimal Framework7 initializer was confirmed on the live form. A separate
Back click exception was traced to Framework7 routing an anchor without href;
the shared initializer correction passes locally and on the final installed
build. The form, Back to 16 checksheets, Back to the task list and Back to Home
raised no new exceptions. All five demo switches were enabled for that trace.
The additional empty-task recovery is locally verified and installed; its forced
failure case was not induced on the phone.
Follow-up Demo 2.0 probes observed fresh rows at 856 ms and a separate warm
cached preview at 209 ms after navigation. The earlier 35-second helper timeout
is not an app timing measurement. The shared 1 ms popup cleanup fix passes real
Framework7 touch fixtures, including repeated open/close and reduced motion;
the update is installed over wireless ADB and its installed checksum matches.
Physical profile-photo close/reopen and menu backdrop close/reopen passed on
that build, with all six final taps observed as touch-end and click events,
zero new exceptions and no stale photo popup. The phone was left on Home.
Hardware/native uploads and submission remain pending. The
startup cache restoration and notice placement/fade passed on the phone. The scenario table
below is the remaining acceptance checklist, not a claim that every row passed.

| Scenario | Required observation |
| --- | --- |
| Login/session | Known or app-filled login works; Home renders; no raw errors or credential exposure. Owner has authorized agent login. |
| Notices | Validation stays understandable; technical errors are logged; notice fades without blocking taps. No private payload appears in UI. |
| Confirmations | Logout/discard remain dialogs. Cancel retains the form and does not set a stale Back direction. |
| Attendance | Existing owner-selected punch-in/out flow still works; no duplicate action from repeated taps. |
| Trip | Owner-run full start/stop trip. Verify existing over-speed and call episode behavior; any call while driving, including hands-free, remains a violation. |
| Tracking conditions | Owner-run location off/on and fake-location checks use the existing expected behavior. Agent does not change settings. |
| Form | Owner-selected existing form, create/edit, required-field validation, calculator/type22 state, photo capture and submission. |
| First-use controls | Scanner/barcode/QR, invoice lookup, weather, print, video, PDF and document controls. Verify both first and repeated use; mark unavailable features Not run. |
| Uploads | Owner-run offline-then-online upload of the authorized test workflow. Verify queued work and resulting server outcome without direct phone database writes. |
| Navigation | Forward/back slide direction, same-page reload, popup Back, cancelled discard, repeated taps and any native callback navigation. |
| Press/scroll | Immediate pressed feedback; ordinary list scrolling does not activate a row; row icon/swipe/hold actions retain their behavior. |
| Saved lists | Warm saved content appears before delayed refresh; successful first-page refresh replaces rows without duplicates; pagination appends; failure preserves saved rows. |
| Context isolation | Changing flow, tab, filter or user does not show another context's saved rows; late responses do not overwrite the current context. |
| Reduced motion | Verify using an already configured reduced-motion device or local test environment; do not change phone settings. |
| Rollout fallback | After agreed server fields/defaults are implemented, verify each Phase 1 switch enables/disables its item and fallback retains current behavior. |

## Phase 1 completion gate

- Required Android build and all unit tests pass.
- Relevant local regression checks pass; phone checks above have explicit
  outcomes and any unavailable controls are plainly identified.
- Page-switch timings improve on **both** phones. The longer-term targets are
  forward <=150 ms and restored Back <=100 ms; do not claim Phase 1 meets them
  without measured evidence.
- A full test day produces no raw error popups.
- Show the result on the phone, including any visible change beyond motion and
  feedback before applying it; no screenshots or recordings unless requested.
- Wait for the owner's OK before Phase 2. Commit, push and fast-forward `main`
  only when explicitly authorized.
