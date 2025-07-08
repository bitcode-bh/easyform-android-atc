package com.sky.atc.easyformse.download.utils;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;

import androidx.annotation.NonNull;
import androidx.fragment.app.FragmentActivity;


import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

/**
 * Created by NareshChocha on 02-09-2021.
 */
public class Utils {

    public static File getDownloadPathFile(Context context) {
        return context.getExternalFilesDir(Environment.DIRECTORY_DCIM);
    }
}