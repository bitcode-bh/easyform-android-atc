package com.sky.atc.easyformse.calender;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;

import com.riontech.calendar.CustomCalendar;
import com.riontech.calendar.Singleton;
import com.riontech.calendar.dao.EventData;
import com.riontech.calendar.dao.dataAboutDate;
import com.riontech.calendar.utils.CalendarUtils;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Random;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

@StringFogIgnore
public class MonthActivtiy extends AppCompatActivity {

    Toolbar toolbar;
    SQLiteDatabase database;
    ArrayList<String> tidarr = new ArrayList<>();
    ArrayList<String> datearr = new ArrayList<>();
    private CustomCalendar customCalendar;
    static ArrayList<String> allTaskDate = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.month_activity);
        database = sqlitewraper.getDatabase();
        customCalendar = (CustomCalendar) findViewById(R.id.customCalendar);
        toolbar = (Toolbar) findViewById(R.id.toolbar1);

        Singleton.getInstance().setSelectcondition(true);

        if (toolbar != null) {
            setSupportActionBar(toolbar);
            toolbar.setTitleTextColor(getResources().getColor(R.color.white));
//            toolbar.setLogo(R.drawable.atc_logo48);
            getSupportActionBar().setTitle(" Calender");
        }
        dateAndtid();
    }

    public void dateAndtid() {

        Cursor c = database.rawQuery("select tid,survey_date from task_master", null);

        c.moveToFirst();
        int count = c.getCount();
        for (int i = 0; i < count; ++i) {

            String tid = c.getString(0);
            Log.d("##SURTID", tid);
            String surveydate = c.getString(1);
            Log.d("##SURVEYDATE", surveydate);

            String outputDateStr = convertDateFormat(surveydate);
            allTaskDate.add(outputDateStr);

            Singleton.getInstance().setAllListDate(allTaskDate);


            Cursor c1 = database.rawQuery("select f_data from f_master where c_type = 5 and tid =" + tid, null);

            c1.moveToFirst();
            int count1 = c1.getCount();


            HashMap<String, String> listOfEvent = new HashMap<>();

            for (int j = 0; j < count1; ++j) {

                String data = c1.getString(0);
                try {
                    JSONArray newArray = new JSONArray(data);
                    for (int k = 0; k < newArray.length(); k++) {

                        JSONObject jsonObject = newArray.getJSONObject(k);
                        String jsonData = jsonObject.getString("data");

                        JSONArray jsonArray = new JSONArray(jsonData);
                        for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                            JSONObject obj = jsonArray.getJSONObject(k1);

                            String queid = obj.getString("que_id");

                            String siteidLocal, flowNameLocal, assignDateLocal, endDateLocal;
                            String siteId = null, flowName = null, assignDate = null, endDate = null;

                            if (queid.equals("1")) {
                                String ans = obj.getString("ans");
                                JSONArray ansArray = new JSONArray(ans);
                                siteId = ansArray.getString(0);
                                listOfEvent.put("siteid", siteId);

                            }
                            if (queid.equals("7")) {
                                Log.d("##queid7", queid);
                                String ans = obj.getString("ans");
                                JSONArray ansArray = new JSONArray(ans);
                                flowName = ansArray.getString(0);
                                listOfEvent.put("flowname", flowName);

                            }
                            if (queid.equals("10")) {

                                Log.d("##queid10", queid);
                                String ans = obj.getString("ans");
                                JSONArray ansArray = new JSONArray(ans);
                                assignDate = ansArray.getString(0);
                                listOfEvent.put("assigndate", assignDate);
                            }
                            if (queid.equals("1001")) {
                                Log.d("##queid1001", queid);
                                String ans = obj.getString("ans");
                                JSONArray ansArray = new JSONArray(ans);
                                endDate = ansArray.getString(0);
                                listOfEvent.put("enddate", endDate);

                            }
                        }
                    }


                    if (listOfEvent != null) {

                        String siteId = listOfEvent.get("siteid");
                        String flowName = listOfEvent.get("flowname");
                        String assignDate = listOfEvent.get("assigndate");
                        String endDate = listOfEvent.get("enddate");

                        if (siteId == null) {
                            siteId = "";
                        }
                        if (flowName == null) {
                            flowName = "";
                        }
                        if (assignDate == null) {
                            assignDate = "";
                        }
                        if (endDate == null) {
                            endDate = "";
                        }
                        customCalendar.addAnEvent(outputDateStr, count, getEventDataList(count, siteId, flowName, assignDate, endDate));
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
            c.moveToNext();
        }
        c.close();
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.maincalendar, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        int id = item.getItemId();

        if (id == R.id.day_view) {
            if (isRunning(this)) {
                Intent intent = new Intent(this, DayActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                startActivity(intent);
                finish();
            }
        }

        if (id == R.id.month_view) {
            if (!isRunning(this)) {
                Intent intent = new Intent(this, MonthActivtiy.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                startActivity(intent);
                finish();
            }
        }
        return super.onOptionsItemSelected(item);
    }

    public boolean isRunning(Context ctx) {
        ActivityManager activityManager = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
        List<ActivityManager.RunningTaskInfo> tasks = activityManager.getRunningTasks(Integer.MAX_VALUE);

        for (ActivityManager.RunningTaskInfo task : tasks) {
            if (ctx.getPackageName().equalsIgnoreCase(task.baseActivity.getPackageName()))
                return true;
        }

        return false;
    }

    public ArrayList<EventData> getEventDataList(int count, String siteidpass, String flownamepass, String assigndatepass, String enddatepass) {
        ArrayList<EventData> eventDataList = new ArrayList();

        EventData dateData = new EventData();
        ArrayList<dataAboutDate> dataAboutDates = new ArrayList();

        dateData.setSection(flownamepass);
        dataAboutDate dataAboutDate = new dataAboutDate();

        int index = new Random().nextInt(CalendarUtils.getEVENTS().length);

//            dataAboutDate.setTitle(CalendarUtils.getEVENTS()[index]);
        dataAboutDate.setTitle(siteidpass);
        dataAboutDate.setRemarks(enddatepass);
        dataAboutDate.setSubject(assigndatepass);
//            dataAboutDate.setSubmissionDate("Site Id :" + siteidpass);
//            dataAboutDate.setSubject(CalendarUtils.getEventsDescription()[index]);
        dataAboutDates.add(dataAboutDate);

        dateData.setData(dataAboutDates);
        eventDataList.add(dateData);

        return eventDataList;
    }

    private String convertDateFormat(String surveydate) {

        String date = "";
        DateFormat inputFormat = new SimpleDateFormat("MM/dd/yyyy");
        DateFormat outputFormat = new SimpleDateFormat("yyyy-MM-dd");
        String inputDateStr = surveydate;
        Date date1 = null;
        try {
            date1 = inputFormat.parse(inputDateStr);
            date = outputFormat.format(date1);
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return date;
    }
}
