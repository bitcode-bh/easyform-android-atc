package com.sky.atc.easyformse.utils;

import android.app.DownloadManager;
import android.content.Context;
import android.os.Build;
import android.os.Environment;

import com.sky.atc.easyformse.sqlitewraper;

import java.io.File;

/**
 * Where the app keeps its files on shared storage.
 *
 * Today (and on any phone where the app still has legacy storage access) these return the
 * public folders the app has always used, so nothing moves. Once Android enforces scoped
 * storage for the app (a fresh install that targets Android 11 or later, or a phone that
 * dropped legacy access), the same calls return the app's own folder under Android/data,
 * which needs no permission. Every external path in the app goes through here so that
 * switch is made in one place.
 */
public final class AppStorage {

    private AppStorage() {
    }

    /** True when the app can still write straight to the public folders. */
    public static boolean legacy() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.R || Environment.isExternalStorageLegacy();
    }

    /** Root for app folders such as Easy_form, ATC, RFTrack and EASY_LOG. */
    public static File root() {
        File own = sqlitewraper.context == null ? null : sqlitewraper.context.getExternalFilesDir(null);
        if (!legacy() && own != null) return own;
        return Environment.getExternalStorageDirectory();
    }

    public static File pictures() {
        return publicOrOwn(Environment.DIRECTORY_PICTURES);
    }

    public static File documents() {
        return publicOrOwn(Environment.DIRECTORY_DOCUMENTS);
    }

    public static File downloads() {
        return publicOrOwn(Environment.DIRECTORY_DOWNLOADS);
    }

    private static File publicOrOwn(String type) {
        Context context = sqlitewraper.context;
        File own = context == null ? null : context.getExternalFilesDir(type);
        if (!legacy() && own != null) return own;
        return Environment.getExternalStoragePublicDirectory(type);
    }

    /** Where a DownloadManager request saves {@code name}: the public Downloads folder, or the app's own. */
    public static void downloadTo(DownloadManager.Request request, String name) {
        Context context = sqlitewraper.context;
        if (!legacy() && context != null) {
            request.setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS, name);
        } else {
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
        }
    }
}
