# Product Requirements Document (PRD) v1.0

## Home Operations Dashboard (Main App — LMS Excluded)

| Field | Value |
|---|---|
| **Version** | 1.0 |
| **Date** | 12 Aug 2026 |
| **Scope** | EasyForm main app (`selection.html` home, field workflows, trip, uploads) |
| **Out of scope** | LMS (`LMS_Dashboard.html`, LMS APIs), tracking engine changes |
| **Related** | [PRD-Trip-Site-Map-v2.md](./PRD-Trip-Site-Map-v2.md) — map widget is a separate module linked from this dashboard |
| **P1 status** | **Shipped** `c5e35e1` (14 Aug 2026, `claude/lms-ui-improvements-fd66a5`) — see §12a below for what actually landed and where it diverged from this spec |
| **P2 status** | **Shipped** `5314afd` (14 Aug 2026, `claude/lms-ui-improvements-fd66a5`) — trip_stats/map_entry/attendance_chip, live-verified over CDP against real UAT data and a from-source rebuild+reinstall. See §12b below. |
| **P3 status** | **Built, uncommitted** (14 Aug 2026) — notifications_summary/feature_links written; approvals_pending deferred, needs a real backend endpoint (see §12c). On-device verification pending device availability. |

---

## 1. Executive summary

Build a **configurable home operations dashboard** on `selection.html` that gives every field role a single at-a-glance view of:

- Today's work (tasks, flows, counts)
- Trip status and quick actions
- Upload/sync health (offline-first)
- Attendance reminders
- Optional map entry (via existing `trip_map` module)
- Optional supervisor analytics (via existing `selection_dashboard.js`, role-gated)

The dashboard is a **new isolated module** (`EFSE_Js/home_dashboard/`). Existing trip/GPS/upload engine code is **not modified**. When `home_dashboard_enabled` is false, the app behaves exactly as today.

---

## 2. Problem statement

Today the home screen (`selection.html`) shows:

- A flat module/flow list
- Ad-hoc trip start/stop cards (`noti_Attendance2/3`)
- Notifications (separate area)

Field users must drill into each flow to understand workload. Supervisors have a full analytics dashboard (`selection_dashboard.js`, ~7,700 lines) that is **built but disabled** (`ischart_enabled = 'false'`). Upload pending counts exist in `pending_status.js` but are not surfaced on home.

There is no unified, role-configurable **operations dashboard** that works offline and does not risk the tracking engine.

---

## 3. Design principles

| Principle | Meaning |
|---|---|
| **Engine sacred** | No changes to `newfused`, `loc_change`, `TripPlugin` trip logic, `AutoTripStopService`, upload pipeline |
| **Config over code** | Widget visibility and layout = `dashboard_profile` JSON, not hardcoded `role_id` |
| **Read-only by default** | Dashboard SELECTs / displays; actions delegate to existing handlers (start trip, sync, open flow) |
| **Isolated module** | All new code under `EFSE_Js/home_dashboard/`; minimal hooks in existing files |
| **Offline-first widgets** | Core widgets (tasks, uploads, trip status) work from SQLite / localStorage without network |
| **Fail safe** | Feature flag off → zero UI/behaviour change; missing config → dashboard hidden |
| **LMS excluded** | No LMS pages, APIs, or UI patterns in this module |

---

## 4. Goals and non-goals

### 4.1 Goals

| # | Goal |
|---|---|
| G1 | **Any role** can have a tailored home dashboard via server/UDF config |
| G2 | **Offline-capable** summary for tasks, uploads, and trip status |
| G3 | **One-tap** access to start trip, sync, open map, open flow |
| G4 | **Zero regression** on existing listing, trip, and upload flows |
| G5 | **Composable widgets** — enable/disable per tenant without app release |
| G6 | Optional **supervisor analytics** via existing legacy dashboard (separate flag) |

### 4.2 Non-goals

- LMS dashboard or LMS skill/training widgets
- Modifying trip tracking engine or GPS services
- Replacing `feature_chart.html`, `EF_Custom_Reports.html`, or KYFF screens (they remain drill-down destinations)
- Building a new server analytics platform (reuse existing WCF APIs)
- Native Android (Jetpack) dashboard — Cordova/web only
- Turn-by-turn navigation (delegated to `trip_map` / `SiteRoutePlugin`)

---

## 5. User personas and dashboard compositions

| Persona | Typical roles | Default widgets |
|---|---|---|
| **Field engineer** | PM, survey, install | Task summary, uploads, attendance, trip card |
| **Transport / VT** | Transport flows | Trip card, map entry, nearby-site summary, violations count |
| **CE / cluster-bound** | Circle-assigned day plan | Task summary (today + cluster), map entry, attendance |
| **Supervisor** | Circle head, manager | Task summary, approvals (if enabled), analytics strip (optional) |
| **Auditor** | Review roles | Task summary, notifications, link to custom reports |
| **Head / feature-only user** | No flows assigned | Feature menu links (KYFF, charts — existing `menu_MISC`) |

All personas are served by the **same widget library** with different `dashboard_profile` configs — no role ID checks in application code.

---

## 6. Widget catalog

Each widget is independently enableable in `dashboard_profile.widgets[]`.

### 6.1 Widget: `greeting_header`

> **Shipped as navbar chrome, not a dashboard-card widget — see §12a.** This table is the original
> spec; `HomeDashboardConfig.TYPES` no longer includes `greeting_header` at all.

| Attribute | Value |
|---|---|
| **Purpose** | Personalized greeting + date |
| **Data** | `localStorage.username`, device date |
| **Offline** | Yes |
| **Actions** | None |
| **Phase** | P1 |

---

### 6.2 Widget: `task_summary`

| Attribute | Value |
|---|---|
| **Purpose** | Pending / completed / overdue task counts across visible flows |
| **Data (online)** | `WCF_OnlineTaskList_Native_Count` (same as `selection.js` module badges) |
| **Data (offline)** | SQLite `task_master` aggregated by `moduleid` + `status` |
| **Config** | `status_filter`, `flow_ids[]`, `show_per_flow_breakdown: true/false` |
| **Offline** | Yes (offline flows) |
| **Actions** | Tap flow row → existing flow navigation in `selection.js` |
| **Phase** | P1 |

**Display example:**

```
┌─────────┐ ┌─────────┐ ┌─────────┐
│   12    │ │    8    │ │    4    │
│ Pending │ │  Done   │ │ Overdue │
└─────────┘ └─────────┘ └─────────┘
```

---

### 6.3 Widget: `flow_list_compact`

| Attribute | Value |
|---|---|
| **Purpose** | Condensed module list with badge counts (alternative to full `module_list`) |
| **Data** | Same as `task_summary` per-flow breakdown |
| **Config** | `max_visible: 5`, `show_view_all: true` |
| **Offline** | Partial |
| **Actions** | Tap → open flow (reuse `selection.js` click handlers) |
| **Phase** | P1 |

---

### 6.4 Widget: `trip_status`

> **Shipped as the bottom tab bar's "Start Trip" action, not a dashboard-card widget — see §12a.**
> This table is the original spec; `HomeDashboardConfig.TYPES` no longer includes `trip_status` at
> all, and the in-dashboard TRIP card plus `#noti_Attendance2` were removed as a result.

| Attribute | Value |
|---|---|
| **Purpose** | Show active trip, duration, or prompt to start |
| **Data** | `localStorage.trip_status`, SQLite `lat_plug` (`trip_status=0`, `min_milli`, `tid`) |
| **Offline** | Yes |
| **Actions** | START → `noti_Attendance_Click()` (existing); END → `stop_trip_manualy_from_module_listing()` (existing) |
| **Phase** | P1 |
| **Engine** | Read-only except delegating to existing start/stop handlers |

**States:**

| State | UI |
|---|---|
| No trip | "Ready to begin your daily work trip?" + START |
| Active | "Trip active — {duration}" + END |
| Paused display only | Uses existing `isTripPauseAfterTask` behaviour if configured |

---

### 6.5 Widget: `trip_stats` (active trip only)

| Attribute | Value |
|---|---|
| **Purpose** | Distance estimate, violations, sites visited during active trip |
| **Data** | `track_master` (read-only via `TrackPathReader` or JS equivalent SELECT), `geofence_tracking` events |
| **Offline** | Yes |
| **Actions** | Tap → open full trip map (`TripSiteMap.open()`) |
| **Phase** | P2 |
| **Depends on** | [PRD-Trip-Site-Map-v2.md](./PRD-Trip-Site-Map-v2.md) |

| Metric | Source |
|---|---|
| Duration | `min_milli` from `lat_plug` vs now |
| Path points | `track_master WHERE tripflag IN (2,3)` |
| Violations | `track_master WHERE tripflag = 3` |
| Km (estimate) | Haversine sum over path points (on-device, approximate) |
| Sites visited | Geofence IN/OUT count for today |

---

### 6.6 Widget: `upload_health`

| Attribute | Value |
|---|---|
| **Purpose** | Pending upload counts across tasks, trips, photos, files, videos |
| **Data** | Same SQLite queries as `pending_status.js` |
| **Offline** | Yes |
| **Actions** | SYNC NOW → existing upload trigger (`make_upload_call()` or equivalent safe entry) |
| **Phase** | P1 |

| Counter | Query (existing) |
|---|---|
| Pending tasks | `task_master WHERE flag = 1 OR flag = 3` |
| Pending trips | `lat_plug WHERE issend = 0` |
| Pending videos | `video WHERE issend_track = 0` |
| Pending files | `f_master WHERE flag = 0` |
| Pending photos | `p_master WHERE flag = 0` |

---

### 6.7 Widget: `attendance_chip`

| Attribute | Value |
|---|---|
| **Purpose** | Today's check-in/out status |
| **Data** | `Get_Attendance` API; profile photo warning from existing `noti_Attendance1` logic |
| **Offline** | No (shows last known or "unavailable offline") |
| **Actions** | Tap → navigate to attendance flow (existing `AttendanceJson[0].flow_id` handler) |
| **Phase** | P2 |

---

### 6.8 Widget: `map_entry`

| Attribute | Value |
|---|---|
| **Purpose** | Card/button to open trip & site map |
| **Data** | Site count from `trip_map` cache; profile from `map_profile` / `role_map` |
| **Offline** | Partial (cached sites yes; planned route needs network) |
| **Actions** | OPEN MAP → `TripSiteMap.open()` from `trip_map_entry.js` |
| **Phase** | P2 |
| **Depends on** | [PRD-Trip-Site-Map-v2.md](./PRD-Trip-Site-Map-v2.md) |

---

### 6.9 Widget: `notifications_summary`

| Attribute | Value |
|---|---|
| **Purpose** | Latest 3–5 notifications + unread count |
| **Data** | `Get_NotificationList_For_User`; global marquee via `select_marquee` |
| **Offline** | No |
| **Actions** | Tap → expand existing notification panel |
| **Phase** | P3 |

---

### 6.10 Widget: `approvals_pending` (supervisor)

| Attribute | Value |
|---|---|
| **Purpose** | Count of items awaiting bulk approval |
| **Data** | `WCF_Bulk_approval` (existing in `common-functions.js`) |
| **Offline** | No |
| **Actions** | Tap → approval flow (existing handler) |
| **Phase** | P3 |
| **Config** | `enabled: false` by default; enable per tenant |

---

### 6.11 Widget: `analytics_strip` (supervisor — legacy)

| Attribute | Value |
|---|---|
| **Purpose** | 1–2 summary KPI cards from server analytics |
| **Data** | `Dashboard_count_new` with pre-configured chart IDs |
| **Offline** | No |
| **Actions** | Tap → expand full `selection_dashboard.js` view or `feature_chart.html` |
| **Phase** | P4 |
| **Note** | Does **not** load full 7,700-line dashboard on home by default; lazy-load on expand only |

---

### 6.12 Widget: `feature_links` (head / feature-only users)

| Attribute | Value |
|---|---|
| **Purpose** | Links to KYFF, charts, scoreboard, technician report, live alarm |
| **Data** | Login flags. Real `menu_MISC` identifiers (verified against `selection.html`): `KYFF` (`menu_KYFF`/`report_name: "KYFF"`), `Chart`/`ischart_enabled`, `Scoreboard` (`menu_Scoreboard`), `tech_rep` (`menu_tech_rep`/`report_name: "tech_rep"`, displayed "Technician Report"), `live_alarm` (`menu_live_alarm`/`report_name: "live_alarm"`, displayed "Live Alarm Report") |
| **Offline** | N/A (navigation only) |
| **Actions** | Same as existing `menu_MISC` items in `selection.html` |
| **Phase** | P3 |
| **Note** | Reuses existing pages; no duplication of report logic |

---

## 7. Configuration schema

### 7.1 Feature flag (kill switch)

```json
{
  "home_dashboard_enabled": true
}
```

| Location | Priority |
|---|---|
| `list_json[0].home_dashboard_enabled` | 1 |
| Login response / tenant config | 2 |
| Default | `false` |

When `false`: no dashboard container rendered; no scripts loaded; zero behaviour change.

---

### 7.2 Dashboard profile

```json
{
  "dashboard_profile": {
    "layout": "stack",
    "refresh_interval_sec": 60,
    "widgets": [
      { "type": "greeting_header" },
      {
        "type": "task_summary",
        "show_per_flow_breakdown": true,
        "status_filter": "default"
      },
      { "type": "trip_status" },
      {
        "type": "upload_health",
        "show_sync_button": true
      },
      {
        "type": "map_entry",
        "map_profile_ref": "map_profile"
      }
    ]
  }
}
```

---

### 7.3 Role map (one flow, many roles)

```json
{
  "dashboard_role_map": {
    "364": {
      "widgets": [
        { "type": "greeting_header" },
        { "type": "trip_status" },
        { "type": "trip_stats" },
        { "type": "map_entry" },
        { "type": "upload_health" }
      ]
    },
    "305": {
      "widgets": [
        { "type": "greeting_header" },
        { "type": "task_summary", "show_per_flow_breakdown": true },
        { "type": "map_entry" },
        { "type": "attendance_chip" },
        { "type": "upload_health" }
      ]
    },
    "*": {
      "widgets": [
        { "type": "greeting_header" },
        { "type": "task_summary" },
        { "type": "trip_status" },
        { "type": "upload_health" }
      ]
    }
  }
}
```

### 7.4 Profile resolution (priority)

1. `list_json[0].dashboard_profile`
2. `list_json[0].dashboard_role_map[role_id]`
3. `list_json[0].dashboard_role_map["*"]`
4. Built-in default profile (greeting + task_summary + trip_status + upload_health)
5. If `home_dashboard_enabled === false` → hide dashboard

**No hardcoded role IDs in Java or JS.**

---

## 8. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  EXISTING (unchanged)                                            │
│  selection.html → module_list, trip cards, notifications         │
│  selection.js → flow navigation, counters                        │
│  pending_status.js → upload queries                              │
│  trip_map/ → map module (separate PRD)                           │
│  selection_dashboard.js → legacy analytics (optional, lazy)      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ thin hooks only
┌───────────────────────────▼─────────────────────────────────────┐
│  NEW: EFSE_Js/home_dashboard/                                   │
│                                                                   │
│  home_dashboard_entry.js    ← public API                         │
│  home_dashboard_config.js   ← defaults, widget registry          │
│  home_dashboard_resolver.js ← profile + role_map resolution      │
│  widgets/                                                        │
│    widget_task_summary.js                                        │
│    widget_trip_status.js                                         │
│    widget_upload_health.js                                       │
│    widget_attendance.js                                          │
│    widget_map_entry.js      → delegates to TripSiteMap           │
│    widget_notifications.js                                       │
│    ...                                                           │
│  home_dashboard_data.js     ← SQLite + API adapters (read-only)  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.1 Public JS API

```javascript
// home_dashboard/home_dashboard_entry.js — only export used by existing pages
HomeDashboard.init();           // resolve profile, render widgets on selection.html
HomeDashboard.refresh();        // pull-to-refresh / interval refresh
HomeDashboard.isEnabled();      // feature flag + profile check
HomeDashboard.destroy();        // teardown on logout (optional)
```

### 8.2 Folder structure

```
EasyFormSE_finance/assets/www2/
├── EFSE_Js/home_dashboard/           # NEW
│   ├── home_dashboard_entry.js
│   ├── home_dashboard_config.js
│   ├── home_dashboard_resolver.js
│   ├── home_dashboard_data.js
│   └── widgets/
│       ├── widget_greeting.js
│       ├── widget_task_summary.js
│       ├── widget_flow_list.js
│       ├── widget_trip_status.js
│       ├── widget_trip_stats.js
│       ├── widget_upload_health.js
│       ├── widget_attendance.js
│       ├── widget_map_entry.js
│       ├── widget_notifications.js
│       ├── widget_approvals.js
│       ├── widget_analytics_strip.js
│       └── widget_feature_links.js
├── css/home_dashboard.css            # NEW
└── selection.html                    # minimal hook: container + script + flag
```

---

## 9. Integration contract (allowed touch points)

| Existing file | Allowed change | Max scope |
|---|---|---|
| `selection.html` | `#div_home_dashboard` container; script include; call `HomeDashboard.init()` in `pageload_main()` | ≤ 10 lines |
| `selection.html` | Gate with `home_dashboard_enabled` (do not remove existing `module_list`) | Config check |
| `login.js` | Persist `home_dashboard_enabled` / `dashboard_role_map` if returned by server | Optional |
| `common-functions.js` | Logout cleanup: `HomeDashboard.destroy()` | 1 line |

### 9.1 Files that must NOT be modified

Full, hook-verified list in Appendix C — this table is the categorized/readable version of the
same set, plus two items the hook doesn't enforce (`pending_status.js`, `MainActivity.java`) that
are still real boundaries for this module.

| Area | Files |
|---|---|
| GPS / tracking | `newfused.java`, `loc_change.java`, `AutoTripStopService.java`, `navigation.java` |
| Trip lifecycle | `TripPlugin.java`, `TripMapUi.java` (start/stop logic), `trip/TripBackgroundMapActivity.java`, `plugins/SiteRoutePlugin.java` |
| Upload engine | `TripUploadNew.java`, `f_upload_new_structure.java`, `pending_status.js` query logic (not hook-enforced — see §10.1's `home_dashboard_data.js` note on why calling its functions directly is unsafe regardless) |
| Violations | `SpeedViolation.java` (both copies), `activity_recognize.java` |
| Geofencing | `GeofenceDownlaod.java`, `GeofencTrackingMapActivity.java`, `geofencenew/GeofenceTrasitionService.java`, `geofencenew/GeofenceTrasitionServicenew.java`, `geofencenew/GeoFenceDraw.java` |
| Security / anti-tamper | `MainActivity.java` (not hook-enforced — see Appendix C's "known gap") |
| LMS | All `LMS/` paths |
| Legacy analytics internals | `selection_dashboard.js` (only lazy-load reference allowed) |

### 9.2 Coexistence with existing home UI

| Element | v1 behaviour |
|---|---|
| `module_list` | **Retained** below dashboard (or collapsible "View all modules") |
| `noti_Attendance2/3` | **Hidden** when `trip_status` widget is active (avoid duplicate) |
| `noti_Attendance1` | Merged into `attendance_chip` when enabled |
| Pull-to-refresh | Calls `HomeDashboard.refresh()` in addition to existing `check_table_availabililty()` |

---

## 10. Data adapters (read-only)

### 10.1 `home_dashboard_data.js` responsibilities

| Method | Source | Writes? |
|---|---|---|
| `getTaskCounts(flowIds)` | SQLite `task_master` / `WCF_OnlineTaskList_Native_Count` | No |
| `getTripStatus()` | `localStorage` + `lat_plug` SELECT | No |
| `getTripStats(tid)` | `track_master` SELECT | No |
| `getUploadCounts()` | Same queries as `pending_status.js` | No |
| `getAttendanceToday()` | `Get_Attendance` API | No |
| `getNotifications(limit)` | `Get_NotificationList_For_User` | No |

All write operations (start trip, sync, navigate) **delegate** to existing functions — the dashboard module does not implement its own trip or upload logic.

---

## 11. Refresh and performance

| Rule | Value |
|---|---|
| Initial load | Once on `pageload_main()` after `myApp` ready |
| Auto-refresh | `refresh_interval_sec` from profile (default 60s); only when dashboard visible |
| Pull-to-refresh | Reuse existing PTR on `selection.html` |
| Lazy-load analytics | `analytics_strip` and full `selection_dashboard.js` load only on user expand |
| Script loading | `home_dashboard/*.js` loaded only when `home_dashboard_enabled === true` |
| Max widgets on home | Recommend ≤ 6 visible; rest behind "View more" |
| Low-end devices | Skip `trip_stats` path calculation if > 5,000 points (show "Open map" only) |

---

## 12. Phased delivery

| Phase | Deliverables | Widgets | Duration (est.) |
|---|---|---|---|
| **P1** | Module scaffold + core home dashboard | `greeting_header`, `task_summary`, `trip_status`, `upload_health` | 3–4 weeks |
| **P2** | Trip enrichment + map link | `trip_stats`, `map_entry`, `attendance_chip` | 2–3 weeks |
| **P3** | Supervisor + notifications | `notifications_summary`, `approvals_pending`, `feature_links` | 2 weeks |
| **P4** | Analytics integration | `analytics_strip`, lazy legacy dashboard expand | 2 weeks |
| **P5** | Tenant polish | Custom widget order, `flow_list_compact`, server-driven `dashboard_role_map` | Ongoing |

Each phase is **additive** — new files + optional config; feature flag controls rollout per tenant.

---

## 12a. What P1 actually shipped (`c5e35e1`, 14 Aug 2026)

Full detail in `PROJECT.md`'s "Home Operations Dashboard (P1)" section (this worktree). Summary:

**Dashboard cards, as spec'd:** `task_summary`, `upload_health`. Live behind
`HomeDashboardConfig.DEFAULT_ENABLED = true` — no backend sends `home_dashboard_enabled` yet, so
this local switch is what actually turns them on today (same pattern as `ischart_enabled`).

**Two P1 widgets shipped as permanent chrome instead of dashboard cards** — a deliberate deviation
from this PRD, not an oversight:
- `greeting_header` → the top navbar, beside the profile avatar
- `trip_status` → the bottom tab bar's new "Start Trip" action (state-aware icon/label, delegates
  to the existing `noti_Attendance_Click()` / `stop_trip_manualy_from_module_listing()`)

Both are unconditional now, not gated by `home_dashboard_enabled`/`dashboard_profile` — treat them
as **out of the widget catalog** for any future work (§6.1/§6.4 below are historical spec, not
current widget registry; `HomeDashboardConfig.TYPES` no longer lists either). The in-dashboard TRIP
card and `#noti_Attendance2` ("Your attendance is pending!") were removed as a direct consequence —
Start Trip is the single entry point for that flow now, both were duplicate prompts.

**Two real bugs found while wiring the navbar relocation** (not spec'd anywhere, found live):
`css/home_redesign.css` — where the new navbar layout was first written — is not loaded by
`selection.html` at all (no `<link>` references it), so the rules silently did nothing; rewritten
in `css/home_nav.css`, which is actually loaded. Separately, legacy `#div_dashboard_config`
chart-edit controls (dead since `ischart_enabled` is permanently `'false'`) were rendering at 197px
wide — 46% of the navbar — squeezing the greeting text to a few px; now explicitly hidden.

**§6.12 and Appendix C had inaccuracies found during PRD review, now corrected in place below**:
`feature_links`' login-flag names didn't match the real identifiers (`tech_rep`/`live_alarm`, not
`Tech_Report`/`Live_Alarm_Report`), and Appendix C's blocklist didn't match what
`.git/hooks/pre-commit` actually enforces.

---

## 12b. What P2 actually shipped (14 Aug 2026, uncommitted)

Built `trip_stats`, `map_entry`, `attendance_chip` largely as spec'd (§6.5/§6.7/§6.8), with the
data-source specifics resolved against real schema/code rather than the PRD's placeholder wording:

- **`trip_stats`** (`widget_trip_stats.js` + `HomeDashboardData.getTripStats()`): scopes
  `track_master` by `date >= lat_plug.min_milli` — **not** a `tid` join, since `track_master` has
  no `tid` column (confirmed against `MySQLiteHelper.java`'s `CREATE TABLE`). This mirrors the
  native `TrackPathReader.java`'s own query verbatim, tripflag 2/3 semantics included. Km is a
  Haversine sum over ordered `lat,lon` rows, but only below the PRD §11 cap (>5,000 points skips
  the calc, `km` stays `null` — never a fabricated/estimated distance). "Sites visited" reads
  `geofence_user_tracking_detail` (`is_send='1'`, confirmed-dwell visits), **not**
  `geofence_tracking` — that table is only the downloaded site catalog, not a visit log. The whole
  card stays `display:none` unless a trip is actually active (`localStorage.trip_status === '0'`),
  and tapping it opens the map via the same `TripSiteMap.open()` the map_entry widget uses.
- **`map_entry`** (`widget_map_entry.js`): gated on `TripSiteMap.isEnabled()` — the identical check
  `trip_map_entry.js`'s own hidden `#btn_trip_map` tab-bar button already uses — so a role whose
  trip-map profile doesn't resolve gets no card at all, not an empty one. Site count reads
  `TripMapCache.getSites().length` (session-cached, no network/native call of its own); OPEN MAP is
  the one action that calls the real `TripSiteMap.open()`.
- **`attendance_chip`** (`widget_attendance.js` + `HomeDashboardData.getAttendanceToday()`): the
  live `Get_Attendance` response has **no explicit checked-in/out boolean** anywhere (confirmed by
  reading every caller) — "checked in today" is derived the same way the rest of the app already
  derives it, a returned record whose `AssignDate` matches today. Checked `AttendanceJson[0]`'s own
  `Punchin_Status`/`Punchout_Status` fields as a possible offline-capable shortcut first; they
  turned out to be static flow-config constants (the `status` payload value to submit on punch-out
  in `stop_trip_manualy_from_module_listing()`), not live per-day state, so they weren't usable
  here. Cheapest-first: checks `localStorage.trip_status` (instant, no network) before falling back
  to the `Get_Attendance` call. Tap always delegates to the existing `noti_Attendance_Click()` — the
  same call the "Start Trip" tab already uses to punch in — so there is exactly one punch-in
  implementation, not two. **Deliberately did not revive the PRD's `noti_Attendance1` profile-photo
  warning** — that logic is dead/commented code with no live trigger condition left to port
  faithfully.
- **Deliberately not added to `HomeDashboardConfig.DEFAULT_PROFILE`**, unlike P1's two widgets.
  Per §5's own persona table, trip/map/attendance cards aren't universal (an Auditor or
  Head/feature-only user has no trips and no map profile at all) — showing them by default would
  contradict the PRD's own "Config over code" persona design. All three are marked
  `IMPLEMENTED: true` (ready the moment a real `dashboard_profile`/`dashboard_role_map` opts a role
  in) but stay invisible today, same lifecycle the codebase's own `IMPLEMENTED`-gate comment already
  anticipated for future widget types. `map_entry` and `trip_stats` each also self-gate further at
  render time regardless of profile config.
- **Verification so far**: live-injected over CDP into the real running UAT session (role 305,
  `anup.ce`) — confirmed all three render/hide correctly, and `attendance_chip`'s "Not marked yet"
  text confirmed a real successful `Get_Attendance` network round-trip against live UAT data, not a
  mocked response. Reverted the CDP test state afterward. Rebuilt from source, reinstalled, and
  re-verified against a second real logged-in session (role 364, active trip) before committing
  (`5314afd`).

---

## 12c. What P3 actually shipped (uncommitted) — `approvals_pending` deferred, not built

Two of the three P3 widgets shipped as spec'd; the third turned out to need a backend endpoint that
doesn't exist.

- **`notifications_summary`**: independent `Get_NotificationList_For_User` call (same
  endpoint/params `get_user_notifications()` in `selection.js` already uses, minus its
  `myApp.popup('.popup-notifications')` side effect — rendering the dashboard card must not
  force-open the real panel). `hasUnread` reads the same `localStorage.new_notification` flag the
  navbar bell-icon badge already uses, so the two never disagree. Tap delegates to the real
  `get_user_notifications()` — the same function the bell icon calls — so there is exactly one
  notification-panel implementation, not two.
- **`feature_links`**: the gating source is **not** the `menu_KYFF`-style element ids this table's
  own "Data" column names — those are just DOM ids. The actual flags are
  `localStorage.getItem('KYFF' | 'Chart' | 'Tech_Report' | 'Live_Alarm_Report' | 'Scoreboard')`
  (exact `'True'` string literal, copied verbatim from `selection.html`'s own `#menu_MISC` list).
  `menu_Attendance` — present in that same HTML block — was deliberately excluded: its `onchange`
  handler is empty (dead legacy "Check In/Out" toggle), and real attendance status is already
  covered by P2's `attendance_chip`.
- **`approvals_pending` — not built.** `WCF_Bulk_approval` (`common-functions.js`) is a **write-only
  submit** endpoint: it posts whatever's currently checked in a specific flow's on-screen
  `#site_list`, driven entirely by client-side checkbox state on that page. There is no server API
  anywhere in this codebase that returns a standalone "count of items awaiting approval" independent
  of opening a specific flow first. Building this widget as spec'd would mean fabricating the count
  it exists to show — against this codebase's own repeatedly-stated "never fabricate a value"
  principle (see `PROJECT.md`'s LMS section for the two shipped bugs that principle was written
  from). `HomeDashboardConfig.IMPLEMENTED` does not list `approvals_pending`; it needs a real
  backend endpoint before it can exist, not a client-side workaround.
- **Verification**: syntax-checked (`node --check`) on all touched files; on-device CDP/screenshot
  verification and a from-source rebuild+reinstall are pending device availability (this test device
  requires a physical unlock this session couldn't perform).

---

## 13. Relationship to existing dashboards

| Existing surface | Relationship to this PRD |
|---|---|
| `selection_dashboard.js` (ApexCharts) | **Optional** supervisor expand via `analytics_strip`; not loaded on home by default |
| `feature_chart.html` | Drill-down destination via `feature_links` widget |
| `EF_Custom_Reports.html` | Drill-down for tenant custom reports |
| `selection_map.js` | **Not used**; map via `trip_map` module per Trip Map PRD |
| `trip/mapui/` | Linked from `map_entry` widget |
| LMS dashboard | **Excluded** |

---

## 14. Security and privacy

| Concern | Mitigation |
|---|---|
| Dashboard shows task counts to wrong user | Data scoped to `username` / session same as existing list queries |
| SQLite reads | Read-only SELECTs; no new tables in v1 |
| Server APIs | Reuse authenticated `Webservicecall_REST` with existing session |
| Map / location | No new GPS listener; map module follows Trip Map PRD |

---

## 15. Acceptance criteria

### 15.1 Isolation and regression

- [ ] All new code under `EFSE_Js/home_dashboard/` and `css/home_dashboard.css`
- [ ] Engine blocklist files have **zero diff** in implementation PRs
- [ ] `home_dashboard_enabled: false` → identical behaviour to current production home
- [ ] Removing script includes disables dashboard with no errors on `selection.html`
- [ ] No LMS files referenced or modified

### 15.2 Functional — all roles

- [ ] Role with `dashboard_profile` → correct widgets render
- [ ] Role in `dashboard_role_map` → correct widget set
- [ ] Role with `dashboard_role_map["*"]` only → default widget set
- [ ] Unknown role with flag on → built-in default profile
- [ ] Flag off → dashboard container not in DOM / not visible

### 15.3 Widget behaviour

- [ ] `task_summary` matches module badge counts for online flows
- [ ] `upload_health` counts match `pending_status.js` labels
- [ ] `trip_status` START/END invokes same handlers as existing trip cards
- [ ] `map_entry` opens `TripSiteMap` without engine side effects
- [ ] Offline: task + upload + trip widgets render from SQLite when network unavailable

### 15.4 Performance

- [ ] Home load with dashboard enabled adds < 500ms on mid-range Android (P1 widgets only)
- [ ] No new `FusedLocationProvider` usage from dashboard module
- [ ] Analytics lazy-load does not block initial home render

---

## 16. Test plan

| Test | Steps | Expected |
|---|---|---|
| Flag off | Login with `home_dashboard_enabled: false` | No dashboard; module list unchanged |
| Default profile | Flag on, no role_map | Greeting + tasks + trip + uploads visible |
| VT profile | `dashboard_role_map` for transport role | Trip + map widgets visible |
| Offline tasks | Airplane mode, offline flow | Task counts from SQLite |
| Offline uploads | Pending items in DB | Upload widget shows correct counts |
| Start trip | Tap START on `trip_status` | Same as existing `noti_Attendance2` |
| Sync | Tap SYNC on `upload_health` | Existing upload pipeline triggered |
| Map entry | Tap OPEN MAP | Trip map opens per Trip Map PRD |
| Regression trip | Complete trip with dashboard enabled | Upload, violations unchanged |
| Supervisor analytics | Expand analytics strip | Legacy dashboard loads; home still usable |

---

## 17. Open questions

| # | Question | Owner |
|---|---|---|
| OQ-1 | Collapse `module_list` by default when dashboard on, or always show both? | Product |
| OQ-2 | Ship `dashboard_role_map` in `list_json` or separate login config download? | Backend |
| OQ-3 | Overdue task definition — server status threshold or client date field? | Product + Backend |
| OQ-4 | Enable legacy `ischart_enabled` for supervisors separately from this module? | Product |
| OQ-5 | Per-widget refresh intervals or single global `refresh_interval_sec`? | Engineering |
| OQ-6 | Attendance widget offline behaviour — hide or show "last synced"? | Product |

---

## 18. Success metrics

| Metric | Target |
|---|---|
| Time to see pending work on home | < 3 seconds after login |
| Upload queue visibility | 100% of users with pending uploads see count without navigating |
| Trip start from home | ≤ 2 taps (same as today) |
| Regression incidents | 0 engine/upload regressions in QA |
| Tenant rollout | Feature flag enables per-tenant staged rollout |

---

## 19. Summary

| Item | Decision |
|---|---|
| **What** | Configurable home operations dashboard on `selection.html` |
| **Who** | All field roles via `dashboard_profile` / `dashboard_role_map` |
| **How** | Isolated `home_dashboard/` JS module; read-only data; delegate actions |
| **LMS** | Excluded |
| **Trip map** | Separate PRD; linked via `map_entry` widget |
| **Legacy analytics** | Optional supervisor expand; not default home load |
| **Engine** | Untouched |

---

## Appendix A — Default built-in profile (no server config)

```json
{
  "layout": "stack",
  "refresh_interval_sec": 60,
  "widgets": [
    { "type": "greeting_header" },
    { "type": "task_summary", "show_per_flow_breakdown": false },
    { "type": "trip_status" },
    { "type": "upload_health", "show_sync_button": true }
  ]
}
```

## Appendix B — Example VT `dashboard_role_map` entry

```json
{
  "widgets": [
    { "type": "greeting_header" },
    { "type": "trip_status" },
    { "type": "trip_stats" },
    {
      "type": "map_entry",
      "label": "View nearby sites & route"
    },
    { "type": "upload_health", "show_sync_button": true }
  ]
}
```

## Appendix C — Engine blocklist (CI guard)

Kept in sync with `.git/hooks/pre-commit`'s actual `blocklist` array (the real enforcement — there
is no CI in this repo) rather than restated from memory; verify against that file directly if it
diverges from here again. The hook fires whenever a commit touches both this list and
`EFSE_Js/home_dashboard/` (or `trip/mapui/` / `EFSE_Js/trip_map/`, shared with the Trip & Site Map
guard).

```
newfused.java
loc_change.java
TripPlugin.java
TripMapUi.java
AutoTripStopService.java
SpeedViolation.java
trip/SpeedViolation.java
activity_recognize.java
TripUploadNew.java
f_upload_new_structure.java
navigation.java
plugins/SiteRoutePlugin.java
trip/TripBackgroundMapActivity.java
GeofenceDownlaod.java
GeofencTrackingMapActivity.java
geofencenew/GeofenceTrasitionService.java
geofencenew/GeofenceTrasitionServicenew.java
geofencenew/GeoFenceDraw.java
```

**Known gap, not yet fixed:** `MainActivity.java` is not in the hook's array despite being exactly
the kind of file this module must never touch (and the file where this session's root-detection
false-positive fix landed, `f1f1c8d` — see `PROJECT.md`). Worth adding in a follow-up, not done here
since it's outside this pass's scope.
