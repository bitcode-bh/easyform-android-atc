package com.easyform.newjitsi.activitys.jitsimeet;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.speech.SpeechRecognizer;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.widget.ImageView;

import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import com.easyform.newjitsi.R;

import org.apache.cordova.ConfigXmlParser;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaInterfaceImpl;
import org.apache.cordova.CordovaPreferences;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CordovaWebViewEngine;
import org.apache.cordova.CordovaWebViewImpl;
import org.apache.cordova.engine.SystemWebView;
import org.apache.cordova.engine.SystemWebViewEngine;

public class WebDialogFragment extends DialogFragment {

    private String roleId;
    private String taskId;
    String Url;
    String FlowId;
    String start_status;
    String Compnay_id,User_id,site_id,udf_id,feature_id,dateformate;
//   public WebView webView;
    CordovaWebView cordovaWebView;
    CordovaInterfaceImpl cordovaInterface;
    SystemWebView systemWebView;
    public WebDialogFragment(String roleId, String taskId,String Url,String FlowId,String start_status,String Compnay_id,String User_id,
                             String site_id ,String udf_id,String feature_id,String dateformate) {
        this.roleId = roleId;
        this.taskId = taskId;
        this.Url = Url;
        this.FlowId = FlowId;
        this.start_status = start_status;
        this.Compnay_id = Compnay_id;
        this.User_id = User_id;
        this.site_id = site_id;
        this.udf_id= udf_id;
        this.feature_id = feature_id;
        this.dateformate =dateformate;
    }


    @SuppressLint("JavascriptInterface")
    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {

        View view = inflater.inflate(R.layout.fragment_web_dialog, container, false);

        ImageView btnClose = view.findViewById(R.id.btnClose);
        btnClose.setOnClickListener(v -> dismiss());

        systemWebView = view.findViewById(R.id.webView);
        cordovaInterface = new CordovaInterfaceImpl(getActivity());

        CordovaPreferences preferences = new CordovaPreferences();
        preferences.set("DisallowOverscroll", true);

        CordovaWebViewEngine engine = new SystemWebViewEngine(systemWebView);
        cordovaWebView = new CordovaWebViewImpl(engine);

        ConfigXmlParser configParser = new ConfigXmlParser();
        configParser.parse(getActivity());

        cordovaWebView.init(
                cordovaInterface,
                configParser.getPluginEntries(),
                configParser.getPreferences()
        );
        systemWebView.getSettings().setJavaScriptEnabled(true);

        systemWebView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public boolean isJitsiCallRunning() {
                return CustomJitsiMeetActivity.isCallRunning;
            }

            @JavascriptInterface
            public void closeWebView() {
                // Must run on UI thread
                systemWebView.post(() -> {
                    dismiss();
                });
            }
        }, "AndroidCallChecker");





        String url = "file:///android_asset/www2/viewsitelist_pm_grouplist.html?task_id=" + taskId + "&status=" + start_status;
        Log.d("Webviewurl", url);

        cordovaWebView.loadUrl(url);

        return view;
    }

    @Override
    public void onStart() {
        super.onStart();

        if (getDialog() != null && getDialog().getWindow() != null) {

            DisplayMetrics displayMetrics = new DisplayMetrics();
            requireActivity().getWindowManager().getDefaultDisplay().getMetrics(displayMetrics);

            int height = (int) (displayMetrics.heightPixels * 0.5);

            Window window = getDialog().getWindow();

            window.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
            window.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));


            window.setLayout(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    height
            );

            window.setGravity(Gravity.BOTTOM);
        }
    }

//    @Nullable
//    @Override
//    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
//        View view = inflater.inflate(R.layout.fragment_web_dialog, container, false);
//
//        webView = view.findViewById(R.id.webView);
//
//        ImageView btnClose = view.findViewById(R.id.btnClose);
//        btnClose.setOnClickListener(v -> dismiss());
//
////        webView.getSettings().setJavaScriptEnabled(true);
////        WebSettings webSettings = webView.getSettings();
////        webSettings.setDomStorageEnabled(true);
////        webView.setWebViewClient(new WebViewClient());
////
////        String url = "file:///android_asset/www2/viewsitelist_pm_grouplist.html?task_id="+taskId;
////
//////        String url = Url + "pages/EF_Port_App1.aspx?id=33688&hdrl="+ roleId +"&flow="+ FlowId +"&site="+site_id+"&task="+taskId+"&status="+start_status+"&udf=23891&tab=0&prev_pageId=jitsi_meet&click=subtask&comp_id="+Compnay_id+"&user_id="+User_id+"&menu=0&header=0";
////
////        Log.d("Webviewurl",url);
////        webView.loadUrl(url);
//
//
//
//        WebSettings webSettings = webView.getSettings();
//        webSettings.setJavaScriptEnabled(true);
//        webSettings.setDatabaseEnabled(true);
//        webSettings.setDomStorageEnabled(true);
//        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
//        webSettings.setSupportMultipleWindows(false);
//        webView.getSettings().setMixedContentMode(
//                WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
//        );
//        CookieManager cookieManager = CookieManager.getInstance();
//        cookieManager.setAcceptCookie(true);
//        cookieManager.setAcceptThirdPartyCookies(webView, true);
//
//        webView.setWebViewClient(new WebViewClient() {
//
//            @Override
//            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
//                view.loadUrl(request.getUrl().toString());
//                return true;
//            }
//        });
//
//        webView.setWebChromeClient(new WebChromeClient());
//
//        String url = Url + "pages/EF_Port_App1.aspx?id="+feature_id
//                + "&hdrl=" + roleId
//                + "&flow=" + FlowId
//                + "&site=" + site_id
//                + "&task=" + taskId
//                + "&status=" + start_status
//                + "&udf="+udf_id
//                + "&tab=0"
//                + "&prev_pageId=jitsi_meet"
//                + "&click=subtask"
//                + "&comp_id=" + Compnay_id
//                + "&user_id=" + User_id
//                + "&dateformat="+dateformate
//                + "&menu=0"
//                + "&header=0&ms="+System.currentTimeMillis() ;
//
//        Log.d("Webviewurl", url);
//        webView.loadUrl(url);
//
//
//        //        String url  = Url + "pages/EF_Port_App1.aspx?id=33688&hdrl=" + roleId +"&udf_id=23891&tab_index=0&circle=undefined" + "&flow=" + FlowId + "&site=0" + "&task=" + taskId + "&status=" +  start_status + "&udf=23891&tab=0&prev_pageId=jitsi_meet&click=subtask&comp_id= " + Compnay_id + "&user_id="  + User_id +"&menu=0&header=0";
////        String url = Url + "pages/EF_Port_App_CommentUI.aspx?hdr=" + roleId + "&flow_id=" + FlowId + "&task_id=" + taskId + "&menu=0&header=0&ms=" + System.currentTimeMillis() ;
////       String url = "file:///android_asset/www2/EF_Jitsi_CommentUI.html?task_id="+taskId;
//
//
//        return view;
//    }



//    public void reload_webview()
//    {
//        if (cordovaWebView != null) {
//            cordovaWebView.reload();
//        } else {
//            Log.e("WebView", "WebView is null, cannot reload.");
//        }
//    }
}

