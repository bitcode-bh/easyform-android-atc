package com.nareshchocha.app.weatherapp.utils;

import android.os.Environment;
import android.util.Log;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Created by NareshChocha on 11/2/2021.
 *
 * @author NareshChocha
 */
public class LogUtils {
    private static String filePath(String folder) {
        String folderPath = "EASY_LOG/" + folder;
        return Environment.getExternalStorageDirectory().getAbsolutePath() + "/" + folderPath;
    }


    public static void weatherErrorLogFile(String error, String classAndMethod) {
        try {
            File path = new File(filePath("weatherError"));
            if (!path.exists()) {
                path.mkdirs();
            }
            Date currentData = new Date();
            String pattern = "MM_dd_yyyy";
            SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
            String fileName = "weatherError_" + simpleDateFormat.format(currentData) + ".txt";
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
}
