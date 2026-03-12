package com.sky.atc.easyformse;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;


import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;

import com.sky.atc.easyformse.utils.LogUtils;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 * @author Tommy-Carlos Williams, Huge chunks lifted/adapted from the
 * NextworkManager core PhoneGap plugin
 */
//Return application version to UI
@StringFogIgnore
public class version_plug extends CordovaPlugin {

    public static final String TYPE_NONE = "NONE";
    private static final String LOG_TAG = "PhoneListener";

    private String phoneListenerCallbackId;

    BroadcastReceiver receiver;

    public CallbackContext callbackContext;
    SharedPreferences pref;
    Editor editor;

    @Override
    public boolean execute(String action, JSONArray args,
                           CallbackContext callbackContext) throws JSONException {
        try {

            // //--- check internet is on or off ---////////
            boolean connected = false;
            ConnectivityManager connectivityManager = (ConnectivityManager) this.cordova
                    .getActivity().getSystemService(
                            Context.CONNECTIVITY_SERVICE);
            int internet;
            if (connectivityManager.getNetworkInfo(
                    ConnectivityManager.TYPE_MOBILE).getState() == NetworkInfo.State.CONNECTED
                    || connectivityManager.getNetworkInfo(
                    ConnectivityManager.TYPE_WIFI).getState() == NetworkInfo.State.CONNECTED) {
                // we are connected to a network
                connected = true;
                internet = 1;
            } else {
                // we are not connected to a network
                connected = false;
                internet = 0;
            }
            // ////////////-----------/////////


            this.callbackContext = callbackContext;
            LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<String, Object>();
            lHashMap.put("version", BuildConfig.VERSION_NAME);
            lHashMap.put("internet", internet);

            lHashMap.put("url", sqlitewraper.context.getResources().getString(R.string.App_URL) + "/Services/");
            lHashMap.put("videourl", sqlitewraper.context.getResources().getString(R.string.Video_URL));
            lHashMap.put("wcfurl", sqlitewraper.context.getResources().getString(R.string.WCFURL));
            lHashMap.put("packageName", BuildConfig.APPLICATION_ID);
            lHashMap.put("resumableurl", sqlitewraper.context.getResources().getString(R.string.Resumable_URL));
            lHashMap.put("common_wcf_url", sqlitewraper.context.getResources().getString(R.string.Common_Wcf_Url));

            lHashMap.put("LOGINWCFURL", sqlitewraper.context.getResources().getString(R.string.LOGINWCFURL));
            lHashMap.put("DOWNLOADWCFURL", sqlitewraper.context.getResources().getString(R.string.DOWNLOADWCFURL));
            lHashMap.put("UPLOADWCFURL", sqlitewraper.context.getResources().getString(R.string.UPLOADWCFURL));
            lHashMap.put("GEOWCFURL", sqlitewraper.context.getResources().getString(R.string.GEOWCFURL));
            lHashMap.put("TASKDOWNLOADURL", sqlitewraper.context.getResources().getString(R.string.TASKDOWNLOADURL));
            lHashMap.put("SSL", sqlitewraper.context.getResources().getString(R.string.SSL));
            lHashMap.put("ADDRESSAPI", sqlitewraper.context.getResources().getString(R.string.ADDRESSAPI));
            lHashMap.put("TRIPMAPBACK", sqlitewraper.context.getResources().getString(R.string.TRIPMAPBACK));
            lHashMap.put("MOCKLOCATION", sqlitewraper.context.getResources().getString(R.string.MOCKLOCATION));
            lHashMap.put("EVENTS", sqlitewraper.context.getResources().getString(R.string.EVENTS));

            String WCFUrl = sqlitewraper.context.getResources().getString(R.string.DOWNLOADWCFURL);
            lHashMap.put("TOTALCOUNTDOWNLOAD",WCFUrl+"Offline_Download_Totalcounter_For_Multi_Role");
            lHashMap.put("COUNTERTASK",WCFUrl+"Wcf_NewDownloadStreamming_Service_TaskCount");
            String appURL = sqlitewraper.context.getResources().getString(R.string.App_URL).split("/")[2].trim();
            if(appURL.equalsIgnoreCase("login.easyform.in"))
            {
                lHashMap.put("USERDEFINEFLOWMASTER",WCFUrl+"Wcf_offline_download_User_Define_Flow_Master_with_multi_role_new (GET Method)");
            }
            else {
                lHashMap.put("USERDEFINEFLOWMASTER",WCFUrl+"Wcf_offline_download_User_Define_Flow_Master_with_multi_role (GET Method)");
            }
            lHashMap.put("CHECKSHEET",WCFUrl+"Offline_Download_Checksheet_Master  (GET Method)");
            lHashMap.put("FLOWMASTER",WCFUrl+"Offline_Download_Checksheet_Flow_Master_AppId  (GET Method)");
            lHashMap.put("TASKUPDTAE_ATER_USERSWAP",WCFUrl+"Wcf_Off_Download_task_master_After_UserSwap_UpdateTask_HV");
            lHashMap.put("TASKDOWNLOAD_ATER_USERSWAP",WCFUrl+"Wcf_Off_Download_task_master_After_UserSwap_HV_New");
            lHashMap.put("TASKMASTERDOWNLOAD",WCFUrl+"DowanloadStreammingTaskAndSubTaskWithFlowList  (GET Method)");

            lHashMap.put("TECHNICIAN_UPLOAD",sqlitewraper.context.getResources().getString(R.string.UploadTechnician)+"WCFTechnicianDataUpload");
            lHashMap.put("QuestionMaster_log",sqlitewraper.context.getResources().getString(R.string.UploadQuestionLog)+"WCF_InsertQuestionMaster_Log_EF_1_0_0_0");
            lHashMap.put("InsertUpdtae_maintask",sqlitewraper.context.getResources().getString(R.string.UploadTask)+"InsertUpdateDelete_MainAndSub_Task");
            lHashMap.put("Insert_Update_Punchmaster",sqlitewraper.context.getResources().getString(R.string.UPLOADWCFURL)+"WCF_Insert_Update_Delete_Punch_Master");


            PackageManager pm = sqlitewraper.context.getPackageManager();
            String packageName = sqlitewraper.context.getPackageName();
            PackageInfo packageInfo = pm.getPackageInfo(packageName, 0);

            long installTime = packageInfo.firstInstallTime;
            long updateTime = packageInfo.lastUpdateTime;

            // Convert the timestamp to a readable date and time
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            String installDateTime = sdf.format(new Date(installTime));
            String updateDateTime = sdf.format(new Date(updateTime));
            lHashMap.put("Appinstalldate", installDateTime); // app install date

            if(installDateTime.equalsIgnoreCase(updateDateTime))
            {
                lHashMap.put("Appupgradedate", "NA"); // app update date
            }
            else {
                lHashMap.put("Appupgradedate", updateDateTime); // app update date
            }

            ArrayList<JSONObject> list = new ArrayList<JSONObject>();
            JSONObject json = null;
            json = new JSONObject(lHashMap);
            LogUtils.writeOthersLogToFile(json.toString(),"version_plug");
            list.add(json);


            PluginResult result = new PluginResult(Status.OK, list.toString());

            this.callbackContext.sendPluginResult(result);
        } catch (Exception e) {
            this.callbackContext.success("Error");

            // TODO: handle exception
        }

        return true;

    }

}
