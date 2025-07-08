package com.nareshchocha.app.weatherapp.ui.fragments;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.recyclerview.widget.RecyclerView;

import com.nareshchocha.app.weatherapp.R;
import com.nareshchocha.app.weatherapp.model.HourlyWeather;
import com.squareup.picasso.Picasso;

import java.util.List;

/**
 * Created by NareshChocha on 06/27/2025.
 *
 * @author NareshChocha
 */
public class WeatherAdapter extends RecyclerView.Adapter<WeatherAdapter.ViewHolder> {
    private List<HourlyWeather> weatherList;
    private Context context;

    public WeatherAdapter(Context context, List<HourlyWeather> weatherList) {
        this.context = context;
        this.weatherList = weatherList;
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView timeText, tempText, descText;
        ImageView weatherIcon;

        public ViewHolder(View itemView) {
            super(itemView);
            timeText = itemView.findViewById(R.id.timeText);
            tempText = itemView.findViewById(R.id.tempText);
            descText = itemView.findViewById(R.id.descText);
            weatherIcon = itemView.findViewById(R.id.weatherIcon);
        }
    }

    @Override
    public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(context).inflate(R.layout.item_hourly_weather, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(ViewHolder holder, int position) {
        HourlyWeather weather = weatherList.get(position);
        holder.timeText.setText(weather.getTime());
        holder.tempText.setText((int) weather.getTemp() + "°C");
        holder.descText.setText(weather.getWeatherDescription());

        // Load icon using Glide or Picasso
        Picasso.with(context).load("https://openweathermap.org/img/wn/" + weather.getIconUrl() + ".png")
                .into(holder.weatherIcon);
    }

    @Override
    public int getItemCount() {
        return weatherList.size();
    }
}
