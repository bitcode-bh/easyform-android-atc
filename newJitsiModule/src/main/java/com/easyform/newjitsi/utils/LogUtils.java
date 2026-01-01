package com.easyform.newjitsi.utils;

import android.os.Environment;
import android.util.Log;

import com.easyform.newjitsi.BuildConfig;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

/**
 * Created by NareshChocha on 11/2/2021.
 *
 * @author NareshChocha
 */
public class LogUtils {
    private final static long expiryDate = TimeUnit.MILLISECONDS.convert(5, TimeUnit.DAYS);

    private static String filePath(String folder) throws IOException {
        if (BuildConfig.isLogWrite) {
            String folderPath = "EASY_LOG/" + folder;
            File folderFile = new File(Environment.getExternalStorageDirectory().getAbsolutePath() + "/" + folderPath);
            DeleteLogFile(folderFile);
            return folderFile.getAbsolutePath();
        } else {
            throw new IOException("isLogWrite is false");
        }
    }


    public static void JitsiLogFile(String error, String classAndMethod) {
        try {
            File path = new File(filePath("NewJitsiError"));
            if (!path.exists()) {
                path.mkdirs();
            }
            Date currentData = new Date();
            String pattern = "MM_dd_yyyy";
            SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
            String fileName = "Jitsi_" + simpleDateFormat.format(currentData) + ".txt";
            File logFile = new File(path, fileName);

            String time = currentData.toString();
            String errorLog = "\n\n\nTIME: " + time + "\nERROR: " + error + " \nMETHOD: " + classAndMethod;

            BufferedWriter bw = new BufferedWriter(new FileWriter(logFile, true));
            bw.write(errorLog);
            bw.newLine();
            bw.close();
        } catch (IOException e) {
            Log.e("Error ", e.toString());
        }
    }

    private static void DeleteLogFile(File folder) throws IOException {
        final File[] files = folder.listFiles(pathname -> pathname.isFile() && (pathname.lastModified() + expiryDate < System.currentTimeMillis()));
        if (files != null && files.length > 0) {
            for (File f : files) {
                if (f.lastModified() + expiryDate < System.currentTimeMillis()) {
                    if (f.exists())
                        f.delete();
                }
            }
        }
    }
}
