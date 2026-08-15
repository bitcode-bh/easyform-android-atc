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
| Backend | `https://mwfm.altiusinfra.com/...` | `https://mwfm-uat.altiusinfra.com/...` |
| `res/values/strings.xml` app label | (real app name) | "UAT Elevar (MWFM)" |
| Root/anti-tamper checks (`MainActivity.java`) | **Real, all four enabled** | **Real, all four enabled** — the CPH2717 is *not* rooted; do not bypass |
| Signing | Real release keystore (not on this Mac — see below) | Falls back to `keystore/easyform-debug.jks` |
| Real device install | `com.easyform.atcpv`, already on the CPH2717 test device (V1.10 as of 2026-08-12) | `com.easyform.atctesting`, same device |

**⛔ THE URL RULE (repo owner, settled 2026-08-15). This is the only rule — do
not re-derive it, do not "verify it against `main`", do not reopen it.**

| Owner says | Set every URL `resValue` host to |
|---|---|
| **"build uat"** | `mwfm-uat.altiusinfra.com` |
| **"build prod"** | `mwfm.altiusinfra.com` |

**`OCR` is the one exception in both cases** and always stays
`https://atcmwfm.americantower.com/Azure-OCR/api/`. Paths never change, only
the host.

**Never point the other URLs at `atcmwfm.americantower.com`.** `main`'s
*committed* `build.gradle` still has americantower everywhere, so a plain
checkout does **not** satisfy this — swap the hosts after checkout. `main`
being that way is not evidence against this rule; `main` is simply stale.

> Earlier revisions of this file flip-flopped on exactly this point and cost
> the owner days. If a future note appears to contradict the table above,
> the table wins.

**Other build gotchas, observed on-device 2026-08-15 (`com.easyform.atcpv`,
CPH2717):**

- The backend rejects the app with **"Please upgrade your Application!!!"** at
  login unless `versionName` is at least `ATC_19.6.37_F7_V1.11.2` (`main`
  ships `ATC_19.6.29_F7_V1.10`). Keep it at or above that.
- **`JAVA_HOME` must point at `~/.jdks/jdk-17.0.19+10/Contents/Home`**, not at
  the bundle root. Pointing it at the root makes `gradlew` print
  "JAVA_HOME is set to an invalid directory" **and still exit 0** — so the
  build silently does not run and you are left inspecting a stale APK from an
  earlier build. Always confirm the APK's mtime and its baked-in resources
  after building:
  ```
  aapt dump --values resources <apk> | grep -oE 'https://[a-zA-Z0-9./_-]+'
  ```
- Account/tenant coverage differs per host — an account with content on one
  host may have **zero assigned flows** on another. Ask the owner which
  account to test with rather than assuming; see "Zero-flow infinite reload".

**Zero-flow infinite reload (real bug, fixed 2026-08-15, uncommitted).**
`selection.js`'s `SuccessCallBack_onload_get_data_from_ufm` had, in its "no udf
to display" branch, `changeurl("selection.html")` — reloading the page it is
already on. For any user with zero assigned flows that is an infinite loop:
each reload re-runs the same callback, gets the same empty result, reloads
again. It is *visually* a flicker/blank rather than an obvious crash, because
`changeurl()` first applies `premium-fade-out` (`opacity: 0 !important`,
`js/changeurl.js`) and the next load's 400ms `premium-fade-in` is cut short by
the following reload — so the page never becomes readable, including the side
menu needed to log out. Confirmed by trapping that single call live over CDP:
opacity went `0 → 1` and the page rendered normally. Now replaced with
`enable_back_button(); return;` so a zero-flow user gets a usable (if empty)
Home instead of a loop. This is backend-independent — it would fire on any
tenant where a user has no flows.

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
build **runs fine on the CPH2717**, which is not rooted; verified on-device
2026-08-15).

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
this time `applicationId com.easyform.atctesting`, UAT backend, and the real
root checks enabled (the CPH2717 is not rooted — no bypass needed or wanted).

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
so that **production URLs can be exercised on the test device without
touching the real `com.easyform.atcpv` install**. (It is *not* about root
bypasses — the device is not rooted and the real checks pass.) To build it:
take the `lms-ui-improvements-fd66a5` worktree and, *temporarily and
locally, never committed*, edit `build.gradle`:

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
The five integration-hook files plus `build.gradle` should be the only
things touched outside the new `trip/mapui/`, `trip_map/`, and
`EasyFormSE_finance/test/` directories.

**This same check now also runs automatically as a git pre-commit hook** —
`.git/hooks/pre-commit` (shared across every worktree of this repository,
since git worktrees share the common `.git` dir; no per-worktree install
needed). It blocks a commit only when it touches **both** trip-map's own
files and a blocklist file in the same commit — an unrelated, legitimate
engine commit that never touches trip-map is left alone. Bypass with
`git commit --no-verify` if a blocklist touch is genuinely intentional and
reviewed. There is no CI in this repo to enforce this remotely — this hook
is local-only, per-machine.

---

## Running the unit tests

```bash
cd <worktree>   # JAVA_HOME= prefix needed on main, same as assembleDebug above
./gradlew :EasyFormSE_finance:testDebugUnitTest \
  --tests "com.sky.atc.easyformse.trip.mapui.MapSiteLoaderTest"
```
Report: `EasyFormSE_finance/build/reports/tests/testDebugUnitTest/index.html`.

Two non-obvious, project-specific things had to be fixed before any test
here could even compile or run — worth knowing before adding more:

- **Test source cannot live at the Android-standard `src/test/java`.**
  This module's `build.gradle` sets `main.java.srcDirs = ['src']` — the
  *entire* `src/` tree, not the conventional `src/main/java` — so anything
  under `src/test/java` gets swept into `main`'s own compile too, which has
  no JUnit on its classpath and fails to build. Test source lives at
  `EasyFormSE_finance/test/java/...` instead (sibling to `src/`, not nested
  in it), with an explicit `sourceSets.test.java.srcDirs = ['test/java']` in
  `build.gradle`.
- **`org.json.*` needs a real jar on the test classpath.** It's bundled in
  the Android unit-test stub jar like every other framework class, but its
  `JSONObject`/`JSONArray` constructors don't benefit from
  `testOptions.unitTests.returnDefaultValues` (that only no-ops *method*
  calls, e.g. `Location.distanceBetween()`) — without a real implementation
  on the test classpath, even constructing a `JSONObject` throws.
  `testImplementation 'org.json:json:20230227'` fixes it.

Given `returnDefaultValues = true`, `Location.distanceBetween()` becomes a
no-op, so every `MapSite.distanceM` ends up `0` after a test's `load()`
call — real near/far distance filtering isn't verifiable without
Robolectric or a mocked `Location`. The existing suite tests the
boolean/structural plumbing instead (`radiusApplied`, `sortedByDistance`,
`effectiveRadiusKm`, filter/limit counts) — which is where the actual bugs
in this module have lived so far, not in the distance math itself.

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

Implemented profile types (`TripMapConfig.IMPLEMENTED` in
`trip_map_config.js`): `ASSIGNED_LIST`, `NEARBY_RADIUS`, `ASSIGNED_CLUSTER`,
`ASSIGNED_CLUSTER_TODAY`, `GEOFENCE_DOWNLOAD`, `DATE_RANGE`. Registered but
**not** implemented (a profile configured to one of these resolves to
`null` and the map button stays hidden, rather than crashing):
`CUSTOM_API` (no request/response contract defined yet — needs backend
spec work before it's codeable) and a standalone `OFFLINE_TASK_MASTER`
*profile type* (the table itself is already read as fallback tier 2 for
every other type, just not selectable as its own explicit `type`).

---

## A separate, unrelated, not-yet-built PRD lives alongside this one

`docs/PRD-Home-Operations-Dashboard.md` — a home-screen dashboard
(today's-work widgets, trip/upload status, etc.) that references this
module only as one optional widget (`map_entry`, linking out to the Map
tab). As of this writing it is **spec only**: no `EFSE_Js/home_dashboard/`
code exists anywhere in the repo. Do not assume it shares implementation
state with the trip-map module beyond that one intended cross-link.
