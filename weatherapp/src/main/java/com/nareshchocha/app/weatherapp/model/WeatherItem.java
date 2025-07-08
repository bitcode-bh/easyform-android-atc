package com.nareshchocha.app.weatherapp.model;

import com.google.gson.annotations.SerializedName;

public class WeatherItem {

    @SerializedName("icon")
    private String icon;

    @SerializedName("description")
    private String description;

    public String getIcon() {
        return icon;
    }

    public String getDescription() {
        return description;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @Override
    public String toString() {
        return
                "WeatherItem{" +
                        "icon = '" + icon + '\'' +
                        ",description = '" + description + '\'' +
                        "}";
    }
}