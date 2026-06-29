package com.sky.atc.easyformse.utils;


import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.sky.atc.easyformse.BuildConfig;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Created by NareshChocha on 11/2/2021.
 *
 * @author NareshChocha
 */
public class LogUtils {
    private final static long expiryDate = TimeUnit.MILLISECONDS.convert(5, TimeUnit.DAYS);
    public final static String LogFolderName = "EASY_LOG";

    private static final ExecutorService executorService = Executors.newFixedThreadPool(4);
    private static final SharedPreferences sharedPreferences= sqlitewraper.context.getSharedPreferences("LogWrite",0);

    private static String filePath(String folder) throws IOException {
        boolean mStringLogWrite = sharedPreferences.getBoolean("isLogWrite",false);
        if (mStringLogWrite) {
            String folderPath = LogFolderName + "/" + folder;
            File folderFile = new File(Utils.getRootFolderFile(sqlitewraper.context) + "/" + folderPath);
            return folderFile.getAbsolutePath();
        } else {
            throw new IOException("isLogWrite is false");
        }
    }


    public static void photoLogFile(String error, String classAndMethod) {
        executorService.execute(() -> {
            try {
                File path = new File(filePath("PhotoError"));
                if (!path.exists()) {
                    path.mkdirs();
                }
                Date currentData = new Date();
                String pattern = "MM_dd_yyyy";
                SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
                String fileName = "Photo_" + simpleDateFormat.format(currentData) + ".txt";
                File logFile = new File(path, fileName);

                String time = currentData.toString();
                writLogFile(error, "", logFile, time,classAndMethod);

            } catch (IOException e) {
                Log.e("Error ", e.toString());
            }
        });
    }

    public static void writeApiCallLogToFile(String error, String Method,String ClassName,String Logwrite_without_enable) {
        executorService.execute(() -> {
            try {
                File path = null;
//                if(Logwrite_without_enable.equalsIgnoreCase("1"))
//                {
//                    String folderPath = LogFolderName + "/" + "ApiCall";
//                    File folderFile = new File(Utils.getRootFolderFile(sqlitewraper.context) + "/" + folderPath);
//                    path = new File(folderFile.getAbsolutePath());
//                }
//                else {
//
//                }

                path = new File(filePath("ApiCall"));
                if (!path.exists()) {
                    path.mkdirs();
                }

                Date currentData = new Date();
                String pattern = "MM_dd_yyyy";
                SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
                String fileName = "ApiCallLogs_" + simpleDateFormat.format(currentData) + ".txt";
                File logFile = new File(path, fileName);

                String time = currentData.toString();
                writLogFile(error, Method, logFile, time,ClassName);
//            DeleteLogFile(path);
            } catch (IOException e) {
                e.printStackTrace();
            }
        });

    }

    public static void writeAttendanceLogToFile(String error, String classAndMethod) {
        executorService.execute(() -> {
            try {
                String folderPath = LogFolderName + "/" + "Attendance";
                File folderFile = new File(Utils.getRootFolderFile(sqlitewraper.context) + "/" + folderPath);


                File path = new File(folderFile.getAbsolutePath());
                if (!path.exists()) {
                    path.mkdirs();
                }
                Date currentData = new Date();
                String pattern = "MM_dd_yyyy";
                SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
                String fileName = "AttendanceLogs_" + simpleDateFormat.format(currentData) + ".txt";
                File logFile = new File(path, fileName);

                String time = currentData.toString();
                writLogFile(error, "", logFile, time,classAndMethod);

            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }


    public static void writeUploadLogToFile(String error, String Method ,String ClassName) {
        executorService.execute(() -> {
            try {
                File path = new File(filePath("Upload"));
                if (!path.exists()) {
                    path.mkdirs();
                }
                Date currentData = new Date();
                String pattern = "MM_dd_yyyy";
                SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
                String fileName = "UploadLogs_" + simpleDateFormat.format(currentData) + ".txt";
                File logFile = new File(path, fileName);

                String time = currentData.toString();
                writLogFile(error, Method, logFile, time,ClassName);
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }

    public static void writeOthersLogToFile(String error, String classAndMethod) {
        executorService.execute(() -> {
            try {
                File path = new File(filePath("Other"));
                if (!path.exists()) {
                    path.mkdirs();
                }
                Date currentData = new Date();
                String pattern = "MM_dd_yyyy";
                SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
                String fileName = "Logs_" + simpleDateFormat.format(currentData) + ".txt";
                File logFile = new File(path, fileName);

                String time = currentData.toString();
                writLogFile(error, "" ,logFile, time,classAndMethod);
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }

    public static void writeRfTrackLogToFile(String error, String classAndMethod) {
        executorService.execute(() -> {
            try {
//                String folderPath = LogFolderName + "/" + "RfTrack";
//                File folderFile = new File(Utils.getRootFolderFile(sqlitewraper.context) + "/" + folderPath);

                File path = new File(filePath("RfTrack"));
                if (!path.exists()) {
                    path.mkdirs();
                }
                Date currentData = new Date();
                String pattern = "MM_dd_yyyy";
                SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
                String fileName = "RfTrack_" + simpleDateFormat.format(currentData) + ".txt";
                File logFile = new File(path, fileName);

                String time = currentData.toString();
                writLogFile(error, "", logFile, time,classAndMethod);
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }


    public static void writeVideoCaptureLogToFile(String error, String classAndMethod) {
        executorService.execute(() -> {
            try {
                File path = new File(filePath("videoCapture"));
                if (!path.exists()) {
                    path.mkdirs();
                }
                Date currentData = new Date();
                String pattern = "MM_dd_yyyy";
                SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
                String fileName = "videoCapture_" + simpleDateFormat.format(currentData) + ".txt";
                File logFile = new File(path, fileName);

                String time = currentData.toString();
                writLogFile(error, "", logFile, time,classAndMethod);
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }


    public static void writeComputerVisionDetectionLogToFile(String error, String classAndMethod) {
        executorService.execute(() -> {
            try {
                File path = new File(filePath("ComputerVisionDetection"));
                if (!path.exists()) {
                    path.mkdirs();
                }
                Date currentData = new Date();
                String pattern = "MM_dd_yyyy";
                SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
                String fileName = "computerVisionDetection_" + simpleDateFormat.format(currentData) + ".txt";
                File logFile = new File(path, fileName);

                String time = currentData.toString();
                writLogFile(error, "", logFile, time,classAndMethod);
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }


    public static void writeTripLogToFile(String error, String Method, String classname ) {
        executorService.execute(() -> {
            try {
                File path = new File(filePath("Trip"));
                if (!path.exists()) {
                    path.mkdirs();
                }
                Date currentData = new Date();
                String pattern = "MM_dd_yyyy";
                SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
                String fileName = "Trip_" + simpleDateFormat.format(currentData) + ".txt";
                File logFile = new File(path, fileName);

                String time = currentData.toString();
                writLogFile(error, Method, logFile, time,classname);
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }


    public static void writeDownloadLogToFile(String error, String classAndMethod) {
        executorService.execute(() -> {
            try {
                File path = new File(filePath("Download"));
                if (!path.exists()) {
                    path.mkdirs();
                }
                Date currentData = new Date();
                String pattern = "MM_dd_yyyy";
                SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
                String fileName = "Download_" + simpleDateFormat.format(currentData) + ".txt";
                File logFile = new File(path, fileName);

                String time = currentData.toString();
                writLogFile(error, "", logFile, time,classAndMethod);
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }


    public static void writeCustomExLogToFile(String error, String classAndMethod) {
        executorService.execute(() -> {
            try {
                File path = new File(filePath("CustomEx"));
                if (!path.exists()) {
                    path.mkdirs();
                }
                Date currentData = new Date();
                String pattern = "MM_dd_yyyy";
                SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
                String fileName = "CustomEx_" + simpleDateFormat.format(currentData) + ".txt";
                File logFile = new File(path, fileName);

                String time = currentData.toString();
                writLogFile(error, "", logFile, time,classAndMethod);
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }

    public static void writeDeleteOldTaskLogToFile(String error, String classAndMethod) {
        executorService.execute(() -> {
            try {
                File path = new File(filePath("DeleteOldTask"));
                if (!path.exists()) {
                    path.mkdirs();
                }
                Date currentData = new Date();
                String pattern = "MM_dd_yyyy";
                SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
                String fileName = "DeleteOldTask_" + simpleDateFormat.format(currentData) + ".txt";
                File logFile = new File(path, fileName);

                String time = currentData.toString();
                writLogFile(error, "", logFile, time,classAndMethod);
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }

    private static void writLogFile(String error, String Method, File logFile, String time,String ClassName) throws IOException {
        String startingLogs = "\n____________________________ START ________________________________________\n";
        String endingLogs = "\n------------- END --------------\n";

        String errorLog = startingLogs + "TIME: " + time + "\nAPI: " + Method + "\n" + error +  "\nClassName: " + ClassName + endingLogs;

        BufferedWriter bw = new BufferedWriter(new FileWriter(logFile, true));
        bw.write(errorLog);
        bw.newLine();
        bw.close();
    }

    public static void deleteLogFile() {
        executorService.execute(() -> {
            try {
                List<File> fileList = new ArrayList<>();
                getAllTextFiles(Utils.getRootFolderFile(sqlitewraper.context) + "/" + LogFolderName,
                        fileList);
                deleteFiles(fileList);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    private static void getAllTextFiles(String directoryName, List<File> files) throws Exception {
        File[] fList = new File(directoryName).listFiles();
        if (fList != null)
            for (File file : fList) {
                if (file.isFile() && file.getName().endsWith(".txt")) {
                    files.add(file);
                } else if (file.isDirectory()) {
                    getAllTextFiles(file.getAbsolutePath(), files);
                }
            }
    }

    public static void uploadErrorFilesToServer() {
        executorService.execute(() -> {
            try {
                List<File> fileList = new ArrayList<>();
                getAllTextFiles(Utils.getRootFolderFile(sqlitewraper.context) + "/" + LogFolderName,
                        fileList);
                uploadLogsFilesToServer(fileList);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    private static void uploadLogsFilesToServer(List<File> logFileList) throws Exception {
        if (logFileList.isEmpty()) {
            return;
        }
        File file = logFileList.get(0);
        Log.i("uploadError", "logFileList size::" + logFileList.size() + " file Path" + file.getAbsolutePath());
        if (file.exists()) {
            DeviceEventsUtils.uploadDatabase(file.getAbsolutePath());
        }
        logFileList.remove(0);
        uploadLogsFilesToServer(logFileList);
    }


    private static void deleteFiles(List<File> logFileList) {
        if (logFileList.isEmpty()) {
            return;
        }
        try {
            File file = logFileList.get(0);
            boolean isDeleted = deleteLogFile(file);
            Log.i("deleteFiles", "logFileList size::" + logFileList.size() + " file Path" + file.getAbsolutePath() + " isDeleted::" + isDeleted);
        } catch (Exception e) {
            e.printStackTrace();
        }
        logFileList.remove(0);
        deleteFiles(logFileList);
    }

    private static boolean deleteLogFile(File logFile) throws IOException {
        if (logFile.lastModified() + expiryDate < System.currentTimeMillis()) {
            if (logFile.exists())
                return logFile.delete();
            else
                return false;
        } else
            return false;
    }


    // Method to append logs with timestamps
    public static void writeApilistLogToFile(String apiName, long startTime, long endTime, Context context) {

        if(DeviceEventsUtils.isApiLogwrite().equalsIgnoreCase("true"))
        {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());

            String startTime1 = sdf.format(new Date(startTime));
            String endTime1 = sdf.format(new Date(endTime));
            long duration = endTime - startTime;


            String logEntry = "\n====================\n";
            logEntry += "API Name: " + apiName + "\n";
            logEntry += "Start Time: " + startTime1 + "\n";
            logEntry += "End Time: " + endTime1 + "\n";
            logEntry += "duration: " + duration + "ms\n";
            logEntry += "====================\n";

            try {
                String folderPath = LogFolderName + "/" + "ApiLogs";
                File path = new File(Utils.getRootFolderFile(sqlitewraper.context) + "/" + folderPath);

                if (!path.exists()) {
                    path.mkdirs();
                }

                File logFile = new File(path, "api_call_logs.txt");

                BufferedWriter writer = new BufferedWriter(new FileWriter(logFile, true));
                writer.append(logEntry);
                writer.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }


    public static void writeAllApiCallLog(String error, String Method,String ClassName) {
        executorService.execute(() -> {
            try {
                MySharedPreferences mySharedPreferences = sqlitewraper.getSecureShared("isAllServiceLog");
                boolean isAllServiceLog = mySharedPreferences.getBoolean("isAllServiceLog",false);

                if(isAllServiceLog)
                {
                    File path = null;

                    String folderPath = LogFolderName + "/" + "AllApiLog";
                    File folderFile = new File(Utils.getRootFolderFile(sqlitewraper.context) + "/" + folderPath);
                    path = new File(folderFile.getAbsolutePath());

                    if (!path.exists()) {
                        path.mkdirs();
                    }
                    Date currentData = new Date();
                    String pattern = "MM_dd_yyyy";
                    SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
                    String fileName = "AllApiCallLogs_" + simpleDateFormat.format(currentData) + ".txt";
                    File logFile = new File(path, fileName);

                    String time = currentData.toString();
                    writLogFile(error, Method, logFile, time,ClassName);
                }

            } catch (IOException e) {
                e.printStackTrace();
            }
        });

    }


    public static void writeGeofenceLogToFile(String error, String classAndMethod) {
        executorService.execute(() -> {
            try {
                String folderPath = LogFolderName + "/" + "Geofence";
                File folderFile = new File(Utils.getRootFolderFile(sqlitewraper.context) + "/" + folderPath);


                File path = new File(folderFile.getAbsolutePath());
                if (!path.exists()) {
                    path.mkdirs();
                }
                Date currentData = new Date();
                String pattern = "MM_dd_yyyy";
                SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern, Locale.getDefault());
                String fileName = "AttendanceLogs_" + simpleDateFormat.format(currentData) + ".txt";
                File logFile = new File(path, fileName);

                String time = currentData.toString();
                writLogFile(error, "", logFile, time,classAndMethod);

            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }

}
