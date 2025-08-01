package com.sky.atc.easyformse;

import static android.content.Context.LOCATION_SERVICE;
import static com.sky.atc.easyformse.sqlitewraper.context;
import static com.sky.atc.easyformse.sqlitewraper.getMainactivity;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.StatFs;
import android.provider.Settings;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import androidx.fragment.app.Fragment;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.snackbar.Snackbar;
import com.sky.atc.easyformse.attendance.newattendanceutils.AttendanceUtil;
import com.sky.atc.easyformse.datautils.MySharedPreferences;


import java.io.File;

import io.michaelrocks.paranoid.Obfuscate;

//to Setting app
@Obfuscate
public class SettingFragment extends Fragment {

    MaterialButton mbtnCheckDeveloper;
    MaterialButton mbtnAttendancevalue;
    MaterialButton mbtnshowpermission;
    boolean settingEnabled;
    int result;
    String ischeckdontkeepsetting;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_setting, container,
                false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        mbtnCheckDeveloper = view.findViewById(R.id.mbtcheckdeveloper);
        mbtnAttendancevalue = view.findViewById(R.id.mbtncheckattendance);
        mbtnshowpermission = view.findViewById(R.id.mbtnshowpermission);

        mbtnshowpermission.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.fromParts("package", context.getPackageName(), null));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);

            }
        });

        mbtnCheckDeveloper.setOnClickListener(v -> {
            // for check device setting developer option enable disable
            settingEnabled = Settings.Global.getInt(context.getContentResolver(), Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, Build.TYPE.equals("eng") ? 1 : 0) != 0;
            // false means option off true means option on

            // for check don't keep activity options from setting
            result = Settings.Global.getInt(context.getContentResolver(), Settings.Global.ALWAYS_FINISH_ACTIVITIES, 0);
            // 0 means option off 1 means option on
//
            if (result == 1) {
                ischeckdontkeepsetting = "true";
            } else {
                ischeckdontkeepsetting = "false";
            }

            long availableBytes = getAvailableInternalStorageSpace();
            String readable = formatSize(availableBytes);



            String shareBody = "Device name: " + getDeviceName() + "\nDevice model: " + Build.MODEL +"\nAndroid version: " + Build.VERSION.RELEASE +"\nDeveloper option: " + settingEnabled
                    +"\nDon't keep activity: " + ischeckdontkeepsetting  + "\nGps: " + CheckGPSFlag()  + "\nAvailable Internal Storage: " + readable ;


            new Handler().postDelayed(new Runnable(){

                public void run() {
                    OpenDialog( shareBody,"Device Details");
                }

            }, 200L);

//            Intent sharingIntent = new Intent(android.content.Intent.ACTION_SEND);
//            sharingIntent.setType("text/plain");
//            String[] shareEmail = {"krishna.vaddoriya@skyproductivity.com"};
//            String shareSub = "Device details";
//            String shareBody = "Device name: " + getDeviceName() + "\nDevice model: " + Build.MODEL +"\nAndroid version: " + Build.VERSION.RELEASE +"\nDeveloper option: " + settingEnabled
//            +"\nDon't keep activity: " + ischeckdontkeepsetting ;
//            sharingIntent.putExtra(Intent.EXTRA_EMAIL, shareEmail);
//            sharingIntent.putExtra(android.content.Intent.EXTRA_SUBJECT, shareSub);
//            sharingIntent.putExtra(android.content.Intent.EXTRA_TEXT, shareBody);
//            startActivity(Intent.createChooser(sharingIntent,"Email Chooser"));
        });


        mbtnAttendancevalue.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

                new Handler().postDelayed(new Runnable(){

                    public void run() {
                        String formattedMsg;
                        MySharedPreferences mySharedPreferences = sqlitewraper.getSecureShared("AttendanceData");
                        formattedMsg = mySharedPreferences.getString("attendanceJson","");
                        formattedMsg = formattedMsg
                                .replace("},", "}\n\n") // Separate items
                                .replace(",", "\n")     // Commas become line breaks
                                .replace("{", "{\n")    // Start brace
                                .replace("}", "\n}");   // End brace

                        OpenDialog( formattedMsg,"Attendance Details");                    }

                }, 200L);


            }
        });

    }
    public String getDeviceName() {
        String manufacturer = Build.MANUFACTURER;
        String model = Build.MODEL;
        if (model.toLowerCase().startsWith(manufacturer.toLowerCase())) {
            return capitalize(model);
        } else {
            return capitalize(manufacturer) + " " + model;
        }
    }

    private String capitalize(String s) {
        if (s == null || s.length() == 0) {
            return "";
        }
        char first = s.charAt(0);
        if (Character.isUpperCase(first)) {
            return s;
        } else {
            return Character.toUpperCase(first) + s.substring(1);
        }
    }

    void showSnackBar(View view, String message) {
        Snackbar snackbar = Snackbar.make(view, message, Snackbar.LENGTH_INDEFINITE);
        snackbar.setAction("Ok", v -> {
            snackbar.dismiss();
        });
        snackbar.show();
    }

    public static long getAvailableInternalStorageSpace() {
        File path = Environment.getDataDirectory(); // Internal storage directory
        StatFs stat = new StatFs(path.getPath());

        long blockSize = stat.getBlockSizeLong();       // Use getBlockSize() for API < 18
        long availableBlocks = stat.getAvailableBlocksLong();

        return availableBlocks * blockSize;
    }


    // Optional: Format bytes to KB, MB, GB
    public static String formatSize(long size) {
        String[] units = {"B", "KB", "MB", "GB", "TB"};
        int unitIndex = 0;
        double sizeInUnits = size;

        while (sizeInUnits >= 1024 && unitIndex < units.length - 1) {
            sizeInUnits /= 1024;
            unitIndex++;
        }

        return String.format("%.2f %s", sizeInUnits, units[unitIndex]);
    }

    private String CheckGPSFlag()
    {
        LocationManager locationManager = (LocationManager)getContext().getSystemService(LOCATION_SERVICE);
        if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)){
            return "On";
        }else {
            return "Off";
        }
    }

    public void OpenDialog(String msg,String title)
    {
        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());
        builder.setTitle(title);
        builder.setMessage(msg);

        // Add OK button
        builder.setPositiveButton("OK", new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int id) {
                // Dismiss dialog
                dialog.dismiss();
            }
        });

        // Show the dialog
        AlertDialog dialog = builder.create();
        dialog.show();
    }

}
