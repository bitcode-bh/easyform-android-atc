package com.sky.atc.easyformse.utils;

import android.app.DownloadManager;
import android.content.Context;
import android.os.Build;
import android.os.Environment;
import android.util.Log;

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

    // The app folders that older versions created on shared storage.
    private static final String[] SHARED_FOLDERS = {"myDirectory", "Easy_form", "ATC", "RFTrack", "EASY_LOG",
            "Easform Reports", "Easy_form_pdf", "TestFolder"};
    private static volatile Boolean sharedUsable;

    /**
     * Android's legacy flag says whether the app is allowed to use shared storage, not whether it
     * can: after a reinstall the app folders on the card belong to the previous install's user id and
     * every write fails ("Unable to save image"). So test it: create a file in the shared root and in
     * each app folder that already exists there.
     */
    private static boolean sharedUsable() {
        Boolean known = sharedUsable;
        if (known != null) return known;
        File root = Environment.getExternalStorageDirectory();
        boolean ok = canWrite(root);
        String blocked = null;
        for (String name : SHARED_FOLDERS) {
            File folder = new File(root, name);
            if (ok && folder.isDirectory() && !canWrite(folder)) {
                ok = false;
                blocked = name;
            }
        }
        sharedUsable = ok;
        Log.i("APP_STORAGE", ok ? "using shared storage" : "using the app's own folder; shared storage is not writable"
                + (blocked == null ? "" : " (" + blocked + ")"));
        return ok;
    }

    /** The folder can be written to, and so can every app folder that already exists inside it. */
    private static boolean usable(File base) {
        if (base.isDirectory() && !canWrite(base)) return false;
        for (String name : SHARED_FOLDERS) {
            File folder = new File(base, name);
            if (folder.isDirectory() && !canWrite(folder)) return false;
        }
        return true;
    }

    private static boolean canWrite(File folder) {
        try {
            File probe = File.createTempFile(".mwfm", null, folder);
            //noinspection ResultOfMethodCallIgnored
            probe.delete();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /** Root for app folders such as Easy_form, ATC, RFTrack and EASY_LOG. */
    public static File root() {
        File own = sqlitewraper.context == null ? null : sqlitewraper.context.getExternalFilesDir(null);
        if (legacy() && sharedUsable()) return Environment.getExternalStorageDirectory();
        return own != null ? own : Environment.getExternalStorageDirectory();
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
        File shared = Environment.getExternalStoragePublicDirectory(type);
        if (legacy() && sharedUsable() && usable(shared)) return shared;
        return own != null ? own : shared;
    }

    /** Where a DownloadManager request saves {@code name}: the public Downloads folder, or the app's own. */
    public static void downloadTo(DownloadManager.Request request, String name) {
        Context context = sqlitewraper.context;
        File shared = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        boolean sharedOk = legacy() && sharedUsable() && usable(shared);
        if (!sharedOk && context != null) {
            request.setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS, name);
        } else {
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
        }
    }
}
