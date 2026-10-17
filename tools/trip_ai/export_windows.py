#!/usr/bin/env python3
"""
Export MWFM's logged motion windows (trip_motion_features) from a connected test phone to JSON
Lines for train_forest.py. Read-only: it runs one SELECT through the app's own SQL plugin.

Needs a debug build with MWFM open (its WebView must be debuggable), adb, and the
websocket-client package. Field phones need a server upload instead.

    python3 export_windows.py --serial ZA223MDVR8 --out windows.jsonl
"""
import argparse
import json
import subprocess
import urllib.request

import websocket

PACKAGE = "com.easyform.atcpv"
PORT = 9333


def adb(serial, *args):
    cmd = ["adb"] + (["-s", serial] if serial else []) + list(args)
    return subprocess.run(cmd, capture_output=True, text=True, check=True).stdout.strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--serial", default=None)
    ap.add_argument("--out", required=True)
    ap.add_argument("--since-ms", type=int, default=0)
    a = ap.parse_args()

    pid = adb(a.serial, "shell", "pidof", PACKAGE)
    if not pid:
        raise SystemExit("MWFM isn't running on the phone; open it first")
    adb(a.serial, "forward", "tcp:%d" % PORT, "localabstract:webview_devtools_remote_%s" % pid)
    tabs = [t for t in json.load(urllib.request.urlopen("http://localhost:%d/json" % PORT)) if t["type"] == "page"]
    if not tabs:
        raise SystemExit("no MWFM page found; bring MWFM to the front")

    query = ("select tid, start_ms, dur_ms, vehicle_type, context, bt_audio, features "
             "from trip_motion_features where start_ms >= %d order by start_ms" % a.since_ms)
    expr = ("new Promise(function(r){cordova.exec(function(e){r(e)},function(e){r('ERR '+e)},"
            "'SqlitePlugin','showValues',[{data:%s,p:'1'}]);})" % json.dumps(query))
    rows = None
    for t in tabs:
        try:
            ws = websocket.create_connection(t["webSocketDebuggerUrl"], suppress_origin=True, timeout=60)
            ws.send(json.dumps({"id": 1, "method": "Runtime.evaluate",
                                "params": {"expression": expr, "returnByValue": True, "awaitPromise": True}}))
            while True:
                r = json.loads(ws.recv())
                if r.get("id") == 1:
                    rows = r["result"]["result"].get("value")
                    break
            break
        except Exception:
            continue
    if not rows or str(rows).startswith("ERR"):
        raise SystemExit("query failed: %s" % rows)

    n = 0
    with open(a.out, "w") as f:
        for row in json.loads(rows):
            try:
                feats = json.loads(row.get("features") or "{}")
            except ValueError:
                continue
            f.write(json.dumps({
                "tid": row.get("tid"), "start_ms": int(row.get("start_ms") or 0),
                "vehicle_type": row.get("vehicle_type"), "context": row.get("context"),
                "bt_audio": row.get("bt_audio") == "1", "features": feats}) + "\n")
            n += 1
    print("exported %d windows to %s" % (n, a.out))


if __name__ == "__main__":
    main()
