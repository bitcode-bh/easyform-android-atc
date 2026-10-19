package com.sky.atc.easyformse;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONObject;

/** The pages' named data calls: {@code cordova.exec(ok, fail, 'DataBridge', 'query', [{name, args}])}. */
public class DataBridge extends CordovaPlugin {
    @Override
    public boolean execute(String action, CordovaArgs args, final CallbackContext callbackContext) throws org.json.JSONException {
        if (!"query".equals(action)) return false;
        final JSONObject request = args.getJSONObject(0);
        cordova.getThreadPool().execute(new Runnable() {
            @Override
            public void run() {
                try {
                    callbackContext.success(DataQueries.run(sqlitewraper.getDatabase(), request).toString());
                } catch (IllegalArgumentException invalid) {
                    callbackContext.error("data-invalid");
                } catch (Exception error) {
                    // Never expose SQL, values or account identifiers in a popup or log.
                    callbackContext.error("data-unavailable");
                }
            }
        });
        return true;
    }
}
