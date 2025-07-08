package com.nareshchocha.app.weatherapp.listener;


import com.nareshchocha.app.weatherapp.model.WeatherData;

public interface EasyWeatherWeatherServiceListener {
    void serviceFailure(String exception);

    void serviceSuccess(WeatherData weatherData,String Alldata);
}
