package com.nareshchocha.app.weatherapp.ui.activitys;

import android.Manifest;
import android.app.Activity;
import android.app.ProgressDialog;
import android.content.Intent;
import android.location.Criteria;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.nareshchocha.app.weatherapp.R;
import com.nareshchocha.app.weatherapp.listener.EasyWeatherWeatherServiceListener;
import com.nareshchocha.app.weatherapp.model.HourlyWeather;
import com.nareshchocha.app.weatherapp.model.ListItem;
import com.nareshchocha.app.weatherapp.model.WeatherData;
import com.nareshchocha.app.weatherapp.service.EasyWeatherWeatherService;
import com.nareshchocha.app.weatherapp.ui.fragments.EasyWeatherWeatherConditionFragment;
import com.nareshchocha.app.weatherapp.ui.fragments.WeatherAdapter;
import com.nareshchocha.app.weatherapp.utils.LogUtils;
import com.squareup.picasso.Picasso;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class EasyWeatherWeatherActivity extends AppCompatActivity implements LocationListener {
    private static final String TAG = "EasyWeatherWeatherActivity";
    public static int GET_WEATHER_FROM_CURRENT_LOCATION = 1;


    private TextView conditionTextView;

    Double lat;
    private ProgressDialog loadingDialog;
    private TextView locationTextView;
    Double lon;
    private TextView temperatureTextView;
    private ImageView weatherIconImageView;
    private EasyWeatherWeatherService weatherService;
    private boolean weatherServicesHasFailed = false;
    String OnlyInfoSend;
    private TextView feellikeTextView;
    private TextView dateTextView;
    private TextView sunrisetextview,sunsettextview;
    private  TextView Windtextview,Humiditytextview;
    RecyclerView hourlyRecyclerView ;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.easyweather_activity_weather);

        Intent intent = getIntent();
        this.lat = Double.valueOf(intent.getDoubleExtra("lat", 23.0225d));
        this.lon = Double.valueOf(intent.getDoubleExtra("lon", 72.5714d));
        this.OnlyInfoSend = intent.getStringExtra("OnlyInfoSend");
        this.weatherIconImageView = (ImageView) findViewById(R.id.weatherIconImageView);
        this.temperatureTextView = (TextView) findViewById(R.id.temperatureTextView);
        this.conditionTextView = (TextView) findViewById(R.id.conditionTextView);
        this.locationTextView = (TextView) findViewById(R.id.locationTextView);
        this.feellikeTextView = (TextView) findViewById(R.id.feellikeTextView);
        this.dateTextView = (TextView) findViewById(R.id.dateTextView);
        this.sunrisetextview = findViewById(R.id.sunrisetextview);
        this.sunsettextview = findViewById(R.id.sunsettextview);
        this.Windtextview = findViewById(R.id.Windtextview);
        this.Humiditytextview = findViewById(R.id.Humiditytextview);
        this.hourlyRecyclerView  = findViewById(R.id.recyclerHourly);
//        this.locationTextView.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View v) {
//
//                Intent intent = new Intent();
//                intent.putExtra("status",EasyWeatherWeatherActivity.this.locationTextView.getText().toString());
//                setResult(Activity.RESULT_OK, intent);
//                finish();
//            }
//        });

        // call api and handle success and failed
        this.weatherService = new EasyWeatherWeatherService(new EasyWeatherWeatherServiceListener() {
            @Override
            public void serviceFailure(String exception) {
                if (EasyWeatherWeatherActivity.this.weatherServicesHasFailed) {
                    EasyWeatherWeatherActivity.this.loadingDialog.hide();
                    Toast.makeText(EasyWeatherWeatherActivity.this, "Poor Internet Connection", Toast.LENGTH_LONG).show();
                    return;
                }
                EasyWeatherWeatherActivity.this.weatherServicesHasFailed = true;
                Toast.makeText(EasyWeatherWeatherActivity.this, "Poor Internet Connection", Toast.LENGTH_LONG).show();
            }

            @Override
            public void serviceSuccess(WeatherData weatherResponse,String alldata) {
                EasyWeatherWeatherActivity.this.loadingDialog.hide();
                if (weatherResponse != null) {
                    try {
                        String currenttime = new SimpleDateFormat("dd MMM yyyy HH:mm", Locale.getDefault()).format(new Date());
                        dateTextView.setText(currenttime);

                        getaddress(Double.valueOf(lat),Double.valueOf(lon));
                        // EasyWeatherWeatherActivity.this.locationTextView.setText(weatherResponse.getCity().getName() + "," + weatherResponse.getCity().getCountry());
                        int currentweather = (int) weatherResponse.getList().get(0).getMain().getTemp();
                        EasyWeatherWeatherActivity.this.temperatureTextView.setText( currentweather +"°");
                        EasyWeatherWeatherActivity.this.feellikeTextView.setText("Feels like " +(int) weatherResponse.getList().get(0).getMain().getFeelsLike() +"°");
                       // int iconResId = getIconResourceId(weatherResponse.getList().get(0).getWeather().get(0).getIcon());
                        setWeatherIcon(EasyWeatherWeatherActivity.this.weatherIconImageView,weatherResponse.getList().get(0).getWeather().get(0).getIcon());
                        EasyWeatherWeatherActivity.this.conditionTextView.setText(weatherResponse.getList().get(0).getWeather().get(0).getDescription());

                        String sunriseFormatted = formatTime(weatherResponse.getCity().getSunrise(), weatherResponse.getCity().getTimezone());
                        EasyWeatherWeatherActivity.this.sunrisetextview.setText("Sunrise : " + sunriseFormatted );
                        String sunsetFormatted = formatTime(weatherResponse.getCity().getSunset(), weatherResponse.getCity().getTimezone());
                        EasyWeatherWeatherActivity.this.sunsettextview.setText("Sunset : " + sunsetFormatted );
                        EasyWeatherWeatherActivity.this.Windtextview.setText( "Wind : "+ weatherResponse.getList().get(0).getWind().getGust() + " m/s" );
                        EasyWeatherWeatherActivity.this.Humiditytextview.setText( "Humidity : "  + weatherResponse.getList().get(0).getMain().getHumidity() + " %");
                        int day = 0;
                        while (day < weatherResponse.getList().size() && day < 6) {
                            ListItem currentCondition = weatherResponse.getList().get(day);
                            EasyWeatherWeatherConditionFragment fragment = (EasyWeatherWeatherConditionFragment) getSupportFragmentManager().findFragmentById(getResources().getIdentifier("forecast_" + day, "id", getPackageName()));
                            if (fragment != null) {
                                fragment.loadForecast(
                                        EasyWeatherWeatherService.dayStringFormat(currentCondition.getDtTxt()),
                                        weatherResponse.getList().get(0).getWeather().get(0).getIcon(),
                                        weatherResponse.getList().get(day).getMain().getTempMax() + "",
                                        weatherResponse.getList().get(day).getMain().getTempMin() + "",
                                        weatherResponse.getList().get(0).getWeather().get(0).getDescription());
                            }
                            day++;
                        }

                        // Now add hourly forecast in RecyclerView
                        hourlyRecyclerView.setLayoutManager(new LinearLayoutManager(EasyWeatherWeatherActivity.this, LinearLayoutManager.HORIZONTAL, false));
                        List<HourlyWeather> hourlyList = new ArrayList<>();
                        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
                        SimpleDateFormat fullFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());

                        String todayStr = dateFormat.format(new Date());
                        Date now = new Date();

                        ListItem latestPastItem = null;
                        for (ListItem item : weatherResponse.getWithoutfilter()) {

                            String dtTxt = item.getDtTxt();
                            Date forecastDate = fullFormat.parse(dtTxt);
                            String forecastDay = dateFormat.format(forecastDate);

                            if (forecastDay.equals(todayStr)) {
                                if (forecastDate.before(now)) {
                                    if (latestPastItem == null || fullFormat.parse(latestPastItem.getDtTxt()).before(forecastDate)) {
                                        latestPastItem = item;
                                    }
                                }
                                else {

                                    String time = item.getDtTxt().split(" ")[1].substring(0, 5);
                                    int temp = (int) item.getMain().getTemp();
                                    String description = item.getWeather().get(0).getDescription();
                                    String icon = item.getWeather().get(0).getIcon();

                                    hourlyList.add(new HourlyWeather(time, temp, description, icon));
                                }
                            }
                        }
                        if (latestPastItem != null) {
                            String time = latestPastItem.getDtTxt().split(" ")[1].substring(0, 5);
                            int temp = (int) latestPastItem.getMain().getTemp();
                            String description = latestPastItem.getWeather().get(0).getDescription();
                            String icon = latestPastItem.getWeather().get(0).getIcon();

                            // Insert at beginning
                            hourlyList.add(0, new HourlyWeather(time, temp, description, icon));
                        }
                        WeatherAdapter adapter = new WeatherAdapter(EasyWeatherWeatherActivity.this, hourlyList);
                        hourlyRecyclerView.setAdapter(adapter);
                    } catch (Exception e) {
                        LogUtils.weatherErrorLogFile("\nNareshError=>" + e.toString(), "api Exception succ String " + TAG);
                    }
                } else {
                    LogUtils.weatherErrorLogFile("\nError=> weatherResponse Null", "api Exception succ String " + TAG);
                }
            }
        }, this);

        //  getWeatherFromCurrentLocation();

    }

    @Override
    protected void onStart() {
        super.onStart();
        this.loadingDialog = new ProgressDialog(this);
        this.loadingDialog.setMessage("Loading");
        this.loadingDialog.setCancelable(false);
        this.loadingDialog.show();

        this.weatherService.refreshWeather(this.lat, this.lon);
    }

    private void getWeatherFromCurrentLocation() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != 0 && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != 0) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, GET_WEATHER_FROM_CURRENT_LOCATION);
            return;
        }
        LocationManager locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        boolean isNetworkEnabled = locationManager.isProviderEnabled("network");
        boolean isGPSEnabled = locationManager.isProviderEnabled("gps");
        Criteria locationCriteria = new Criteria();
        if (isNetworkEnabled) {
            locationCriteria.setAccuracy(Criteria.ACCURACY_COARSE);
        } else if (isGPSEnabled) {
            locationCriteria.setAccuracy(Criteria.ACCURACY_FINE);
        }
        locationManager.requestSingleUpdate(locationCriteria, this, null);
    }


    void setWeatherIcon(ImageView view, String iconPath) {
        if (iconPath.isEmpty()) {
            return;
        }
        Picasso.with(this).load("http://openweathermap.org/img/wn/" + iconPath + "@2x.png").into(view);

        /*Picasso.get().cancelRequest(view);
        // http://openweathermap.org/img/wn/10d@2x.png
        String newPath = iconPath.replace(iconPath, "a" + iconPath);
        int imageid =
                view.getContext().getResources().getIdentifier(newPath + "_svg", "drawable", view.getContext().getPackageName());
        Drawable imageDrawable = ResourcesCompat.getDrawable(view.getContext().getResources(), imageid, null);
        view.setImageDrawable(imageDrawable);*/

    }


    public void onLocationChanged(Location location) {
        //  this.weatherService.refreshWeather(location.getLatitude(),location.getLongitude());
    }

    public void onStatusChanged(String s, int i, Bundle bundle) {
    }

    public void onProviderEnabled(String s) {
    }

    public void onProviderDisabled(String s) {
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();
        Bundle b = new Bundle();
        Intent intent = new Intent();
        intent.putExtras(b);
        setResult(RESULT_CANCELED, intent);
        finish();
    }


    public void getaddress(Double lat,Double lon)
    {

        String url = "https://login.easyform.in/coreapi/api/" + "LocationApi/aws/" + lat + "/" + lon;

        OkHttpClient client = new OkHttpClient();

        Request request = new Request.Builder()
                .url(url)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                e.printStackTrace(); // Handle failure
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    final String responseData = response.body().string();

                    try {
                        JSONObject json = new JSONObject(responseData);
                        final String address = json.getString("display_name");
                        final String shortAddress = address.split(",")[0].trim();
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {

                                EasyWeatherWeatherActivity.this.locationTextView.setText(shortAddress);
                            }
                        });
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                }

            }
        });

    }

    private String formatTime(long timestamp, int timezoneOffsetInSeconds) {
        // Convert Unix timestamp (in seconds) to milliseconds
        long adjustedTimeMillis = (timestamp + timezoneOffsetInSeconds) * 1000L;

        // Format the time in hh:mm a (e.g., 06:45 AM)
        SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", Locale.getDefault());
        sdf.setTimeZone(TimeZone.getTimeZone("UTC")); // Use UTC because we've added the offset manually

        return sdf.format(new Date(adjustedTimeMillis));
    }
}
