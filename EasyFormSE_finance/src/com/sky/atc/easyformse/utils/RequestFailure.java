package com.sky.atc.easyformse.utils;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InterruptedIOException;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.security.cert.CertificateException;

import javax.net.ssl.SSLException;

/** Safe failure metadata for Cordova; never exposes request bodies or credentials. */
public final class RequestFailure extends RuntimeException {
    public final String type;
    public final String reason;
    public final int httpStatus;

    private RequestFailure(String type, String reason, int httpStatus, Throwable cause) {
        super(type + ":" + reason, cause);
        this.type = type;
        this.reason = reason;
        this.httpStatus = httpStatus;
    }

    public static RequestFailure http(int status) {
        return new RequestFailure("server", "http", status, null);
    }

    public static RequestFailure invalidResponse() {
        return new RequestFailure("server", "response", 0, null);
    }

    public static RequestFailure authentication() {
        return new RequestFailure("authentication", "validation", 0, null);
    }

    public static RequestFailure from(Throwable error, boolean connected) {
        boolean ioFailure = false;
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof RequestFailure) {
                RequestFailure failure = (RequestFailure) cause;
                if (!connected && ("connection".equals(failure.reason) || "dns".equals(failure.reason)
                        || "timeout".equals(failure.reason) || "communication".equals(failure.reason))) {
                    return new RequestFailure("network", "offline", 0, error);
                }
                return failure;
            }
            if (cause instanceof SSLException || cause instanceof CertificateException) {
                return new RequestFailure("server", "tls", 0, error);
            }
            if (cause instanceof UnknownHostException) {
                return new RequestFailure("network", connected ? "dns" : "offline", 0, error);
            }
            if (cause instanceof InterruptedIOException) {
                return new RequestFailure(connected ? "server" : "network", connected ? "timeout" : "offline", 0, error);
            }
            if (cause instanceof SocketException) {
                return new RequestFailure("network", connected ? "connection" : "offline", 0, error);
            }
            if (cause instanceof JSONException) return invalidResponse();
            ioFailure |= cause instanceof IOException;
        }
        return new RequestFailure(ioFailure ? (connected ? "server" : "network") : "request",
                ioFailure ? (connected ? "communication" : "offline") : "internal", 0, error);
    }

    public JSONObject toJson() throws JSONException {
        JSONObject result = new JSONObject().put("type", type).put("reason", reason);
        if (httpStatus != 0) result.put("httpStatus", httpStatus);
        return result;
    }
}
