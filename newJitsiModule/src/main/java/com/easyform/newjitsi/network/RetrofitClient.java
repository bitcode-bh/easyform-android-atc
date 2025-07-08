package com.easyform.newjitsi.network;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

/**
 * Created by NareshChocha on 19/02/2023.
 *
 * @author NareshChocha
 */
public class RetrofitClient {
    private static Retrofit retrofit;
    private static Retrofit retrofit1;
    private static final String BASE_URL = "https://development.easyform.in/coreapi/api/JwtToken/";
    private static final String USER_URL = "https://development.easyform.in/coreapi/api/";


    private static Retrofit getRetrofitClient() {
        if (retrofit == null) {
            HttpLoggingInterceptor interceptor = new HttpLoggingInterceptor();
            interceptor.setLevel(HttpLoggingInterceptor.Level.BODY);
            OkHttpClient client = new OkHttpClient.Builder()
                    .addInterceptor(interceptor)
                    .build();
            retrofit = new Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .addConverterFactory(GsonConverterFactory.create())
                    .client(client)
                    .build();
        }
        return retrofit;
    }

    private static Retrofit getUserRetrofitClient() {
        if (retrofit1 == null) {
            HttpLoggingInterceptor interceptor = new HttpLoggingInterceptor();
            interceptor.setLevel(HttpLoggingInterceptor.Level.BODY);
            OkHttpClient client = new OkHttpClient.Builder()
                    .addInterceptor(interceptor)
                    .build();
            retrofit1 = new Retrofit.Builder()
                    .baseUrl(USER_URL)
                    .addConverterFactory(GsonConverterFactory.create())
                    .client(client)
                    .build();
        }
        return retrofit1;
    }

    public static ApiServices getUserApiServices() {
        return  getUserRetrofitClient().create(ApiServices.class);
    }

    public static ApiServices getApiServices() {
        return getRetrofitClient().create(ApiServices.class);

    }
}
