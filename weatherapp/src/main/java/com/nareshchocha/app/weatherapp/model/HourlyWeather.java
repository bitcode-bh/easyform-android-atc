package com.nareshchocha.app.weatherapp.model;

/**
 * Created by NareshChocha on 06/27/2025.
 *
 * @author NareshChocha
 */
public class HourlyWeather {
    private String time;
    private int temp;
    private String weatherDescription;
    private String iconUrl;

    public HourlyWeather(String time, int temp, String weatherDescription, String iconUrl) {
        this.time = time;
        this.temp = temp;
        this.weatherDescription = weatherDescription;
        this.iconUrl = iconUrl;
    }

    public String getTime() { return time; }
    public int getTemp() { return temp; }
    public String getWeatherDescription() { return weatherDescription; }
    public String getIconUrl() { return iconUrl; }
}

