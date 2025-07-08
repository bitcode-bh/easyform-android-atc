package com.nareshchocha.app.weatherapp.model;

import com.google.gson.annotations.SerializedName;

import java.util.List;

public class ListItem {

    @SerializedName("dt_txt")
    private String dtTxt;

    @SerializedName("weather")
    private List<WeatherItem> weather;

    @SerializedName("main")
    private Main main;

    @SerializedName("wind")
    private Wind wind;


    public String getDtTxt() {
        return dtTxt;
    }

    public List<WeatherItem> getWeather() {
        return weather;
    }

    public Main getMain() {
        return main;
    }

    public Wind getWind() {
        return wind;
    }


    public void setDtTxt(String dtTxt) {
        this.dtTxt = dtTxt;
    }

    public void setWeather(List<WeatherItem> weather) {
        this.weather = weather;
    }

    public void setMain(Main main) {
        this.main = main;
    }

    public void setWind(Wind wind) {
        this.wind = wind;
    }


    @Override
    public String toString() {
        return
                "ListItem{" +
                        ",dt_txt = '" + dtTxt + '\'' +
                        ",weather = '" + weather + '\'' +
                        ",main = '" + main + '\'' +
                        ",wind = '" + wind + '\'' +
                        "}";
    }
}