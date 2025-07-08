package com.nareshchocha.app.weatherapp.model;

import com.google.gson.annotations.SerializedName;

public class City {

    @SerializedName("country")
    private String country;

    @SerializedName("sunrise")
    private int sunrise;

    @SerializedName("timezone")
    private int timezone;

    @SerializedName("sunset")
    private int sunset;

    @SerializedName("name")
    private String name;


    public void setCountry(String country) {
        this.country = country;
    }

    public void setSunrise(int sunrise) {
        this.sunrise = sunrise;
    }

    public void setTimezone(int timezone) {
        this.timezone = timezone;
    }

    public void setSunset(int sunset) {
        this.sunset = sunset;
    }

    public void setName(String name) {
        this.name = name;
    }


    public String getCountry() {
        return country;
    }

    public int getSunrise() {
        return sunrise;
    }

    public int getTimezone() {
        return timezone;
    }

    public int getSunset() {
        return sunset;
    }

    public String getName() {
        return name;
    }


    @Override
    public String toString() {
        return
                "City{" +
                        "country = '" + country + '\'' +
                        ",sunrise = '" + sunrise + '\'' +
                        ",timezone = '" + timezone + '\'' +
                        ",sunset = '" + sunset + '\'' +
                        ",name = '" + name + '\'' +
                        "}";
    }
}