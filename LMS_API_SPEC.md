# LMS — backend requirements for a production-grade learning record

**Audience:** backend developer for the LMS API (`https://<host>/LMS/api/`).

**Context:** the LMS currently keeps a large amount of business-critical learner data **only on the device**, in `localStorage`. That data is destroyed by *Clear app data*, reinstall, or moving to a new phone, and the server can never report on it. Separately, every graded submit is fire-and-forget: a network blip during submission permanently loses a completed assessment.

This document lists what the server needs so that **no learner record depends on a device**. Every field is additive — nothing here breaks an existing client.

---

## Priority summary

| # | Change | Why | Required? |
|---|---|---|---|
| **P0** | Idempotent submits (`Attempt_Guid`) | Completed assessments are silently lost today. Cannot be fixed on the client alone. | **Yes — blocking** |
| **P1** | Watch time + resume position fields | Watch history and resume points die with the device | **Yes** |
| **P1** | Micro-Learning `Is_Correct` | No server-side ML score can exist without it | **Yes** |
| **P2** | Server-authoritative dashboard aggregates | KPIs are per-device and read zero after reinstall | **Yes, after P0/P1** |
| **P3** | Confirm `Video_Time` always populated | Removes a per-video metadata download | Optimisation |

**Recommendation: P0, P1 and P2 are all genuinely required** for this to behave as an organizational product. P0 is a correctness/data-loss bug and should ship first and alone if scheduling forces a choice. P3 is a performance win, not correctness.

---

# P0 — Idempotent submits (blocking)

### The problem

These endpoints are called **without any retry or queue**. If the request fails, the answers are gone and the learner must retake the assessment:

- `LMS_InsertUpdateDelete_Assessment_Question_Log_Master`
- `LMS_InsertUpdateDelete_Skill_Question_Log_Master`
- `LMS_InsertUpdateDelete_Micro_Learning_Question_Log_Master`
- `LMS_InsertUpdate_User_Assessment_Rating`

The app already has a durable SQLite-backed offline queue, but **it cannot safely be used for submits until the server is idempotent** — replaying a queued submit would otherwise create duplicate attempts or double-count a score. That is worse than the current behaviour, which is why this must be fixed server-side first.

### What is needed

Accept a client-generated `Attempt_Guid` (UUID) on each of the four endpoints and **ignore any request whose `Attempt_Guid` has already been processed**, returning the original result rather than inserting again.

```json
[
  {
    "Attempt_Guid": "9f2c1e84-5b3a-4c77-9a1e-2d6f0b7c8e11",
    "Assessment_Id": "42",
    "User_Id": "41127",
    "Answers": [
      { "Assessment_Que_Id": "101", "Ans": "To protect a network from unauthorized access" },
      { "Assessment_Que_Id": "102", "Ans": "Encapsulation" }
    ]
  }
]
```

Response on a **replay** must be a success, not an error — the client must be able to treat it as "already recorded" and clear the queue entry:

```json
[{ "status": 1, "message": "Success", "data": "Success", "Duplicate": "1" }]
```

**Storage:** unique index on `Attempt_Guid`. Retain the keys long enough to cover offline replay — 90 days is ample.

**Please also confirm:** is a learner allowed to **retake** an assessment? If so, each retake is a new `Attempt_Guid` and the server should keep attempt history (attempt number, score, timestamp) rather than overwriting. The current `LMS_Select_User_Assessment_Rating` returns a single row with a `Count` field, which suggests attempts are counted but not individually retained — please clarify, because the UI needs to know which attempt a score belongs to.

---

# P1 — Watch time, resume position, duration

### What the device measures and cannot persist

| Metric | Meaning | Local key today |
|---|---|---|
| Watch seconds per lesson | real wall-clock seconds played | `lms_watch_seconds_skills_by_item` |
| Watch seconds per module | aggregated per module | `lms_watch_seconds_modules_by_item` |
| Daily buckets | per-category per-day totals (trend charts) | `lms_watch_seconds_*_daily` |
| Resume position | exact `currentTime` to resume from | `video_progress_<Skill_Id>` |
| Video duration | true length of each video | `lms_video_durations_*` |

### Change: extend `LMS_Skill_VideoLog_Master` (write)

This endpoint already exists and already stores `Progress` (percent). Add four fields:

```json
[
  {
    "Flag": "INSERT",
    "Skill_Id": "18",
    "Module_Id": "19",
    "Progress": "64",
    "User_ID": "41127",
    "User_Name": "anup.ce",
    "Circle": "TESTCIRCLE",

    "Watch_Seconds": 42.5,
    "Resume_Position": 8.63,
    "Video_Duration": 13.5,
    "Session_Date": "2026-08-10"
  }
]
```

| Field | Type | Server handling |
|---|---|---|
| `Watch_Seconds` | decimal | **ADD** to the running total for this user+skill (client sends only the newly-watched seconds) |
| `Resume_Position` | decimal | **OVERWRITE** — latest wins |
| `Video_Duration` | decimal | overwrite; lets you populate `Video_Time` centrally |
| `Session_Date` | `YYYY-MM-DD` | device-local date, for the daily trend buckets |

**Two rules the server must enforce:**

1. **`Progress` must never decrease** — `Progress = MAX(existing, incoming)`. A learner who reaches 80%, then reopens and closes at 5%, must stay at 80. *The client cannot be the guardian of this: on a wiped device it has no memory of the previous 80% and would post 5.* This is precisely why the client-side write is currently **not** being expanded — see "Client status" below.
2. **`Watch_Seconds` accumulates** — 30s then 20s must total 50s, not 20s.

This should be an **upsert on (User_Id, Skill_Id)**, not an append-only log — unless you also want a raw session history table, which would be valuable for "time spent per user per day" reporting.

### Change: return them on read

Preferred — add to each row of `LMS_Select_Skill_Master_RoleWise`:

```json
{
  "Skill_Id": "18",
  "Progress": "64.00",
  "Video_Time": "00:13",

  "Watch_Seconds": "42.5",
  "Resume_Position": "8.63",
  "Last_Watched": "2026-08-10 16:24:54"
}
```

Alternative if you would rather not widen the listing: a dedicated `LMS_Select_Skill_VideoLog_Master` taking `{ "User_Id": "41127" }` and returning one row per watched skill.

> **`Resume_Position` must be stored and returned as a real value.** It must not be reconstructed from the percentage — `Progress% × duration` gives a position the learner never actually reached. A client-side implementation doing exactly that was written and then deliberately removed for this reason.

---

# P1 — Micro-Learning correctness

`LMS_InsertUpdateDelete_Micro_Learning_Question_Log_Master` currently stores only the chosen answer **text**, so no score can ever be computed server-side. Correctness is already known on the device (it is compared against `valid_ans` to colour the answer), so sending it is free:

```json
[
  {
    "Ml_Id": "12",
    "Ml_Que_Id": "31",
    "User_Id": "41127",
    "Ans": "To protect a network from unauthorized access",
    "Is_Correct": "1",
    "Attempt_Guid": "…"
  }
]
```

And watch seconds on `LMS_InsertUpdateDelete_Micro_Learning_User_Activity`:

```json
[
  { "Ml_Id": "12", "User_Id": "41127", "Watched": "1", "Liked": "0",
    "Watch_Seconds": 18.2, "Session_Date": "2026-08-10" }
]
```

Returned by `LMS_Select_Micro_Learning_User_Activity`:

```json
{ "Ml_Id": "12", "Watched": "1", "Liked": "0",
  "Watch_Seconds": "18.2", "Quiz_Correct": "3", "Quiz_Total": "4" }
```

---

# P2 — Server-authoritative dashboard

The dashboard currently derives its KPIs from device-local counters, so they are per-device rather than per-user, and read **zero** on a reinstall — while the server's real scores sit unused. Once P1 is stored, please return the aggregates on `LMS_Select_Dashboard`:

```json
{
  "Summary": {
    "User_ID": "41127",
    "Total_Watch_Seconds": "1284.5",
    "Modules_Watch_Seconds": "980.0",
    "Assessments_Watch_Seconds": "120.5",
    "MicroLearning_Watch_Seconds": "184.0",
    "Modules_Completed": "1",
    "Modules_Total": "3",
    "ML_Quiz_Correct": "9",
    "ML_Quiz_Total": "12",
    "Daily": [
      { "Date": "2026-08-09", "Watch_Seconds": "420.0" },
      { "Date": "2026-08-10", "Watch_Seconds": "864.5" }
    ]
  }
}
```

`Daily` powers the trend charts — please return **at least the last 30 days**, omitting days with no activity.

---

# Suggested storage

```sql
CREATE TABLE LMS_Skill_Watch_Log (
    User_Id           INT           NOT NULL,
    Skill_Id          INT           NOT NULL,
    Module_Id         INT           NULL,
    Watch_Seconds     DECIMAL(10,2) NOT NULL DEFAULT 0,  -- accumulated
    Resume_Position   DECIMAL(10,2) NOT NULL DEFAULT 0,  -- latest wins
    Progress          DECIMAL(5,2)  NOT NULL DEFAULT 0,  -- high-water mark
    Video_Duration    DECIMAL(10,2) NULL,
    Last_Watched      DATETIME      NULL,
    PRIMARY KEY (User_Id, Skill_Id)
);

CREATE TABLE LMS_Watch_Daily (
    User_Id       INT         NOT NULL,
    Activity_Date DATE        NOT NULL,
    Category      VARCHAR(20) NOT NULL,   -- 'modules' | 'assessments' | 'ml'
    Watch_Seconds DECIMAL(10,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (User_Id, Activity_Date, Category)
);

CREATE TABLE LMS_Submit_Idempotency (
    Attempt_Guid  CHAR(36)   NOT NULL PRIMARY KEY,
    User_Id       INT        NOT NULL,
    Endpoint      VARCHAR(80) NOT NULL,
    Processed_At  DATETIME   NOT NULL,
    Response_Json TEXT       NULL          -- replay returns the original result
);
```

---

# Compatibility rules

- All new **request** fields are optional — an older app build that omits them must keep working.
- All new **response** fields are additive — the current app ignores unknown fields, so the backend can ship before the app.
- Units are **seconds as decimals** throughout, except `Video_Time` which stays `mm:ss` for backward compatibility.
- Dates are device-local `YYYY-MM-DD`. Say the word if you prefer UTC and the app will send UTC.

---

# Client status (what the app does today)

- **Not implemented pending this work:** watch-time upload, resume-position upload, queued submits. A client-side version of the first two was written during this investigation and **deliberately reverted**, because without server-side `MAX(Progress)` enforcement it could *regress* a learner's stored progress on a wiped device, and because reconstructing a resume position from a percentage is an estimate rather than a measurement.
- **Already shipped:** the video log posts real `Progress` on lesson close, and the SQLite offline queue exists and is proven on that endpoint — so wiring the remaining submits through it is a small client change once `Attempt_Guid` is supported.

# Open questions

1. Is `Video_Time` reliably populated for **every** skill and micro-learning video? It returned `"00:13"` in testing. If it is always present, the app can stop downloading each video's metadata purely to measure its length.
2. Are assessment **retakes** allowed, and should attempt history be retained per attempt? (See P0.)
3. Should `Watch_Seconds` be capped at `Video_Duration`? Recommend **no cap** — re-watching is legitimate, and >100% is meaningful signal.
4. If the same learner uses **two devices**, last-write-wins on `Resume_Position` is assumed. Confirm that is acceptable, or specify a conflict rule.
