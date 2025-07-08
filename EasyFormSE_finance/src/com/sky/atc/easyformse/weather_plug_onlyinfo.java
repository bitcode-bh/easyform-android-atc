package com.sky.atc.easyformse;

import android.app.Activity;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import com.google.gson.Gson;
import com.nareshchocha.app.weatherapp.listener.EasyWeatherWeatherServiceListener;
import com.nareshchocha.app.weatherapp.model.WeatherData;
import com.nareshchocha.app.weatherapp.service.EasyWeatherWeatherService;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Created by NareshChocha on 06/03/2025.
 *
 * @author NareshChocha
 */
// this plugin only send weather info no load weather ui
public class weather_plug_onlyinfo extends CordovaPlugin {
    public CallbackContext callbackContext;

    @Override
    public boolean execute(String action, JSONArray args,
                           CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;

        try{
            String lat = args.getJSONObject(0).getString("lat");
            String lon = args.getJSONObject(0).getString("lon");
            String time = args.getJSONObject(0).getString("time");

            // call api and handle success and failed
            EasyWeatherWeatherService weatherService = new EasyWeatherWeatherService(new EasyWeatherWeatherServiceListener() {
                @Override
                public void serviceFailure(String exception) {
                    callbackContext.error(exception);
                }

                @Override
                public void serviceSuccess(WeatherData weatherData,String alldata) {
                    try {
                        String jsonString = new Gson().toJson(weatherData);
                        JSONArray mJsonArray = new JSONArray();
                        JSONObject jsonObject = new JSONObject();
                        jsonObject.put("weatherresponsefilerlist",jsonString);
                        jsonObject.put("weatherjson",alldata);
                        mJsonArray.put(jsonObject);
                        callbackContext.success(mJsonArray.toString());
                    } catch (JSONException e) {
                        callbackContext.error("JSON parsing error");
                    }
                }
            }, cordova.getActivity());

            weatherService.refreshWeather(Double.valueOf(lat), Double.valueOf(lon));

            return true;

        }
        catch (Exception e)
        {
            callbackContext.error(e.toString());
            return false;
        }

    }
}


