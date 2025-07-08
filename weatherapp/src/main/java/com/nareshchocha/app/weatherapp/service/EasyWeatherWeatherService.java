package com.nareshchocha.app.weatherapp.service;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.nareshchocha.app.weatherapp.listener.EasyWeatherWeatherServiceListener;
import com.nareshchocha.app.weatherapp.model.City;
import com.nareshchocha.app.weatherapp.model.ListItem;
import com.nareshchocha.app.weatherapp.model.Main;
import com.nareshchocha.app.weatherapp.model.WeatherData;
import com.nareshchocha.app.weatherapp.model.WeatherItem;
import com.nareshchocha.app.weatherapp.model.Wind;
import com.nareshchocha.app.weatherapp.network.RetrofitClient;
import com.nareshchocha.app.weatherapp.ui.activitys.EasyWeatherWeatherActivity;
import com.nareshchocha.app.weatherapp.utils.LogUtils;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class EasyWeatherWeatherService {

    private static final String TAG = "EasyWeatherWeatherService";
    private EasyWeatherWeatherServiceListener listener;

    public final static String baseUrl = "http://api.openweathermap.org/data/2.5/";

    Context mContext;

    public EasyWeatherWeatherService(EasyWeatherWeatherServiceListener listener, Context mContext) {
        this.listener = listener;
        this.mContext = mContext;
    }


    public void refreshWeather(Double lat, Double lon) {
        getJsonResponse(lat, lon );
    }
    // call url
    public String getUrl(double lat, double lon) {
        String API_KEY_VALUE = "751d80f6c314139192ffcb62c107e654";
        String API_KEY_QUERY = "appid";
        return baseUrl + "forecast" + "?lat=" + lat + "&lon=" + lon + "&units=metric" + "&" + API_KEY_QUERY + "=" + API_KEY_VALUE;
    }

    // handle response
    private void getJsonResponse(Double lat, Double lon) {
        String weatherURl = getUrl(lat, lon);

        RetrofitClient.getApiServices().getWeatherData(weatherURl).enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (response.isSuccessful() && response.code() == 200) {
                    LogUtils.weatherErrorLogFile("weatherJson =>" + response.body().toString(), "onResponse " + TAG);

                    WeatherData weatherResponse = getWeatherData(response.body());
                    if (weatherResponse.getList() != null) {
                        weatherResponse.setList(filterList(weatherResponse.getList()));
                        weatherResponse.setWithoutfilter(weatherResponse.getWithoutfilter());
                    }
                    LogUtils.weatherErrorLogFile("weatherResponse =>" + new Gson().toJson(weatherResponse), "onResponse " + TAG);
                    if (listener != null && response.body() != null) {
                        listener.serviceSuccess(weatherResponse,response.body().toString() );
                    }
                }
                else {
                    listener.serviceFailure("Error :" + response.message() +"  Response Code :"+ response.code());
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                LogUtils.weatherErrorLogFile("Error=>" + t.toString(), "onFailure " + TAG);
                listener.serviceFailure(t.toString());
            }
        });
    }

    private WeatherData getWeatherData(JsonObject jsonObject) {
        WeatherData weatherData = new WeatherData();
        try {
            if (jsonObject.has("city")) {
                City mCity = new City();
                JsonObject jsonObjectCity = jsonObject.get("city").getAsJsonObject();
                mCity.setName(jsonObjectCity.get("name").getAsString());
                mCity.setCountry(jsonObjectCity.get("country").getAsString());
                mCity.setTimezone(jsonObjectCity.get("timezone").getAsInt());
                mCity.setSunset(jsonObjectCity.get("sunset").getAsInt());
                mCity.setSunrise(jsonObjectCity.get("sunrise").getAsInt());
                weatherData.setCity(mCity);
            }
            if (jsonObject.has("list")) {
                JsonArray jsonArrayList = jsonObject.get("list").getAsJsonArray();
                List<ListItem> list = new ArrayList<>();
                for (int i = 0; i < jsonArrayList.size(); i++) {
                    JsonObject MyJsonObject = jsonArrayList.get(i).getAsJsonObject();
                    ListItem listItem = new ListItem();
                    listItem.setDtTxt(MyJsonObject.get("dt_txt").getAsString());
                    if (MyJsonObject.has("main")) {
                        JsonObject jsonObjectMain = MyJsonObject.get("main").getAsJsonObject();
                        Main main = new Main();
                        main.setTemp(jsonObjectMain.get("temp").getAsFloat());
                        main.setFeelsLike(jsonObjectMain.get("feels_like").getAsDouble());
                        main.setTempMin(jsonObjectMain.get("temp_min").getAsDouble());
                        main.setTempMax(jsonObjectMain.get("temp_max").getAsDouble());
                        main.setPressure(jsonObjectMain.get("pressure").getAsInt());
                        main.setSeaLevel(jsonObjectMain.get("sea_level").getAsInt());
                        main.setGrndLevel(jsonObjectMain.get("grnd_level").getAsInt());
                        main.setHumidity(jsonObjectMain.get("humidity").getAsInt());
                        main.setTempKf(jsonObjectMain.get("temp_kf").getAsDouble());
                        listItem.setMain(main);
                    }
                    if (MyJsonObject.has("weather")) {
                        List<WeatherItem> weatherItemList = new ArrayList<>();
                        JsonArray jsonArrayWeather = MyJsonObject.get("weather").getAsJsonArray();
                        for (int n = 0; n < jsonArrayWeather.size(); n++) {
                            JsonObject jsonObjectWeather = jsonArrayWeather.get(n).getAsJsonObject();
                            WeatherItem weatherItem = new WeatherItem();
                            weatherItem.setDescription(jsonObjectWeather.get("description").getAsString());
                            weatherItem.setIcon(jsonObjectWeather.get("icon").getAsString());
                            weatherItemList.add(weatherItem);
                        }
                        listItem.setWeather(weatherItemList);
                    }
                    if (MyJsonObject.has("wind")) {
                        JsonObject jsonObjectWind = MyJsonObject.get("wind").getAsJsonObject();
                        Wind wind = new Wind();
                        wind.setSpeed(jsonObjectWind.get("speed").getAsDouble());
                        wind.setDeg(jsonObjectWind.get("deg").getAsInt());
                        wind.setGust(jsonObjectWind.get("gust").getAsDouble());
                        listItem.setWind(wind);
                    }
                    list.add(listItem);
                }
                weatherData.setList(list);
                weatherData.setWithoutfilter(list);
            }
        } catch (Exception e) {
            LogUtils.weatherErrorLogFile("Error=>" + e.toString(), "getWeatherData Pa " + TAG);
        }


        return weatherData;
    }

    private List<ListItem> filterList(List<ListItem> list) {
        List<ListItem> flist = new ArrayList<ListItem>();

        for (int i = 0; i < list.size(); i++) {
            ListItem item = list.get(i);
            Log.e("Day item", dayStringFormat(item.getDtTxt()));
            if (flist.size() == 0) {
                flist.add(item);
            } else {
                int flag = 0;
                for (int n = 0; n < flist.size(); n++) {
                    ListItem itemtwo = flist.get(n);
                    Log.e("Day itemtwo", dayStringFormat(itemtwo.getDtTxt()));
                    // Log.e("Day", dayStringFormat(itemtwo.getDt()) + " == " + dayStringFormat(item.getDt()) + " =" + (dayStringFormat(itemtwo.getDt()).equals(dayStringFormat(item.getDt()))));
                    if (dayStringFormat(itemtwo.getDtTxt()).equals(dayStringFormat(item.getDtTxt()))) {
                        flag = 1;
                        break;
                    }
                }
                if (flag == 0) {
                    flist.add(item);
                }
            }
        }
        return flist;
    }


    public static String dayStringFormat(String msecs) {
        try {
            Calendar mydate = new GregorianCalendar();
            Date thedate = null;
            thedate = new SimpleDateFormat("yyyy/MM/dd", Locale.ENGLISH).parse(msecs.split(" ")[0].replace("-", "/"));
            mydate.setTime(thedate);

            int dow = mydate.get(Calendar.DAY_OF_WEEK);

            switch (dow) {
                case Calendar.MONDAY:
                    return "Monday";
                case Calendar.TUESDAY:
                    return "Tuesday";
                case Calendar.WEDNESDAY:
                    return "Wednesday";
                case Calendar.THURSDAY:
                    return "Thursday";
                case Calendar.FRIDAY:
                    return "Friday";
                case Calendar.SATURDAY:
                    return "Saturday";
                case Calendar.SUNDAY:
                    return "Sunday";
            }
            return "Monday";
        } catch (ParseException e) {
            e.printStackTrace();
            return "Monday";
        }
    }
}
