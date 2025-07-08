package com.nareshchocha.databasemanager.Utils;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Environment;

import com.nareshchocha.databasemanager.BuildConfig;

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
public class LogDatabaseManagerUtils {
    private final static long expiryDate = TimeUnit.MILLISECONDS.convert(5, TimeUnit.DAYS);
    private static Context mContext;
    private final static SharedPreferences sharedPreferences = mContext.getSharedPreferences("LogWrite",0);

    private static String filePath(String folder) throws IOException {
        boolean mStringLogWrite = sharedPreferences.getBoolean("isLogWrite",false);
        if (mStringLogWrite) {
            String folderPath = "EASY_LOG/" + folder;
            File folderFile = new File(Environment.getExternalStorageDirectory().getAbsolutePath() + "/" + folderPath);
            DeleteLogFile(folderFile);
            return folderFile.getAbsolutePath();
        } else {
            throw new IOException("isLogWrite is false");
        }
    }

    public static void writeDatabaseManagersLogToFile(String error, String classAndMethod) {
        try {
            File path = new File(filePath("DatabaseManager"));
            if (!path.exists()) {
                path.mkdirs();
            }
            Date currentData = new Date();
            String pattern = "MM_dd_yyyy";
            SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
            String fileName = "databaseManagers_" + simpleDateFormat.format(currentData) + ".txt";
            File logFile = new File(path, fileName);

            String time = currentData.toString();
            String startingLogs = "\n#######################################\n";
            String endingLogs = "\n***************************************\n";

            String errorLog = startingLogs + "TIME: " + time + "\n\nERROR: " + error + "\n\nMETHOD: " + classAndMethod + endingLogs;

            BufferedWriter bw = new BufferedWriter(new FileWriter(logFile, true));
            bw.write(errorLog);
            bw.newLine();
            bw.close();
        } catch (IOException e) {
            e.printStackTrace();
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