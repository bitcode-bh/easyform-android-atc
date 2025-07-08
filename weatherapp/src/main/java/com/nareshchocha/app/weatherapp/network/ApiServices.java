package com.nareshchocha.app.weatherapp.network;
import com.google.gson.JsonObject;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Url;

/**
 * Created by NareshChocha on 7/30/2021.
 *
 * @author NareshChocha
 */
public interface ApiServices {


    @GET
    Call<JsonObject> getWeatherData(@Url String url);


}
