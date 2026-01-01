package com.sky.atc.easyformse.plugins;

import static com.sky.atc.easyformse.sqlitewraper.getMainactivity;
import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.Manifest;
import android.app.AlertDialog;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;
import android.provider.Settings;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.sky.atc.easyformse.B_new;
import com.sky.atc.easyformse.MainActivity;
import com.sky.atc.easyformse.NewWebservicesCallEasyform;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.cameraactivity;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.concurrent.ExecutorService;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

//to add Event in calender
@StringFogIgnore
public class CalendarEventPlugin extends CordovaPlugin {
    static final String TAG = "CalendarEventPlugin";
    private ExecutorService executorService;
    private CallbackContext callbackContext;
    private static final int REQUEST_CALENDAR_PERMISSION = 100;
    String title;
    String description;
    String eventType;
    long eventStartMs;
    long eventEndMs;
    JSONArray mJsonArray;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        try {
            this.callbackContext = callbackContext;
            executorService = this.cordova.getThreadPool();
            mJsonArray = args;
            LogUtils.photoLogFile("CalendarEventPlugin :" + args, "execute");
            title = args.getJSONObject(0).getString("event_subject");
            description = args.getJSONObject(0).getString("event_description");
            eventType = args.getJSONObject(0).getString("event_type");
            eventStartMs = Long.parseLong(args.getJSONObject(0).getString("event_start_ms"));
            eventEndMs = Long.parseLong(args.getJSONObject(0).getString("event_end_ms"));
            if (checkPermission()) {
                addEventToCalendar();
                return true;
            } else {
                requestCalendarPermissions();
                return true;
            }

        } catch (Exception e) {
            LogUtils.photoLogFile("CalendarEventPlugin :" + e, "execute");
            Log.d(TAG, e.toString());
            callbackContext.error("error");
            return false;
        }

    }

    public boolean addEventToCalendar() {
        if (  this.callbackContext != null) {
            addEvent(sqlitewraper.context, eventStartMs, eventEndMs, title, description);
            callAddEventWebServes(mJsonArray);
            return true;
        } else {
            return false;
        }
    }

    private void callAddEventWebServes(JSONArray apiBodyJson) {
        final String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL);
        final String API = "Send_Calander_Eevent";
        executorService.execute(() -> {
            SQLiteDatabase database = sqlitewraper.getDatabase();
            Cursor c3 = database.rawQuery("SELECT username,company_id,appid,user_id FROM Login_Master",
                    null);
            c3.moveToLast();
            String username = c3.getString(0);
            B_new b = new B_new();
            String u_c = b.GetValue();
            int company_id = c3.getInt(1);
            String appid = c3.getString(2);
            String UserId = c3.getString(3);
            c3.close();


            MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
            String roleid = prefs.getString("authroleidn", "0");
            String companyFeatureid = prefs.getString("authcompanyfid", "0");


            JSONObject data2 = new JSONObject();
            try {
                data2.put("username", username);
                data2.put("u_c", u_c);
                data2.put("appid", appid);
                data2.put("user_id", UserId);
                data2.put("Role_Id", roleid);
                data2.put("Company_Feature_Id", companyFeatureid);
                data2.put("matchId", "0");
            } catch (JSONException e) {
                e.printStackTrace();
            }


            String auth1 = data2.toString();

            OkHttpClient okHttpClient = NewWebservicesCallEasyform.getOkHttpClient();
            String appUrl = WCFURL + API;
            MediaType JSON = MediaType.parse("application/json; charset=utf-8");
            RequestBody body1 = RequestBody.create(JSON, apiBodyJson.toString());
            Request request = new Request.Builder()
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/json; charset=utf-8")
                    .header("auth1", auth1)
                    .header("Role_Id", roleid)
                    .header("Company_Feature_Id", companyFeatureid)
                    .header("matchId", "0")
                    .post(body1)
                    .url(appUrl)
                    .build();

            if (!auth1.equalsIgnoreCase("")) {

                okHttpClient.newCall(request).enqueue(new Callback() {
                    @Override
                    public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                        if (response.isSuccessful() && response.code() == 200) {
                            Log.d("##WEBSERVICE2", response.body().string());
                            if (callbackContext != null)
                                callbackContext.success();
                        } else {
                            if (callbackContext != null)
                                callbackContext.error("");
                            Log.d("##WEBSERVICE2", "response:: " + response
                                    + " code:: " + response.code() +
                                    "body:: " + response.body());
                        }
                    }

                    @Override
                    public void onFailure(@NonNull Call call, @NonNull IOException e) {
                        if (callbackContext != null)
                            callbackContext.error("");
                        Log.d("##WEBSERVICE2", e.toString());
                    }
                });
            } else {
                if (callbackContext != null)
                    callbackContext.error("auth1 is null");
                Log.d("##WEBSERVICE2", "auth1 is null " + auth1);
            }
        });
    }

    private void addEvent(Context context, long eventStartMs, long eventEndMs, String title, String description) {

//        GregorianCalendar calDate = new GregorianCalendar(year, month, day, hour, minute);
        ContentResolver cr = context.getContentResolver();
        ContentValues values = new ContentValues();
        values.put(CalendarContract.Events.DTSTART, eventStartMs);
        values.put(CalendarContract.Events.DTEND, eventEndMs);
        values.put(CalendarContract.Events.TITLE, title);
        values.put(CalendarContract.Events.DESCRIPTION, description);
        values.put(CalendarContract.Events.CALENDAR_ID, 1);
        values.put(CalendarContract.Events.EVENT_TIMEZONE, Calendar.getInstance()
                .getTimeZone().getID());
        System.out.println(Calendar.getInstance().getTimeZone().getID());
//        if (ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.WRITE_CALENDAR) +
//                ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.WRITE_CALENDAR) != PackageManager.PERMISSION_GRANTED) {
//            requestCalendarPermissions();
//        }
        Uri uri = cr.insert(CalendarContract.Events.CONTENT_URI, values);
        long eventId = Long.parseLong(uri.getLastPathSegment());
        setReminder(cr, eventId, 5);
        setReminder(cr, eventId, 60);
        setReminder(cr, eventId, 1440);
    }

    private boolean checkPermission() {
        if (ContextCompat.checkSelfPermission(this.cordova.getActivity(), Manifest.permission.READ_CALENDAR) +
                ContextCompat.checkSelfPermission(this.cordova.getActivity(), Manifest.permission.WRITE_CALENDAR) != PackageManager.PERMISSION_GRANTED) {
            // Permission is not granted
            return false;
        }
        return true;
    }

    private void requestCalendarPermissions() {
        // If the app does not have the required permissions, request them
        cordova.requestPermissions(this,REQUEST_CALENDAR_PERMISSION,
                new String[]{Manifest.permission.READ_CALENDAR,Manifest.permission.WRITE_CALENDAR});

    }


    @Override
    public void onRequestPermissionResult(int requestCode, String[] permissions, int[] grantResults) {
        try{
            if (requestCode == REQUEST_CALENDAR_PERMISSION) {
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED
                        && grantResults[1] == PackageManager.PERMISSION_GRANTED) {
                    // Permissions granted, proceed with accessing the calendar
                    addEventToCalendar();
                } else {

                    if ( ContextCompat.checkSelfPermission(this.cordova.getActivity(), Manifest.permission.WRITE_CALENDAR) +
                            ContextCompat.checkSelfPermission(this.cordova.getActivity(), Manifest.permission.READ_CALENDAR) != PackageManager.PERMISSION_GRANTED)  {

                        showMessageOKCancel("You need to allow access calender permission",
                                new DialogInterface.OnClickListener() {
                                    @Override
                                    public void onClick(DialogInterface dialog, int which) {
                                        Intent intent = new Intent();
                                        intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                                        intent.setData(Uri.fromParts("package", mainactivity.getPackageName(), null));
                                        mainactivity.startActivity(intent);
                                        //finish();

                                    }
                                });

                    }


                  //  Toast.makeText(sqlitewraper.context, "Calendar permission denied", Toast.LENGTH_SHORT).show();

                    // Permissions denied, show an explanation or disable functionality
                }
            }
        }
        catch (Exception e)
        {
            Log.d("##WEBSERVICE2", e.toString());
        }
    }

    private void showMessageOKCancel(String message, DialogInterface.OnClickListener okListener) {
        new AlertDialog.Builder(this.cordova.getActivity())
                .setMessage(message)
                .setPositiveButton("OK", okListener)
                .setCancelable(false)
                .create()
                .show();
    }

    // routine to add reminders with the event
    private void setReminder(ContentResolver cr, long eventID, int timeBefore) {

        ContentValues values = new ContentValues();
        values.put(CalendarContract.Reminders.MINUTES, timeBefore);
        values.put(CalendarContract.Reminders.EVENT_ID, eventID);
        values.put(CalendarContract.Reminders.METHOD, CalendarContract.Reminders.METHOD_ALERT);
        if (ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.WRITE_CALENDAR) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        Uri uri = cr.insert(CalendarContract.Reminders.CONTENT_URI, values);
        Cursor c = CalendarContract.Reminders.query(cr, eventID,
                new String[]{CalendarContract.Reminders.MINUTES});
        if (c.moveToFirst()) {
            System.out.println("calendar"
                    + c.getInt(c.getColumnIndex(CalendarContract.Reminders.MINUTES)));
        }
        c.close();
    }

    public void removeEvent(Context context) {
        ContentResolver cr = context.getContentResolver();

        int iNumRowsDeleted = 0;

//        Uri eventsUri = Uri.parse(CALENDAR_URI_BASE+"events");
//        Uri eventUri = ContentUris.withAppendedId(eventsUri,eventId);
//        iNumRowsDeleted = cr.delete(eventUri, null, null);
//
//        Log.i("", "Deleted " + iNumRowsDeleted + " calendar entry.");
    }

    public int updateEvent(Context context, int year, int month, int day, int hour, int minute) {
        int iNumRowsUpdated = 0;
        GregorianCalendar calDate = new GregorianCalendar(year, month, day, hour, minute);

        ContentValues event = new ContentValues();

        event.put(CalendarContract.Events.TITLE, "title");
        event.put("hasAlarm", 1); // 0 for false, 1 for true
        event.put(CalendarContract.Events.DTSTART, calDate.getTimeInMillis());
        event.put(CalendarContract.Events.DTEND, calDate.getTimeInMillis() + 60 * 60 * 1000);

//        Uri eventsUri = Uri.parse(CALENDAR_URI_BASE+"events");
//        Uri eventUri = ContentUris.withAppendedId(eventsUri, eventId);

//        iNumRowsUpdated = context.getContentResolver().update(eventUri, event, null,
//                null);
//
//        // TODO put text into strings.xml
//        Log.i("", "Updated " + iNumRowsUpdated + " calendar entry.");

        return iNumRowsUpdated;
    }
}
