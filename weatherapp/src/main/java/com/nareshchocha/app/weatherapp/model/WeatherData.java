package com.nareshchocha.app.weatherapp.model;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

import java.util.List;

public class WeatherData {

    @SerializedName("city")
    private City city;


    @Expose
    @SerializedName("lists")
    private List<ListItem> list;

    public void setCity(City city) {
        this.city = city;
    }

    public City getCity() {
        return city;
    }

    public List<ListItem> getList() {
        return list;
    }


    public void setList(List<ListItem> list) {
        this.list = list;
    }

    private List<ListItem> withoutfilter;

    public List<ListItem> getWithoutfilter() {
        return withoutfilter;
    }

    public void setWithoutfilter(List<ListItem> withoutfilter) {
        this.withoutfilter = withoutfilter;
    }

    @Override
    public String toString() {
        return
                "WeatherData{" +
                        "city = '" + city + '\'' +
                        ",list = '" + list + '\'' +
                        "}";
    }
}