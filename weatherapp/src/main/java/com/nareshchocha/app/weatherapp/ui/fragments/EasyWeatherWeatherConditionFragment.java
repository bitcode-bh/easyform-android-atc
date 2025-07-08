package com.nareshchocha.app.weatherapp.ui.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.fragment.app.Fragment;

import com.nareshchocha.app.weatherapp.R;
import com.squareup.picasso.Picasso;


public class EasyWeatherWeatherConditionFragment extends Fragment {
    private TextView dayLabelTextView;
    private TextView highTemperatureTextView;
    private TextView lowTemperatureTextView;
    private ImageView weatherIconImageView;
    private  TextView conditionTextView;
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.easyweather_fragment_weather_condition, container, false);
        this.weatherIconImageView = (ImageView) view.findViewById(R.id.weatherIconImageView);
        this.dayLabelTextView = (TextView) view.findViewById(R.id.dayTextView);
        this.highTemperatureTextView = (TextView) view.findViewById(R.id.highTemperatureTextView);
        this.lowTemperatureTextView = (TextView) view.findViewById(R.id.lowTemperatureTextView);
        this.conditionTextView = (TextView) view.findViewById(R.id.conditionTextView);

        return view;
    }


    public void loadForecast(String day, String icon, String hTem, String mTem, String condition) {
        setWeatherIcon(this.weatherIconImageView, icon);
        this.dayLabelTextView.setText(day);
        this.highTemperatureTextView.setText("H : " + hTem + "°");
        this.lowTemperatureTextView.setText("L : " + mTem + "°");
        this.conditionTextView.setText(condition);
    }
    void setWeatherIcon(ImageView view, String iconPath) {
        if (iconPath.isEmpty()) {
            return;
        }
        Picasso.with(getContext()).load("http://openweathermap.org/img/wn/" + iconPath + "@2x.png").into(view);
    }
}
