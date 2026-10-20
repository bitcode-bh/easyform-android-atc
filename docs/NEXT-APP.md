# MWFM Next: the app rebuilt natively (Kotlin, Jetpack Compose)

Decision (2026-10-20): the whole app moves to a current native stack. Android 10 (API 29) and up,
no server changes, the same on-phone data.

## Why a separate module, and how it replaces the old app

The old app is about 100,000 lines of Java (363 files) and about as much web code in a WebView. It is built on
Framework7 1.4.2 and cannot be modernised in place: the screens are rebuilt every time they open, and LMS runs a
different Framework7 (9.0.3) that cannot share a page with the rest.

- `:next` is a new application module with its own toolchain (Kotlin 2.0, Compose, Material 3, Navigation Compose).
- During development it installs next to the old app (`com.easyform.atcpv.next`) and does not touch its data.
- When it is ready it ships under the real id `com.easyform.atcpv` with the same signing key. Android then upgrades
  the old app in place and the new app finds the existing database (`Login_Master`, `task_master`, `f_master`,
  `checksheet`, `flow_master`, `User_Define_Flow_Master`, ...), so field users keep their downloads, drafts and
  waiting uploads. Nothing is migrated by copying.
- Until then the old app keeps shipping fixes. The new one is built screen by screen against the real server.

## Targets

| | Old | Next |
|---|---|---|
| UI | WebView, Framework7 1.4.2 | Jetpack Compose, Material 3 |
| minSdk / targetSdk | 26 / 29 (held) | 29 / 35 |
| Navigation | pages in iframes inside a shell | one activity, Navigation Compose, back stack kept |
| Screen change | page rebuilt, loader | screen kept in memory, no loader for local data |
| Data access | SQL strings built in JavaScript | typed repositories over the same SQLite schema |
| Background work | many services | WorkManager and one foreground location service |

## Phases (each is installable and tested on a phone before the next starts)

1. **Foundation** (this change): module, theme, navigation shell with the four tabs, Home screen on a repository.
2. **Login and session**: the real login against the server, device id, the same `Login_Master` row.
3. **Home and Trips on real data**: module list from `User_Define_Flow_Master`, nearest site, trip list.
4. **Download**: the download pipeline (`DownloadMainStructure`), as a WorkManager job with progress.
5. **Lists and tasks**: checksheet list and task list (the two screens that are already native-style in the old app).
6. **Forms**: the checksheet renderer, one Compose component per control type (about 37), draft saving.
7. **Upload and outbox**: the uploader as WorkManager with retry, and the waiting-to-upload badge.
8. **Trip tracking**: port the field-proven trip engine, the foreground location service, call-while-driving rules.
9. **LMS**: modules, assessments, micro learning, dashboard.
10. **Profile, notifications, settings, pending status, change password**.
11. **Cutover**: ship under the real id, remove the WebView app, delete the old web code.

Phases 4, 6, 7 and 8 carry the real risk: they are where field data is created and sent. They are rebuilt against
the existing server calls and compared with the old app's output on the same inputs before cutover.

## LMS is part of the same app

LMS is not a separate product with its own framework. In the new app it is a tab like Home, in the same code and the same design:

- the same navigation graph, theme, cards, rows and stat tiles (`ui/components`); LMS screens may not define their own styles;
- its Dashboard, Modules, Assessments and Micro Learning are Compose screens in `ui/lms`, each with a `ViewModel` over an `LmsRepository`;
- its data comes from the LMS server API (`LMS_API_SPEC.md`) through the same networking and offline layer as the rest, so downloads, retries
  and the waiting-to-upload badge behave the same everywhere;
- the web LMS (Framework7 9, Tailwind, ApexCharts) is not carried over; charts are drawn natively.

## Rules for the new code

- Compose state hoisting, one `ViewModel` per screen, repositories behind interfaces, `Flow` for data that changes.
- No SQL in UI code. All database access goes through typed DAOs/repositories.
- Colours and type from the theme only (brand blue `#2A3086`, surfaces from the existing grey scale).
- Every screen works offline first; the network is a sync step, not a dependency to draw.
- A screen is done when it has been run on a phone, not when it compiles.
