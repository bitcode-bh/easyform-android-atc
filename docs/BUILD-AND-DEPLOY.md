# Build, Configure & Deploy — Universal Trip & Site Map

This is a standalone reference for building and deploying the two relevant
targets on this Mac: the real **Production** app and the **UAT** test app.
Written so a new session can follow it without any prior conversation
context. See [`PRD-Trip-Site-Map-v2.md`](PRD-Trip-Site-Map-v2.md) in this
same folder for what the feature does; this file is only about building it.

---

## The two targets — do not confuse them

| | **Production** | **UAT / test** |
|---|---|---|
| Worktree | `/Volumes/Bitcode/GitHub/easyform-android-atc` (main) | `.claude/worktrees/lms-ui-improvements-fd66a5` |
| Branch | `bitcode.bh/lms-ui-improvements` | `claude/lms-ui-improvements-fd66a5` |
| `applicationId` | `com.easyform.atcpv` | `com.easyform.atctesting` |
| Backend | `https://atcmwfm.americantower.com/...` (**every** URL, not just OCR — see gotcha below) | `https://mwfm-uat.altiusinfra.com/...` (OCR always `atcmwfm.americantower.com`) |
| `res/values/strings.xml` app label | (real app name) | "UAT Elevar (MWFM)" |
| Root/anti-tamper checks (`MainActivity.java`) | **Real, all four enabled** | **Bypassed** (`if (false)` — the test device is rooted) |
| Signing | Real release keystore (not on this Mac — see below) | Falls back to `keystore/easyform-debug.jks` |
| Real device install | `com.easyform.atcpv`, already on the CPH2717 test device (V1.10 as of 2026-08-12) | `com.easyform.atctesting`, same device |

**Gotcha — do not "fix" the production URLs to `mwfm.altiusinfra.com`.**
`altiusinfra.com` is the generic/other-tenant domain. This specific app
(`com.easyform.atcpv`, "ATC" = American Tower Corporation) is a
white-labeled build whose *entire* backend — not just OCR — is
`atcmwfm.americantower.com`. This is the real, committed, working
production config (`main`'s `build.gradle`, unmodified by any of this
session's changes). If a future session sees the generic
"`mwfm-uat.altiusinfra.com` → `mwfm.altiusinfra.com`" URL-swap pattern used
for a *test* package (e.g. `atcpvnoc`, see below) and is tempted to apply
the same swap to `main`/`atcpv`, **don't** — that would point the real
production app at the wrong backend entirely.

**The real release keystore is not on this Mac.** `build.gradle`'s
`signingConfigs.config.storeFile` tries, in order: `E:/Android_Studio/key`
(a Windows path — never present here), then
`EasyFormSE_finance/keystore/easyform-debug.jks` (present, debug-only), then
the OS debug keystore. **Any APK built on this Mac today is debug-signed.**
A debug-signed APK cannot update the real `com.easyform.atcpv` install on
any device (Android refuses mismatched-signature updates), and must never
be distributed as if it were a release build. To produce a genuine
release build, either bring the real keystore to this Mac or build on a
machine that already has it.

---

## One-time machine setup (both targets)

- **JDK 17**: `/Users/anupsharma/.jdks/jdk-17.0.19+10/Contents/Home`
- **Android SDK**: `/Volumes/Bitcode/DevCache/android-sdk`
- Each worktree needs its own `local.properties` (gitignored, not shared
  across worktrees) pointing `sdk.dir` at the path above. If missing or set
  to a Windows path (`C:\Users\...`), builds fail with
  `compileSdkVersion is not specified` / `No installed build tools found`.
  Fix:
  ```bash
  echo "sdk.dir=/Volumes/Bitcode/DevCache/android-sdk" > local.properties
  ```
- **`gradlew` needs `JAVA_HOME` set before it boots**, not just passed as a
  Gradle property — a bare `./gradlew ... -Dorg.gradle.java.home=...` is
  not enough; Gradle's own bootstrap JVM launch happens before that flag is
  read. Either export it once per shell:
  ```bash
  export JAVA_HOME=/Users/anupsharma/.jdks/jdk-17.0.19+10/Contents/Home
  ```
  or prefix every `gradlew` call:
  ```bash
  JAVA_HOME=/Users/anupsharma/.jdks/jdk-17.0.19+10/Contents/Home ./gradlew ...
  ```
  (`lms-ui-improvements-fd66a5`'s `gradlew` has this patched in directly,
  gitignored/local-only — `main`'s `gradlew` is the stock script and needs
  the env var passed explicitly every time, as above.)

---

## Building Production (`main`, `com.easyform.atcpv`)

```bash
cd /Volumes/Bitcode/GitHub/easyform-android-atc
JAVA_HOME=/Users/anupsharma/.jdks/jdk-17.0.19+10/Contents/Home \
  ./gradlew :EasyFormSE_finance:assembleDebug --console=plain
```

Output: `EasyFormSE_finance/build/outputs/apk/debug/EasyFormSE_finance-debug.apk`
(`applicationId com.easyform.atcpv`, real backend, real root checks — this
build **will refuse to launch on the rooted CPH2717 test device**, by
design, since the anti-tamper checks are live and unmodified here).

**Before installing anywhere, check what's already there.** This
worktree's `applicationId` is the real one — `adb install -r` on a device
that already has a differently-signed `com.easyform.atcpv` will either fail
outright or (with a matching signature) silently overwrite a real install.
Always confirm target and existing version first:
```bash
adb shell dumpsys package com.easyform.atcpv | grep -E "versionName|lastUpdateTime"
```
**Do not install over a real user's device without their explicit
go-ahead** — this is not a test package like `atctesting`/`atcpvnoc`.

`main`'s working tree also has pre-existing, unrelated uncommitted changes
(a trivial `build.gradle` whitespace diff; untracked
`assets/www2.zip`, `apk_www2_temp/`, and a stray nested `easyform-android-atc/`
directory containing only a bare `.git`). None of these are related to the
trip-map feature — leave them alone unless you know what they are.

---

## Building UAT / test (`lms-ui-improvements-fd66a5`, `com.easyform.atctesting`)

```bash
cd /Volumes/Bitcode/GitHub/easyform-android-atc/.claude/worktrees/lms-ui-improvements-fd66a5
./gradlew :EasyFormSE_finance:assembleDebug --console=plain
```

(No `JAVA_HOME=` prefix needed — this worktree's `gradlew` already has the
JDK17 path patched in locally.)

Output: same relative path,
`EasyFormSE_finance/build/outputs/apk/debug/EasyFormSE_finance-debug.apk`,
this time `applicationId com.easyform.atctesting`, UAT backend, root checks
bypassed so it launches on the rooted test device.

```bash
ADB=/Volumes/Bitcode/DevCache/android-sdk/platform-tools/adb
$ADB install -r EasyFormSE_finance/build/outputs/apk/debug/EasyFormSE_finance-debug.apk
$ADB shell monkey -p com.easyform.atctesting -c android.intent.category.LAUNCHER 1
```

**Login is manual** — never auto-enter credentials; a reinstall returns the
app to the login screen and costs the user a real re-login.

**Wireless ADB** (works around USB dropping mid-session on this device):
```bash
adb shell ip -f inet addr show wlan0 | grep -o 'inet [0-9.]*'   # device's WiFi IP
adb tcpip 5555
adb connect <that-ip>:5555
# then target it explicitly if USB still shows a second entry:
adb -s <ip>:5555 install -r <apk>
```
Doesn't survive a reboot or the phone leaving the WiFi network — redo
`tcpip`+`connect` if the connection drops.

---

## A third package exists for one specific purpose: `atcpvnoc`

`com.easyform.atcpvnoc` is a **registered-but-otherwise-unused** Firebase
client id (`google-services.json` already has an entry for it, so no
config file edits are needed to build under this name). It exists purely
so that **production URLs can be exercised on the rooted test device
without touching the real `com.easyform.atcpv` package or its root
bypasses**. To build it: take the `lms-ui-improvements-fd66a5` worktree
(which already has the root-check bypass needed to launch on a rooted
device) and, *temporarily and locally, never committed*, edit
`build.gradle`:

```bash
# in lms-ui-improvements-fd66a5/EasyFormSE_finance/build.gradle
# swap:  applicationId "com.easyform.atctesting"  →  "com.easyform.atcpvnoc"
# swap:  every mwfm-uat.altiusinfra.com  →  mwfm.altiusinfra.com  (leave OCR/americantower alone)
```
Build and install exactly as the UAT steps above, then **revert both
substitutions** (`git checkout -- build.gradle` if nothing else in that
file needs to stay changed) so the worktree returns to its real UAT state
for the next `atctesting` build. This is a convenience for local
verification only — `atcpvnoc` is not a real product, has no real users,
and its data (`task_master`, `geofence_tracking`, etc.) is genuinely empty
until real production sync has populated it once through a real login.

---

## Verifying the trip-map module didn't touch the engine

The module's isolation is the whole point (see PRD §2/§6). After any change
under `trip/mapui/` or `EFSE_Js/trip_map/`, confirm the blocklist is still
zero-diff before building:

```bash
cd <worktree>
for f in newfused loc_change TripPlugin TripMapUi AutoTripStopService \
         TripUploadNew navigation activity_recognize MainActivity \
         SpeedViolation f_upload_new_structure GeofenceDownlaod \
         GeofencTrackingMapActivity SiteRoutePlugin; do
  git diff --quiet -- "EasyFormSE_finance/src/com/sky/atc/easyformse/$f.java" \
    "EasyFormSE_finance/src/com/sky/atc/easyformse/trip/$f.java" 2>/dev/null \
    && echo "clean   $f" || echo "DIFF!!  $f"
done
git diff --stat -- EasyFormSE_finance/AndroidManifest.xml \
  EasyFormSE_finance/assets/www2/EFSE_Js/viewsitelist_pm.js \
  EasyFormSE_finance/assets/www2/EFSE_Js/viewsitelist_pm_on.js \
  EasyFormSE_finance/assets/www2/selection.html \
  EasyFormSE_finance/assets/www2/selection_survey.html \
  EasyFormSE_finance/res/xml/config.xml \
  EasyFormSE_finance/build.gradle
```
The five integration-hook files plus `build.gradle` (one dependency line,
`android-maps-utils`) should be the only things touched outside the new
`trip/mapui/` and `trip_map/` directories — currently ~7 files, ~30
insertions on both worktrees. Everything else in the diff means scope
crept into the engine and needs a hard look before proceeding.

---

## Where the map's entry point actually lives

The **Map** tab is in the app's Home bottom bar
(`EasyFormSE_finance/assets/www2/selection.html`, the
`div_new_tabbar`/`#div_new_tabbar` block), next to Notification/Report/LMS —
`id="btn_trip_map"`, hidden (`display:none`) until a `map_profile` resolves
(FR-01/FR-04). This is the only wired entry point on both worktrees today;
an earlier attempt at a second entry point on the site-list screen
(`selection_survey.html`) was superseded during development — that page
still loads the `trip_map` JS module (harmless, used by native code) but has
no visible button of its own.

Site data, in priority order the native side actually tries: (1) whatever
the JS layer cached from a listing page the user already opened, (2)
`task_master` (the local downloaded-task table, `OfflineTaskReader.java`),
(3) `geofence_tracking` (the device's downloaded geofence set,
`GeofenceTrackingReader.java` — populated by a separate download step that
does not depend on a task list ever being opened, so it is sometimes the
*only* local data present; a confirmed sentinel placeholder row,
`latitude=21, longitude=61`, is filtered out unconditionally). If all three
are empty, the map still opens (on the user's position, with working range
chips) and says specifically why nothing is plotted — see
`VtTripTrackingMapActivity.emptyPayloadMessage()`.
