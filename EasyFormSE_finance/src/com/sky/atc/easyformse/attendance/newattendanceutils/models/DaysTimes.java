package com.sky.atc.easyformse.attendance.newattendanceutils.models;

import androidx.annotation.Keep;

import java.util.List;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

@Keep
public class DaysTimes {

    @Expose
    @SerializedName("1")
    private List<String> dayOne;

    @Expose
    @SerializedName("2")
    private List<String> dayTwo;

    @Expose
    @SerializedName("3")
    private List<String> dayThree;

    @Expose
    @SerializedName("4")
    private List<String> dayFor;

    @Expose
    @SerializedName("5")
    private List<String> dayFive;

    @Expose
    @SerializedName("6")
    private List<String> daySix;

    @Expose
    @SerializedName("7")
    private List<String> daySeven;

    public void setDayOne(List<String> dayOne) {
        this.dayOne = dayOne;
    }

    public List<String> getDayOne() {
        return dayOne;
    }

    public void setDayTwo(List<String> dayTwo) {
        this.dayTwo = dayTwo;
    }

    public List<String> getDayTwo() {
        return dayTwo;
    }

    public void setDayThree(List<String> dayThree) {
        this.dayThree = dayThree;
    }

    public List<String> getDayThree() {
        return dayThree;
    }

    public void setDayFor(List<String> dayFor) {
        this.dayFor = dayFor;
    }

    public List<String> getDayFor() {
        return dayFor;
    }

    public void setDayFive(List<String> dayFive) {
        this.dayFive = dayFive;
    }

    public List<String> getDayFive() {
        return dayFive;
    }

    public void setDaySix(List<String> daySix) {
        this.daySix = daySix;
    }

    public List<String> getDaySix() {
        return daySix;
    }

    public void setDaySeven(List<String> daySeven) {
        this.daySeven = daySeven;
    }

    public List<String> getDaySeven() {
        return daySeven;
    }

    @Override
    public String toString() {
        return
                "DaysTimes{" +
                        "1 = '" + dayOne + '\'' +
                        ",2 = '" + dayTwo + '\'' +
                        ",3 = '" + dayThree + '\'' +
                        ",4 = '" + dayFor + '\'' +
                        ",5 = '" + dayFive + '\'' +
                        ",6 = '" + daySix + '\'' +
                        ",7 = '" + daySeven + '\'' +
                        "}";
    }
}