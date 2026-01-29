package com.sky.atc.easyformse;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

public  class RetryConnectInterceptor implements Interceptor {
    public final int maxRetries;
    public RetryConnectInterceptor(int maxRetries) { this.maxRetries = maxRetries; }

    @Override public Response intercept(Chain chain) throws IOException {
        Request req = chain.request();
        long waitMs = 300;

        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return chain.proceed(req);
            } catch (IOException e) {
                boolean connectRefused =
                        (e instanceof java.net.ConnectException) ||
                                String.valueOf(e.getMessage()).contains("ECONNREFUSED") ||
                                String.valueOf(e.getMessage()).contains("Connection refused") ||
                                String.valueOf(e.getMessage()).contains("Failed to connect");

                if (!connectRefused || attempt == maxRetries) throw e;

                try { Thread.sleep(waitMs); } catch (InterruptedException ignored) {}
                waitMs = Math.min(waitMs * 2, 2000);
            }
        }
        return chain.proceed(req);
    }
}

