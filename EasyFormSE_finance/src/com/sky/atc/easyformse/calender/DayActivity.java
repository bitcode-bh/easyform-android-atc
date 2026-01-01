package com.sky.atc.easyformse.calender;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.RectF;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.TextView;
import android.widget.Toast;

import com.guojunustb.library.DateTimeInterpreter;
import com.guojunustb.library.MyInterface;
import com.guojunustb.library.WeekDayView;
import com.guojunustb.library.WeekHeaderView;
import com.guojunustb.library.WeekViewEvent;
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
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 *
 */
@StringFogIgnore
public class DayActivity extends AppCompatActivity implements WeekDayView.MonthChangeListener,
        WeekDayView.EventClickListener, WeekDayView.EventLongPressListener, WeekDayView.EmptyViewClickListener, WeekDayView.EmptyViewLongPressListener, WeekDayView.ScrollListener, MyInterface {
    Toolbar toolbar;
    SQLiteDatabase database;
    List<WeekViewEvent> mNewEvent = new ArrayList<WeekViewEvent>();
    //view
    private WeekDayView mWeekView;
    private WeekHeaderView mWeekHeaderView;
    private TextView mTv_date;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.day_activity);
        database = sqlitewraper.getDatabase();
        assignViews();
    }

    private void assignViews() {
        mWeekView = (WeekDayView) findViewById(R.id.weekdayview);
        mWeekHeaderView = (WeekHeaderView) findViewById(R.id.weekheaderview);
        mTv_date = (TextView) findViewById(R.id.tv_date);
        toolbar = (Toolbar) findViewById(R.id.toolbar);

        if (toolbar != null) {
            setSupportActionBar(toolbar);
            toolbar.setTitleTextColor(getResources().getColor(R.color.white));
            getSupportActionBar().setTitle(" Calender");
        }

        //init WeekView
        mWeekView.setMonthChangeListener(this);
        mWeekView.setEventLongPressListener(this);
        mWeekView.setOnEventClickListener(this);
        mWeekView.setScrollListener(this);
        mWeekHeaderView.setDateSelectedChangeListener(new WeekHeaderView.DateSelectedChangeListener() {
            @Override
            public void onDateSelectedChange(Calendar oldSelectedDay, Calendar newSelectedDay) {
                mWeekView.goToDate(newSelectedDay);
            }
        });
        mWeekHeaderView.setScrollListener(new WeekHeaderView.ScrollListener() {
            @Override
            public void onFirstVisibleDayChanged(Calendar newFirstVisibleDay, Calendar oldFirstVisibleDay) {
                mWeekView.goToDate(mWeekHeaderView.getSelectedDay());
            }
        });


        Calendar cal = Calendar.getInstance();
        SimpleDateFormat month_date = new SimpleDateFormat("MMMM yyyy");
        String month_name = month_date.format(cal.getTime());
        mTv_date.setText(month_name);
        mWeekHeaderView.setOnClickListener(this);
        setupDateTimeInterpreter(false);

    }


    /**
     * Set up a date time interpreter which will show short date values when in week view and long
     * date values otherwise.
     *
     * @param shortDate True if the date values should be short.
     */
    private void setupDateTimeInterpreter(final boolean shortDate) {
        final String[] weekLabels = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
        mWeekView.setDateTimeInterpreter(new DateTimeInterpreter() {
            @Override
            public String interpretDate(Calendar date) {
                SimpleDateFormat weekdayNameFormat = new SimpleDateFormat("EEE", Locale.getDefault());
                String weekday = weekdayNameFormat.format(date.getTime());
                SimpleDateFormat format = new SimpleDateFormat("d", Locale.getDefault());
                return format.format(date.getTime());
            }

            @Override
            public String interpretTime(int hour) {
                return String.format("%02d:00", hour);

            }

            @Override
            public String interpretWeek(int date) {
                if (date > 7 || date < 1) {
                    return null;
                }
                return weekLabels[date - 1];
            }
        });
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
            if (!isRunning(this)) {
                Intent intent = new Intent(this, DayActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                startActivity(intent);
                finish();
            }

        }
        if (id == R.id.month_view) {

            if (isRunning(this)) {
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

    @Override
    public List<WeekViewEvent> onMonthChange(int newYear, int newMonth) {


        List<WeekViewEvent> events = new ArrayList<>();

        ArrayList<HashMap<String, String>> listOfEventList = dateAndtid();

        for (int i = 0; i < listOfEventList.size(); i++) {
            HashMap<String, String> listOfEvent = listOfEventList.get(i);

            String date = "";
            String enddate = "";
            String month = "";
            String endmonth = "";
            String year = "";
            String endyear = "";
            String hour = "";
            String endhour = "";
            String min ="";
            String endmin ="";
            String finalflowname ="";
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

                    HashMap<String, String> datesandtime = getAssignDateandtime(assignDate,flowName,endDate);

                    if (datesandtime != null && datesandtime.size() != 0) {

                        date = datesandtime.get("finaldate");
                        enddate = datesandtime.get("finalenddate");
                        month = datesandtime.get("finalmonth");
                        endmonth = datesandtime.get("finalendmonth");
                        year = datesandtime.get("finalyear");
                        endyear = datesandtime.get("finalendyear");
                        hour = datesandtime.get("finalhour");
                        endhour = datesandtime.get("finalendhour");
                        min = datesandtime.get("finalmin");
                        endmin = datesandtime.get("finalendmin");
                        finalflowname = datesandtime.get("flowname");


                        Calendar startTime = Calendar.getInstance();
                        startTime.set(Calendar.DAY_OF_MONTH, Integer.parseInt(date));
                        startTime.set(Calendar.HOUR_OF_DAY, Integer.parseInt(hour));
                        startTime.set(Calendar.MINUTE, Integer.parseInt(min));
                        startTime.set(Calendar.MONTH, Integer.parseInt(month) -1);
                        startTime.set(Calendar.YEAR, Integer.parseInt(year));
                        Calendar endTime = (Calendar) startTime.clone();
                        endTime.set(Calendar.DAY_OF_MONTH, Integer.parseInt(enddate));
                        endTime.set(Calendar.HOUR_OF_DAY, Integer.parseInt(endhour));
                        endTime.set(Calendar.MINUTE, Integer.parseInt(endmin));
                        endTime.set(Calendar.MONTH, Integer.parseInt(endmonth) - 1);
                        endTime.set(Calendar.YEAR, Integer.parseInt(endyear));
                        WeekViewEvent event = new WeekViewEvent(1, finalflowname, startTime, endTime);
                        event.setColor(getResources().getColor(R.color.event_color_01));
                        events.add(event);
                        events.addAll(mNewEvent);
                    }
//                }
            }


        }
        return events;

    }

    private String getEventTitle(Calendar time) {
        return String.format("Event of %02d:%02d %s/%d", time.get(Calendar.HOUR_OF_DAY), time.get(Calendar.MINUTE), time.get(Calendar.MONTH) + 1, time.get(Calendar.DAY_OF_MONTH));
    }

    @Override
    public void onEventClick(WeekViewEvent event, RectF eventRect) {
        Toast.makeText(DayActivity.this, "Clicked " + event.getName(), Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onEventLongPress(WeekViewEvent event, RectF eventRect) {
        Toast.makeText(DayActivity.this, "Long pressed event: " + event.getName(), Toast.LENGTH_SHORT).show();
    }


    @Override
    public void onEmptyViewClicked(Calendar time) {
        Toast.makeText(DayActivity.this, "Empty View clicked " + time.get(Calendar.YEAR) + "/" + time.get(Calendar.MONTH) + "/" + time.get(Calendar.DAY_OF_MONTH), Toast.LENGTH_LONG).show();
    }

    @Override
    public void onEmptyViewLongPress(Calendar time) {
        Toast.makeText(DayActivity.this, "Empty View long  clicked " + time.get(Calendar.YEAR) + "/" + time.get(Calendar.MONTH) + "/" + time.get(Calendar.DAY_OF_MONTH), Toast.LENGTH_LONG).show();

    }

    @Override
    public void onFirstVisibleDayChanged(Calendar newFirstVisibleDay, Calendar oldFirstVisibleDay) {

    }

    @Override
    public void onSelectedDaeChange(Calendar selectedDate) {
        mWeekHeaderView.setSelectedDay(selectedDate);

        SimpleDateFormat month_date = new SimpleDateFormat("MMM yyyy");
        String month_name = month_date.format(selectedDate.getTime());
        mTv_date.setText(month_name);
    }


    @Override
    public void onClick(String date) {

        mTv_date.setText(date);

    }

    public ArrayList<HashMap<String, String>> dateAndtid() {


        Cursor c = database.rawQuery("select tid,survey_date from task_master", null);

        c.moveToFirst();
        int count = c.getCount();
        HashMap<String, String> listOfEvent = null;
        ArrayList<HashMap<String, String>> listOftid = new ArrayList<>();

        for (int i = 0; i < count; ++i) {

            String tid = c.getString(0);
            Log.d("##SURTID", tid);
            String surveydate = c.getString(1);
            Log.d("##SURVEYDATE", surveydate);

            String outputDateStr = convertDateFormat(surveydate);

            Cursor c1 = database.rawQuery("select f_data from f_master where c_type = 5 and tid =" + tid, null);

            c1.moveToFirst();
            int count1 = c1.getCount();

            listOfEvent = new HashMap<>();

            for (int j = 0; j < count1; ++j) {

                String data = c1.getString(0);
                c1.close();
                try {
                    JSONArray newArray = new JSONArray(data);
                    for (int k = 0; k < newArray.length(); k++) {

                        JSONObject jsonObject = newArray.getJSONObject(k);
                        String jsonData = jsonObject.getString("data");

                        JSONArray jsonArray = new JSONArray(jsonData);
                        for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                            JSONObject obj = jsonArray.getJSONObject(k1);

                            String queid = obj.getString("que_id");

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

                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
            listOftid.add(listOfEvent);
            c.moveToNext();
        }
        c.close();
        return listOftid;
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

    private HashMap<String, String> getAssignDateandtime(String surveydate,String flowname,String surveyEnddate) {
        HashMap<String, String> listOfdateandtime = new HashMap<>();
        String finaldate = "";
        String finalenddate = "";
        String finalyear = "";
        String finalendyear = "";
        String finalmonth = "";
        String finalendmonth = "";
        String finalmin = "";
        String finalendmin = "";
        String finalhour = "";
        String finalendhour = "";
        DateFormat inputFormat = new SimpleDateFormat("MM/dd/yyyy HH:mm");
        DateFormat month = new SimpleDateFormat("MM");
        DateFormat date = new SimpleDateFormat("dd");
        DateFormat year = new SimpleDateFormat("yyyy");
        DateFormat hour = new SimpleDateFormat("HH");
        DateFormat min = new SimpleDateFormat("mm");
        String inputDateStr = surveydate;
        Date date1 = null;
        Date date2 = null;
        try {
            date1 = inputFormat.parse(inputDateStr);
            finalmonth = month.format(date1);
            finaldate = date.format(date1);
            finalyear = year.format(date1);
            finalhour = hour.format(date1);
            finalmin = min.format(date1);

            date2 = inputFormat.parse(surveyEnddate);
            finalendmonth = month.format(date2);
            finalenddate = date.format(date2);
            finalendyear = year.format(date2);
            finalendhour = hour.format(date2);
            finalendmin = min.format(date2);


            listOfdateandtime.put("finalmonth",finalmonth);
            listOfdateandtime.put("finaldate",finaldate);
            listOfdateandtime.put("finalyear",finalyear);
            listOfdateandtime.put("finalhour",finalhour);
            listOfdateandtime.put("finalmin",finalmin);
            listOfdateandtime.put("finalendmonth",finalendmonth);
            listOfdateandtime.put("finalenddate",finalenddate);
            listOfdateandtime.put("finalendyear",finalendyear);
            listOfdateandtime.put("finalendhour",finalendhour);
            listOfdateandtime.put("finalendmin",finalendmin);
            listOfdateandtime.put("flowname",flowname);


        } catch (ParseException e) {
            e.printStackTrace();
        }
        return listOfdateandtime;
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();
    }
}
