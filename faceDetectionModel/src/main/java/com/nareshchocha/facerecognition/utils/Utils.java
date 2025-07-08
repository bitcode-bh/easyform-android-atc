package com.nareshchocha.facerecognition.utils;

import android.content.Context;
import android.content.SharedPreferences;

import com.nareshchocha.facerecognition.BuildConfig;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

/**
 * Created by NareshChocha on 4/18/2022.
 *
 * @author NareshChocha
 */
public class Utils {

    public static File getDownloadPathFile(Context context) {
        return context.getExternalFilesDir(null);
    }

    public static void writeLogToFile(Context context, String response, String method) {
         SharedPreferences sharedPreferences = context.getSharedPreferences("LogWrite",0);
         boolean mStringLogWrite = sharedPreferences.getBoolean("isLogWrite",false);
        try {
            if (!mStringLogWrite) {
                throw new IOException("isLogWrite is false");
            }
            File path = new File(getDownloadPathFile(context), "FaceRecognize/LOGS");
            if (!path.exists()) {
                // Make it, if it doesn
                path.mkdirs();
            }

            long time = System.currentTimeMillis();

            String errorlog = "TIME: " + time + " ERROR: " + response + " METHOD: " + method;

            BufferedWriter bw = new BufferedWriter(new FileWriter(new File(path, "FaceRecognizeLogs.txt"), true));
            bw.write(errorlog);
            bw.newLine();
            bw.close();
        } catch (IOException e) {

        }
    }
}