package com.sky.atc.easyformse;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.os.Handler;
import android.os.Looper;
import android.os.StrictMode;
import android.text.Html;
import android.util.Log;
import android.widget.Toast;

import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.utils.LogUtils;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaArgs;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONObject;
import org.ksoap2.SoapEnvelope;
import org.ksoap2.serialization.PropertyInfo;
import org.ksoap2.serialization.SoapObject;
import org.ksoap2.serialization.SoapPrimitive;
import org.ksoap2.serialization.SoapSerializationEnvelope;
import org.ksoap2.transport.HttpTransportSE;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 * Created by Mikka on 8/8/2016.
 */


//FOR THEME STARTING PAGE- FIRST PLUGIN
//to get support details
@StringFogIgnore
public class cntct_info implements Runnable {

    public static final String TYPE_NONE = "NONE";
    public CallbackContext callbackContext;

    NewWebservicesCallEasyform NewWebservicesCallEasyform = new NewWebservicesCallEasyform();
    private static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL);
    private static final String METHOD_NAME_corner = "Wcf_Select_ThemeForPackage";

    int i;
    int gps;

    // public CallbackContext callbackContext;
    JSONObject json;
    // CordovaArgs args;
    String action;
    CordovaArgs args;
    JSONArray new_args;
    Context c;
    MySharedPreferences pref;

    public cntct_info(String ac, CordovaArgs args, Context c,
                      CallbackContext callbackContext1) {

        this.action = ac;
        this.args = args;
        this.callbackContext = callbackContext1;
        this.c = c;

        // TODO Auto-generated constructor stub
    }

    @Override
    public void run() {
        // TODO Auto-generated method stub
        try {

            String restext = null;
            try {
                PackageInfo pi = c.getPackageManager().getPackageInfo(c.getPackageName(), 0);

                JSONObject data2 = new JSONObject();
                data2.put("package",pi.packageName);
                pref = sqlitewraper.getSecureShared("MyPref");
                String themecolor;
                try{
                    themecolor = args.getJSONObject(0).getString("themecolor");
                }
                catch (Exception e)
                {
                    themecolor = "";
                }

                pref.putString("themecolor",themecolor);
                pref.commit();

                JSONArray data3 = new JSONArray();
                data3.put(data2);


                restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequest(data2, WCFURL, METHOD_NAME_corner);
                String status = null;
                String message = null;
                JSONArray jsonArray1 = new JSONArray(restext);
                for (int k = 0; k < jsonArray1.length(); k++) {
                    JSONObject jsonObject = jsonArray1.getJSONObject(0);
                    status = jsonObject.getString("status");
                    message = jsonObject.getString("message");
                }

                try {
                    JSONArray innerArray = new JSONArray(message);

                    String nestedJsonArrayString = innerArray.getString(0);
                    JSONArray mJsonArray = new JSONArray(nestedJsonArrayString  );

                    JSONObject obj = mJsonArray.getJSONObject(0);

                    String attendance = obj.getString("attendance_module");
                    pref.putString("attendance_module", attendance);
                    pref.commit();


                } catch (Exception e) {

                }

                LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<String, Object>();
                lHashMap.put("url", sqlitewraper.context.getResources().getString(R.string.App_URL) + "/Services/");
                lHashMap.put("videourl", sqlitewraper.context.getResources().getString(R.string.Video_URL));
		        lHashMap.put("wcfurl", sqlitewraper.context.getResources().getString(R.string.WCFURL));
                lHashMap.put("responseText", restext);
                lHashMap.put("packageName", pi.packageName);
                lHashMap.put("resumableurl",sqlitewraper.context.getResources().getString(R.string.Resumable_URL));
                lHashMap.put("common_wcf_url",sqlitewraper.context.getResources().getString(R.string.Common_Wcf_Url));

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
                lHashMap.put("Appinstalldate", installDateTime); //app install date
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
                LogUtils.writeOthersLogToFile(json.toString(),"cntct_info");
                list.add(json);
                PluginResult result = new PluginResult(PluginResult.Status.OK,
                        list.toString());

                // hide company details toast msg 12/02/2024
//                if(status.equalsIgnoreCase("2"))
//                {
//                    new Handler(Looper.getMainLooper()).post(new Runnable() {
//                        public void run() {
//                            String sourceString = "Company details not found for package name: " + "<b>" + pi.packageName  + "</b> ";
//                            Toast toast = Toast.makeText(sqlitewraper.context, Html.fromHtml(sourceString), Toast.LENGTH_LONG);
//                            toast.show();
//                        }
//                    });
//                }

                callbackContext.sendPluginResult(result);
            } catch (Exception e) {
                this.callbackContext.error(restext);
                // TODO: handle exception
            }

        } catch (Exception e) {
        }
        return;
    }


}
