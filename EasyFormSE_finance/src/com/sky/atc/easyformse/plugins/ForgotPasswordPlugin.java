package com.sky.atc.easyformse.plugins;


import android.widget.Toast;

import com.sky.atc.easyformse.NewWebservicesCallEasyform;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.sqlitewraper;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.LinkedHashMap;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Forgot password plugin
@StringFogIgnore
public class ForgotPasswordPlugin extends CordovaPlugin {


    private CallbackContext callbackContext;
    private static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL);
    private final String METHOD_FORGOT = "WCF_ForgotPassword";


    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;
        try {
                String name = args.getJSONObject(0).getString("username");
                String email = args.getJSONObject(0).getString("email");

                if (name != null || email != null) {

                    JSONObject data = new JSONObject();
                    data.put("username", name);
                    data.put("email", email);

                    String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequest(data, WCFURL, METHOD_FORGOT);

                    if (restext == null) {
                        this.callbackContext.error("Error");
                    } else {
                        LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<>();
                        lHashMap.put("responseText", restext);

                        ArrayList<JSONObject> list = new ArrayList<>();
                        JSONObject json = null;
                        json = new JSONObject(lHashMap);
                        list.add(json);

                        this.callbackContext.success(list.toString());
                    }
                } else {
                    Toast.makeText(sqlitewraper.context, "Invalid name or Email", Toast.LENGTH_SHORT).show();
                }
        } catch (Exception e) {
            this.callbackContext.error(e.getMessage());
        }
        return true;
    }
}
