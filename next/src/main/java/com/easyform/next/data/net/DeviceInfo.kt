package com.easyform.next.data.net

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.provider.Settings
import com.google.android.gms.ads.identifier.AdvertisingIdClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

/** The device id the server ties an account to, worked out the way the old app does (so it is the same id on this phone). */
object DeviceInfo {
    suspend fun deviceId(context: Context): String = withContext(Dispatchers.IO) {
        val ad = try { AdvertisingIdClient.getAdvertisingIdInfo(context).id } catch (e: Exception) { null }
        if (!ad.isNullOrBlank() && ad != "00000000-0000-0000-0000-000000000000") ad
        else Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID).orEmpty()
    }

    /** The "deviceinfo" text sent at login: OS, make, model and memory, in the old app's keys. */
    fun describe(context: Context): String {
        val memory = ActivityManager.MemoryInfo().also { (context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager).getMemoryInfo(it) }
        return JSONArray()
            .put(JSONObject().put("OSVERSION", Build.VERSION.RELEASE).put("BRAND", Build.BRAND).put("MODEL", Build.MODEL))
            .put(JSONObject().put("TOTALMEMORY", memory.totalMem).put("FREEMEMORY", memory.availMem))
            .toString()
    }
}
