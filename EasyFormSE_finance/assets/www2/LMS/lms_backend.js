/* ============================================================================
   LmsBackend — the single integration seam for server-side learner progress.

   WHY THIS EXISTS
   ---------------
   Watch time and resume positions are currently measured on the device and
   kept in localStorage, so they do not survive an app-data clear, a reinstall,
   or a change of handset, and they can never appear in a server-side report.
   The fix is server-side (see LMS_API_SPEC.md): LMS_Skill_VideoLog_Master
   gains Watch_Seconds / Resume_Position, and the skill listing returns them.

   That backend work is NOT scheduled yet. Rather than leave the client needing
   a rewrite later, every read of "how far has this lesson been watched" now
   goes through this module. It is entirely INERT until the server actually
   sends the fields:

       server sends the fields  ->  server value wins, automatically
       server does not          ->  local measurement is used, exactly as today

   PLUGGING IN THE BACKEND
   -----------------------
   Nothing to switch on. Capability is detected from real responses
   (see ingestSkillRows): the first listing that carries a numeric
   Watch_Seconds or Resume_Position flips that capability on for the session.
   No flag, no release, no migration step.

   DELIBERATELY NOT DONE HERE
   --------------------------
   A resume position is never DERIVED from the Progress percentage
   (`Progress% x duration`). That reconstructs a playhead the learner never
   actually reached, and this codebase treats an unknown value as unknown
   rather than inventing a plausible one. If the server does not send
   Resume_Position, this module reports null and callers fall back to the
   real local measurement.
   ========================================================================== */
var LmsBackend = (function () {
    'use strict';

    // Per-session capability detection. Not persisted: it is derived from
    // whatever the current server actually returns, so pointing the app at a
    // different environment can never leave a stale "supported" flag behind.
    var caps = { watch_seconds: false, resume_position: false };

    // Skill_Id -> { watchSeconds, resumePosition } as reported by the server.
    var serverProgress = {};

    function num(value) {
        if (value === null || value === undefined || value === '') return null;
        var n = Number(value);
        return isFinite(n) && n >= 0 ? n : null;
    }

    // Feed every skill-listing response through here. Rows that predate the
    // backend work simply carry none of these fields and are ignored.
    function ingestSkillRows(rows) {
        if (!rows || !rows.length) return;
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            if (!row || row.Skill_Id == null) continue;

            var id = String(row.Skill_Id);
            var watch = num(row.Watch_Seconds);
            var resume = num(row.Resume_Position);
            if (watch === null && resume === null) continue;

            var entry = serverProgress[id] || (serverProgress[id] = {});
            if (watch !== null) { entry.watchSeconds = watch; caps.watch_seconds = true; }
            if (resume !== null) { entry.resumePosition = resume; caps.resume_position = true; }
        }
    }

    function supports(capability) {
        return !!caps[capability];
    }

    // Seconds of this lesson the SERVER says have been watched, or null when
    // the server does not track it. Never a local value — callers decide the
    // fallback, so the two sources can never be silently conflated.
    function watchSeconds(skillId) {
        var entry = serverProgress[String(skillId)];
        return (entry && entry.watchSeconds != null) ? entry.watchSeconds : null;
    }

    // Playhead position to resume from, as recorded by the server, or null.
    function resumeSeconds(skillId) {
        var entry = serverProgress[String(skillId)];
        return (entry && entry.resumePosition != null) ? entry.resumePosition : null;
    }

    // Cleared on logout / user switch so one learner's server-reported
    // progress can never be shown to the next person on a shared device.
    function reset() {
        caps = { watch_seconds: false, resume_position: false };
        serverProgress = {};
    }

    // Diagnostics for on-device verification (CDP), not used by app logic.
    // Returns a COPY of caps: handing out the live object made a "before"
    // snapshot mutate when a later call flipped a capability, which reads as
    // the capability having been on all along.
    function debugState() {
        return {
            caps: { watch_seconds: caps.watch_seconds, resume_position: caps.resume_position },
            trackedSkills: Object.keys(serverProgress).length
        };
    }

    return {
        ingestSkillRows: ingestSkillRows,
        supports: supports,
        watchSeconds: watchSeconds,
        resumeSeconds: resumeSeconds,
        reset: reset,
        debugState: debugState
    };
})();
