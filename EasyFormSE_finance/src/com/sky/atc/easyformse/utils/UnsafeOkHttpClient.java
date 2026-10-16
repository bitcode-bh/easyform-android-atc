package com.sky.atc.easyformse.utils;

import okhttp3.OkHttpClient;

/** Compatibility entry point: all callers now use platform TLS validation. */
@Deprecated
public class UnsafeOkHttpClient {
    public static OkHttpClient.Builder getUnsafeOkHttpClient() {
        return new OkHttpClient.Builder();
    }
}
