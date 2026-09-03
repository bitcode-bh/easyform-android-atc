/* ============================================================================
   LmsBackend — the single integration seam for server-side learner progress.

   WHY THIS EXISTS
   ---------------
   The deployed skill listing returns cumulative Watch_Video_Time clock values;
   newer environments may additionally return Watch_Seconds / Resume_Position.
   Every read of "how far has this lesson been watched" goes through this module
   so server history and current-device progress can be reconciled consistently:

       server sends the fields  ->  server value wins, automatically
       server does not          ->  local measurement is used, exactly as today

   PLUGGING IN THE BACKEND
   -----------------------
   Nothing to switch on. Capability is detected from real responses
   (see ingestSkillRows): the first listing that carries Watch_Video_Time,
   Watch_Seconds, or Resume_Position flips that capability on for the session.
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

    // API video times are clock strings (MM:SS or HH:MM:SS), whereas newer
    // environments may expose numeric second fields. Normalize both forms at
    // the boundary so every Dashboard/Modules consumer works in seconds.
    function clockSeconds(value) {
        var numeric = num(value);
        if (numeric !== null && String(value).indexOf(':') === -1) return numeric;
        if (value === null || value === undefined) return null;
        var text = String(value).trim();
        if (!text) return null;
        var parts = text.split(':');
        if (parts.length !== 2 && parts.length !== 3) return null;
        var total = 0;
        for (var i = 0; i < parts.length; i++) {
            if (!/^\d+$/.test(parts[i])) return null;
            total = (total * 60) + Number(parts[i]);
        }
        return isFinite(total) && total >= 0 ? total : null;
    }

    // Feed every skill-listing response through here. Rows that predate the
    // backend work simply carry none of these fields and are ignored.
    function ingestSkillRows(rows) {
        if (!rows || !rows.length) return;
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            if (!row || row.Skill_Id == null) continue;

            var id = String(row.Skill_Id);
            // Watch_Video_Time is the field returned by the currently deployed
            // skill API. Prefer explicit seconds when both versions exist.
            var watch = num(row.Watch_Seconds);
            if (watch === null) watch = clockSeconds(row.Watch_Video_Time);
            var resume = num(row.Resume_Position);
            if (watch === null && resume === null) continue;

            var entry = serverProgress[id] || (serverProgress[id] = {});
            if (watch !== null) {
                // Repeated/background responses must never roll a newer local
                // snapshot backwards or add another copy of the same lesson.
                entry.watchSeconds = entry.watchSeconds == null
                    ? watch : Math.max(entry.watchSeconds, watch);
                caps.watch_seconds = true;
            }
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
