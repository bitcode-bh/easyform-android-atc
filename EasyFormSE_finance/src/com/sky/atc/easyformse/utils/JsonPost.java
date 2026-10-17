package com.sky.atc.easyformse.utils;

import android.util.Log;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;
import com.sky.atc.easyformse.NewWebservicesCallEasyform;

import org.json.JSONObject;

import java.io.IOException;
import java.util.Map;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/** Posts a JSON body in the background on the app's shared OkHttp client. */
@StringFogIgnore
public final class JsonPost {

    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    private JsonPost() {
    }

    /** {@code onError} (may be null) runs on a background thread when the request fails. */
    public static void async(String url, Map<String, String> headers, JSONObject body, final String tag,
                             final Runnable onError) {
        Request.Builder rb = new Request.Builder().url(url).post(RequestBody.create(body.toString(), JSON));
        for (Map.Entry<String, String> h : headers.entrySet()) rb.header(h.getKey(), h.getValue());
        NewWebservicesCallEasyform.getOkHttpClient().newCall(rb.build()).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(tag, "Request failed: " + e.getMessage());
                if (onError != null) onError.run();
            }

            @Override
            public void onResponse(Call call, Response response) {
                try {
                    if (response.isSuccessful()) Log.i(tag, "Sent: " + response.code());
                    else {
                        Log.e(tag, "Request failed: " + response.code());
                        if (onError != null) onError.run();
                    }
                } finally {
                    response.close();
                }
            }
        });
    }
}
