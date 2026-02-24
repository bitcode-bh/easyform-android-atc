package com.sky.atc.easyformse;

import static android.content.Context.LOCATION_SERVICE;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.StrictMode;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CompoundButton;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.SwitchCompat;
import androidx.core.content.FileProvider;
import androidx.fragment.app.Fragment;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.snackbar.Snackbar;

import net.sqlcipher.database.SQLiteDatabase;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;
import com.sky.atc.easyformse.datautils.MySharedPreferences;

//to Export DB
@StringFogIgnore
public class BackupFragment extends Fragment {

    String CreatzipFolder;
    List<File> fileList = new ArrayList<File>();
    SharedPreferences sharedPreferences;
    SharedPreferences.Editor mEditor;
    boolean mStringLogbackup;
    MaterialButton mbtnLogBackup;
    SQLiteDatabase database;

    LocationManager locationManager;
    String  mlat;
    String  mlon;
    SwitchCompat mCompatAllServiceLog;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_backup, container,
                false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        StrictMode.VmPolicy.Builder builder = new StrictMode.VmPolicy.Builder();
        StrictMode.setVmPolicy(builder.build());
        MaterialButton mbtBackup = view.findViewById(R.id.mbtBackup);
        mbtnLogBackup = view.findViewById(R.id.mbtLogBackup);
        SwitchCompat mSwitchLogback = view.findViewById(R.id.switchLogBackup);
        mCompatAllServiceLog = view.findViewById(R.id.switchLogAllservices);

        reqLocation();
        mbtBackup.setOnClickListener(v -> {
            exportDB(view);
        });
        mbtnLogBackup.setOnClickListener(v -> {
            LogBackup(view);
        });

        sharedPreferences= sqlitewraper.context.getSharedPreferences("LogWrite",0);
        mEditor = sharedPreferences.edit();

        mSwitchLogback.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
//                toggle is on show logbackup button otherwise not display
                if(isChecked)
                {
                    mEditor.putBoolean("isLogWrite",true); // saving string
                    mEditor.apply();
               //     mbtnLogBackup.setVisibility(View.VISIBLE);
                }
                else {
                    mEditor.putBoolean("isLogWrite",false);  // saving string
                    mEditor.apply();
                  //  mbtnLogBackup.setVisibility(View.GONE);
                }
            }
        });

        mStringLogbackup = sharedPreferences.getBoolean("isLogWrite",false);
        if (mStringLogbackup) {
            mSwitchLogback.setChecked(true);
           // mbtnLogBackup.setVisibility(View.VISIBLE);
        }
        else {
           // mbtnLogBackup.setVisibility(View.GONE);
            mSwitchLogback.setChecked(false);
        }


        MySharedPreferences mySharedPreferences = sqlitewraper.getSecureShared("isAllServiceLog");

        boolean isAllServiceLog = mySharedPreferences.getBoolean("isAllServiceLog",false);

        if(isAllServiceLog)
        {
            mCompatAllServiceLog.setChecked(true);
        }

        mCompatAllServiceLog.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {

                if(isChecked)
                {
                    mySharedPreferences.putBoolean("isAllServiceLog",true);
                    mySharedPreferences.commit();
                }
                else {
                    mySharedPreferences.putBoolean("isAllServiceLog",false);
                    mySharedPreferences.commit();
                }
            }
        });
    }

    private void exportDB(View view) {
        File backupDB = null;
        try {
            File sd = Environment.getExternalStorageDirectory();
            File data = Environment.getDataDirectory();

            if (sd.canWrite()) {
                String currentDBPath12 = "//data//" + BuildConfig.APPLICATION_ID
                        + "//databases//" + "location.db";

                String backupDBPath = "location_back.db";
                File currentDB = new File(data, currentDBPath12);
                backupDB = new File(sd, backupDBPath);
                if (backupDB.exists()) {
                    if (!backupDB.delete()) {
                        showSnackBar(view, "Backup Failed!");
                        return;
                    }
                }
                FileChannel src = new FileInputStream(currentDB).getChannel();
                FileChannel dst = new FileOutputStream(backupDB).getChannel();
                dst.transferFrom(src, 0, src.size());
                src.close();
                dst.close();
                showSnackBar(view, "Backup Successful!");

//               database  attach to email
                DBEmailShare(backupDB,"Database Backup ");

            } else {
                showSnackBar(view, "Backup Failed!");
            }
        } catch (Exception e) {
            showSnackBar(view, "Backup Failed!");
        }
    }

    private void LogBackup(View view)
    {

        try{
            File sd = Environment.getExternalStorageDirectory();
            List<String> filePaths = new ArrayList<>();
            if(sd.canWrite())
            {

                CreatzipFolder = Environment.getExternalStorageDirectory().getPath() + "/EASY_LOG" ;
                // get list of files
                List<File> fileList = getFileList(new File(CreatzipFolder));
                //go through the list of files and zip them
                if(fileList.isEmpty())
                {
                    showSnackBar(view, "Log file is Empty");
                    return;
                }


                zipFiles(fileList);

                String FolderZip = "EASY_LOG.zip";
                File mFileShare = new File( Environment.getExternalStorageDirectory().getPath(), FolderZip);
                if(!mFileShare.exists())
                {
                    showSnackBar(view, "Backup Failed!");
                    return;
                }
                filePaths.add(String.valueOf(mFileShare));
                // check RfTrack log folder
                String folderPath = Environment.getExternalStorageDirectory().getPath() + "/RFTrack";
                File folder = new File(folderPath);
                if (folder.exists() && folder.isDirectory()) {
                    // The folder is exist
                    CreatzipFolder = Environment.getExternalStorageDirectory().getPath() + "/RFTrack" ;
                    List<File> fileListRf = getFileList(new File(CreatzipFolder));
                    zipFiles(fileListRf);

                    String RFTrackZip = "RFTrack.zip";
                   File  mFileShareRFTrack = new File( Environment.getExternalStorageDirectory().getPath(), RFTrackZip);
                    if(!mFileShareRFTrack.exists())
                    {
                        showSnackBar(view, "RFTrack Backup Failed!");
                        return;
                    }
                    filePaths.add(String.valueOf(mFileShareRFTrack));
                } else {
                    // The folder does not exist
                    // Your code here...
                }

                ZipEmailShare(filePaths,"LogFile Backup");
            }


        }
        catch (Exception e) {
            showSnackBar(view, "Backup Failed!");
        }
    }

    void showSnackBar(View view, String message) {
        Snackbar snackbar = Snackbar.make(view, message, Snackbar.LENGTH_INDEFINITE);
        snackbar.setAction("Ok", v -> {
            snackbar.dismiss();
        });
        snackbar.show();
    }

    private void zipFiles(List<File> fileList)
    {
        int BUFFER = 1024;

        try
        {

            // Creating ZipOutputStream - Using input name to create output name
            FileOutputStream fos = new FileOutputStream(CreatzipFolder.concat(".zip"));
            ZipOutputStream zos = new ZipOutputStream(fos);
            // looping through all the files
            for(File file : fileList)
            {
                // To handle empty directory
                if(file.isDirectory())
                {
                    // ZipEntry --- Here file name can be created using the source file
                    ZipEntry ze = new ZipEntry(getFileName(file.toString())+"/");
                    // Putting zipentry in zipoutputstream
                    zos.putNextEntry(ze);
                    zos.closeEntry();
                }
                else
                {
                    FileInputStream fis = new FileInputStream(file);
                    BufferedInputStream bis = new BufferedInputStream(fis, BUFFER);
                    // ZipEntry --- Here file name can be created using the source file
                    ZipEntry ze = new ZipEntry(getFileName(file.toString()));
                    // Putting zipentry in zipoutputstream
                    zos.putNextEntry(ze);
                    byte data[] = new byte[BUFFER];
                    int count;
                    while((count = bis.read(data, 0, BUFFER)) != -1)
                    {
                        zos.write(data, 0, count);
                    }
                    bis.close();
                    zos.closeEntry();
                }
            }
            zos.close();
        }
        catch(IOException ioExp)
        {
            System.out.println("Error while zipping " + ioExp.getMessage());
            ioExp.printStackTrace();
        }
    }

    //the method returns a list of files
    private List<File> getFileList(File source)
    {
        if(source.isFile())
        {
            fileList.add(source);
        }
        else if(source.isDirectory())
        {
            String[] subList = source.list();
            // this condition checks for empty directory
            if(subList.length == 0)
            {
                //System.out.println("path -- " + source.getAbsolutePath());
                fileList.add(new File(source.getAbsolutePath()));
            }
            for(String child : subList)
            {
                getFileList(new File(source, child));
            }
        }
        return fileList;
    }

    private String getFileName(String filePath)
    {
        String name = filePath.substring(CreatzipFolder.length() + 1, filePath.length());
        //System.out.println(" name " + name);
        return name;
    }

    // log backup email share
    private void ZipEmailShare(List<String> mFileName,String Emailsubject)
    {
        Intent emailIntent = new Intent(Intent.ACTION_SEND_MULTIPLE);
        emailIntent.setType("*/*");
        String shareBody ="Device name: " + getDeviceName() + "\nDevice model: " + Build.MODEL +"\nAndroid version: " + Build.VERSION.RELEASE +"\nUsername: " + getusername() + "\nGps: " + CheckGPSFlag() + "\nCurrent Location: " + CurrentLocation();
        emailIntent.putExtra(Intent.EXTRA_EMAIL, new String[] { "krishna.vaddoriya@skyproductivity.com" });
        emailIntent.putExtra(Intent.EXTRA_SUBJECT, Emailsubject);
        emailIntent.putExtra(Intent.EXTRA_TEXT, shareBody);
        ArrayList<Uri> uris = new ArrayList<>();
        for (String filePath : mFileName) {
            File file = new File(filePath);
            Uri uri = FileProvider.getUriForFile(sqlitewraper.context, BuildConfig.APPLICATION_ID + ".provider", file);
            uris.add(uri);
        }

        emailIntent.putExtra(Intent.EXTRA_STREAM, uris);
        startActivity(Intent.createChooser(emailIntent,"Email Chooser"));
    }

    // database backup email share
    private void DBEmailShare(File mFileName,String Emailsubject)
    {
        Intent emailIntent = new Intent(Intent.ACTION_SEND);
        emailIntent.setType("*/*");
        String shareBody = "Device name: " + getDeviceName() + "\nDevice model: " + Build.MODEL +"\nAndroid version: " + Build.VERSION.RELEASE + "\nUsername: " + getusername() + "\nPassword: " + " " + "\nGps: " + CheckGPSFlag() + "\nCurrent Location: " + CurrentLocation();
        emailIntent.putExtra(Intent.EXTRA_EMAIL, new String[] { "krishna.vaddoriya@skyproductivity.com" });
        emailIntent.putExtra(Intent.EXTRA_SUBJECT, Emailsubject);
        emailIntent.putExtra(Intent.EXTRA_TEXT, shareBody);
        emailIntent.putExtra(Intent.EXTRA_STREAM, FileProvider.getUriForFile(sqlitewraper.context, BuildConfig.APPLICATION_ID + ".provider", mFileName));
        startActivity(Intent.createChooser(emailIntent,"Email Chooser"));
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

    private String getusername()
    {
        String username = null;
        database = sqlitewraper.getDatabase();
        Cursor c4 = database.rawQuery(
                "SELECT username FROM  Login_Master", null);
        c4.moveToLast();
        if (c4.getCount() > 0) {

            username = c4.getString(0);
        }
        return username;
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

    public void reqLocation() {

        LocationListener locationListener = new MyLocationListner();
        Location location1 = getLastKnownLocation();
        if (location1 != null) {
            locationListener.onLocationChanged(location1);
        }else {
            //Toast.makeText(sqlitewraper.context, "No Location Provider found", Toast.LENGTH_SHORT).show();
        }
    }

    private Location getLastKnownLocation() {
        locationManager = (LocationManager) sqlitewraper.context.getSystemService(LOCATION_SERVICE);
        List<String> providers = locationManager.getProviders(true);
        Location bestLocation = null;
        for (String provider : providers) {
            @SuppressLint("MissingPermission") Location l = locationManager.getLastKnownLocation(provider);
            if (l == null) {
                continue;
            }
            if (bestLocation == null || l.getAccuracy() < bestLocation.getAccuracy()) {
                // Found best last known location: %s", l);
                bestLocation = l;
            }
        }
        return bestLocation;
    }

    public class MyLocationListner implements LocationListener {
        @Override
        public void onLocationChanged(Location location) {

            mlat = String.valueOf(location.getLatitude());
            mlon = String.valueOf(location.getLongitude());


            Log.d("##lat :", String.valueOf(mlat) + "##lng :" + mlon);

        }

        @Override
        public void onStatusChanged(String provider, int status, Bundle extras) {
        }

        @Override
        public void onProviderEnabled(String provider) {
        }

        @Override
        public void onProviderDisabled(String provider) {

        }
    }

    private String CurrentLocation()
    {
        String lat_lng = "Lat: " + mlat + " Lng: " + mlon;
        return lat_lng;
    }
}
