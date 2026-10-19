#!/usr/bin/env python3
"""Bounded, read-only WebView timing observation. No input, screenshots or writes on phone.

Use an existing adb DevTools forward, then navigate normally on the phone.
Requires websocket-client. Only sanitized timing/route/row-count evidence is saved.
"""
import argparse
import datetime
import json
from pathlib import Path
import time
import urllib.parse
import urllib.request

import websocket


CATEGORIES = [
    "devtools.timeline", "loading", "blink.user_timing",
    "disabled-by-default-devtools.timeline",
    "disabled-by-default-devtools.timeline.frame", "input", "latencyInfo",
    "benchmark",
]
SUMMARY = """JSON.stringify((function () {
    var visible = function (el) {
        var s = getComputedStyle(el), r = el.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) !== 0 &&
            r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 &&
            r.left < innerWidth && r.top < innerHeight;
    };
    var rows = {};
    ['site_list', 'checksheet_list', 'cust_list', 'ul_flow_list', 'data_form'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) rows[id] = {children: el.children.length, visible: visible(el)};
    });
    return {
        page: location.pathname.split('/').pop(), timeOrigin: performance.timeOrigin,
        now: performance.now(), visibility: document.visibilityState,
        readyState: document.readyState, rows: rows,
        homeRevealMs: typeof window.homeRevealMs === 'number' ? window.homeRevealMs : null,
        overlays: Array.from(document.querySelectorAll(
            '.popup,.modal,.dialog,.actions-modal,.popover,.panel.active'
        )).filter(visible).map(function (el) { return el.className; }),
        navigation: performance.getEntriesByType('navigation').map(function (e) {
            return {type: e.type, domInteractive: e.domInteractive,
                domContentLoaded: e.domContentLoadedEventEnd, load: e.loadEventEnd};
        }),
        paint: performance.getEntriesByType('paint').map(function (e) {
            return {name: e.name, startTime: e.startTime};
        })
    };
})())"""


def page_name(url):
    return urllib.parse.urlsplit(url).path.rsplit("/", 1)[-1]


def clean_event(event):
    out = {k: event[k] for k in ("name", "cat", "ph", "ts", "dur", "pid", "tid", "id", "id2") if k in event}
    data = event.get("args", {}).get("data", {})
    if isinstance(data, dict):
        safe = {k: data[k] for k in (
            "type", "frame", "frameId", "navigationId", "interactionId", "timeStamp",
            "processingStart", "processingEnd", "duration", "inputType", "eventType"
        ) if k in data and isinstance(data[k], (str, int, float, bool))}
        for key in ("url", "documentLoaderURL"):
            if isinstance(data.get(key), str):
                safe[key] = page_name(data[key])
        if safe:
            out["data"] = safe
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=9333)
    parser.add_argument("--seconds", type=int, default=180)
    parser.add_argument("--out", required=True)
    parser.add_argument("--target", help="Exact DevTools target ID when MWFM has multiple native WebViews")
    args = parser.parse_args()
    if not 1 <= args.seconds <= 600:
        parser.error("--seconds must be between 1 and 600")
    output = Path(args.out)
    if output.exists():
        parser.error("refusing to overwrite existing evidence")
    pages = json.load(urllib.request.urlopen(f"http://127.0.0.1:{args.port}/json", timeout=5))
    pages = [p for p in pages if p.get("type") == "page" and
             p.get("url", "").startswith("file:///android_asset/www2/")]
    if args.target:
        pages = [p for p in pages if p.get("id") == args.target]
    if len(pages) != 1:
        raise SystemExit("Expected exactly one MWFM www2 page; inspect targets before continuing")
    ws = websocket.create_connection(pages[0]["webSocketDebuggerUrl"], suppress_origin=True, timeout=0.5)
    counter = 0
    pending = {}

    def send(method, params=None):
        nonlocal counter
        counter += 1
        pending[counter] = method
        ws.send(json.dumps({"id": counter, "method": method, "params": params or {}}))

    evidence = {"startedUtc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "categories": CATEGORIES, "screenshots": False,
                "notes": "Read-only runtime summaries and sanitized trace; no input dispatched.",
                "trace": [], "observations": [], "navigationEvents": [], "errors": []}
    send("Page.enable")
    send("Tracing.start", {"transferMode": "ReportEvents", "traceConfig": {
        "recordMode": "recordContinuously", "includedCategories": CATEGORIES,
        "excludedCategories": ["disabled-by-default-devtools.screenshot",
                               "disabled-by-default-devtools.timeline.picture",
                               "disabled-by-default-devtools.timeline.layers"]}})
    deadline = time.monotonic() + args.seconds
    next_summary = 0
    ending = False
    last = None
    try:
        while True:
            now = time.monotonic()
            if now >= deadline and not ending:
                send("Tracing.end")
                ending = True
                deadline = now + 15
            elif ending and now >= deadline:
                evidence["errors"].append("Timed out waiting for tracingComplete")
                break
            if not ending and now >= next_summary and "Runtime.evaluate" not in pending.values():
                send("Runtime.evaluate", {"expression": SUMMARY, "returnByValue": True})
                next_summary = now + 0.5
            try:
                message = json.loads(ws.recv())
            except websocket.WebSocketTimeoutException:
                continue
            method = message.get("method")
            if method == "Tracing.dataCollected":
                evidence["trace"].extend(clean_event(e) for e in message["params"]["value"])
            elif method == "Tracing.tracingComplete":
                break
            elif method == "Page.frameNavigated":
                frame = message["params"]["frame"]
                if not frame.get("parentId"):
                    route = page_name(frame.get("url", ""))
                    evidence["navigationEvents"].append({"page": route, "receivedUtc": datetime.datetime.now(datetime.timezone.utc).isoformat()})
                    print("Navigation:", route, flush=True)
            elif message.get("id") in pending:
                sent = pending.pop(message["id"])
                if "error" in message:
                    evidence["errors"].append({"method": sent, "code": message["error"].get("code")})
                elif sent == "Runtime.evaluate":
                    value = message.get("result", {}).get("result", {}).get("value")
                    if value:
                        summary = json.loads(value)
                        state = {k: v for k, v in summary.items() if k != "now"}
                        if state != last:
                            evidence["observations"].append(summary)
                            last = state
                            print("Observed:", summary["page"], summary["readyState"], summary["rows"], flush=True)
    finally:
        ws.close()
        evidence["finishedUtc"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(evidence, separators=(",", ":")) + "\n")
        print(f"Saved {len(evidence['trace'])} sanitized timing events to {output}", flush=True)


if __name__ == "__main__":
    main()
