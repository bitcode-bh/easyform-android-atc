
package com.sky.atc.easyformse;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.lang.Thread.UncaughtExceptionHandler;
import java.util.ArrayList;
import java.util.List;

import org.apache.http.NameValuePair;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.protocol.HTTP;

import android.graphics.Bitmap;
import android.text.format.Time;

import com.sky.atc.easyformse.utils.LogUtils;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//generate and save error log for crash
@StringFogIgnore
public class custom_ex implements UncaughtExceptionHandler {

    private UncaughtExceptionHandler defaultUEH;


    /* 
     * if any of the parameters is null, the respective functionality 
     * will not be used 
     */
    public custom_ex() {
//        this.url = url;
        this.defaultUEH = Thread.getDefaultUncaughtExceptionHandler();
    }

    public void uncaughtException(Thread t, Throwable e) {
        final Writer result = new StringWriter();
        final PrintWriter printWriter = new PrintWriter(result);
        e.printStackTrace(printWriter);
        LogUtils.writeCustomExLogToFile(result.toString(),"uncaughtException custom_ex");
        //defaultUEH.uncaughtException(t, e);
    }

    private void sendToServer(String stacktrace, String filename) {
        DefaultHttpClient httpClient = new DefaultHttpClient();
        HttpPost httpPost = new HttpPost("");
        List<NameValuePair> nvps = new ArrayList<NameValuePair>();
        nvps.add(new BasicNameValuePair("filename", filename));
        nvps.add(new BasicNameValuePair("stacktrace", stacktrace));
        try {
            httpPost.setEntity(
                    new UrlEncodedFormEntity(nvps, HTTP.UTF_8));
            httpClient.execute(httpPost);
        } catch (IOException e) {
            ////e.printStackTrace()();
        }
    }
}