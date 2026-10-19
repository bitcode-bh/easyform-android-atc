#!/usr/bin/env python3
"""Runs the form-frame adapter against a fixture form in real Chrome, with the file-access
settings Cordova's WebView uses. Needs Google Chrome and websocket-client.
  python3 tools/ui_phase3/frame-page-check.py
"""
import json, os, socket, subprocess, sys, tempfile, time, urllib.request
import websocket

CHROME = os.environ.get('CHROME_BIN', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
LAB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frame-page-lab')

def free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p

def main():
    port = free_port(); profile = tempfile.mkdtemp(prefix='frame-lab-')
    proc = subprocess.Popen([CHROME, '--headless=new', '--remote-debugging-port=%d' % port, '--user-data-dir=' + profile,
                             '--no-first-run', '--disable-gpu', '--allow-file-access-from-files', '--disable-web-security', 'about:blank'],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try: urllib.request.urlopen('http://127.0.0.1:%d/json/version' % port, timeout=1); break
            except Exception: time.sleep(0.2)
        tab = json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:%d/json/new?about:blank' % port, method='PUT')))
        ws = websocket.create_connection(tab['webSocketDebuggerUrl'], suppress_origin=True, timeout=30)
        n = [0]
        def call(method, params=None):
            n[0] += 1; mine = n[0]; ws.send(json.dumps({'id': mine, 'method': method, 'params': params or {}}))
            while True:
                r = json.loads(ws.recv())
                if r.get('id') == mine: return r
        call('Page.enable'); call('Runtime.enable')
        call('Page.navigate', {'url': 'file://' + os.path.join(LAB, 'shell_stub.html')}); time.sleep(1.2)
        r = call('Runtime.evaluate', {'expression': open(os.path.join(LAB, 'scenario.js')).read(), 'returnByValue': True, 'awaitPromise': True})
        value = r['result'].get('result', {}).get('value')
        if not value:
            print('scenario failed:', json.dumps(r['result'])[:600]); return 1
        got = json.loads(value)
    finally:
        proc.terminate()
    expect = {
        'registeredBoth': 'EF_Custom_Reports.html,EF_User_List.html,EF_User_Update.html,LMS_Dashboard.html,change_password.html,download_status.html,f7_faq.html,f7_flowchart.html,f7_myprofile.html,f7_navbar.html,f7_privacy_policy.html,f7_safety_passport.html,feature_chart.html,feature_filter.html,pending_status.html,selection.html,support_page.html,viewcustomerlist_on.html,viewsitedata.html,viewsitedata_task.html',
        'supports': True, 'cordovaShared': True, 'pageOwnCordovaStripped': True, 'pageDependencyLoaded': True,
        'nativeObjectShared': True, 'pathSeen': 'viewsitedata.html', 'search': '?task_id=7', 'deviceReady': True, 'execResult': 'native:hello',
        'onBackHandled': True, 'backSeen': 1, 'navigations': '[["viewsitelist_pm_grouplist.html","back"]]',
        'firstOpenedWith': 'fresh', 'firstAnswer': 'typed-in-viewsitedata.html',
        'secondOpenedWith': 'fresh', 'secondIsolated': True, 'sharedStorage': 'v', 'afterDisposeNoFrames': 0,
    }
    failed = [k for k, v in expect.items() if got.get(k) != v]
    prepared = json.loads(got['prepare'])
    prep_ok = prepared == ['<p>x</p>', '', '', '<script src="EFSE_Js/not_cordova.js"></script>', '<script src="cordova-extra.js"></script>']
    for k, v in expect.items(): print(('ok   ' if k not in failed else 'FAIL ') + k + ' = ' + repr(got.get(k)))
    print(('ok   ' if prep_ok else 'FAIL ') + 'prepare strips only cordova.js / cordova_plugins.js tags')
    if failed or not prep_ok:
        print('expected differences:', {k: (expect[k], got.get(k)) for k in failed}); return 1
    print('frame page adapter: all checks passed'); return 0

if __name__ == '__main__':
    sys.exit(main())
