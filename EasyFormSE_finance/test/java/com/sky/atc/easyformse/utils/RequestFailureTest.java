package com.sky.atc.easyformse.utils;

import org.json.JSONException;
import org.junit.Test;

import java.io.IOException;
import java.net.ConnectException;
import java.net.SocketException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;

import javax.net.ssl.SSLHandshakeException;

import static org.junit.Assert.*;

public class RequestFailureTest {
    private void expect(String type, String reason, Throwable error, boolean connected) {
        RequestFailure failure = RequestFailure.from(error, connected);
        assertEquals(type, failure.type);
        assertEquals(reason, failure.reason);
    }

    @Test public void separatesDisconnectedAndConnectedNetworkFailures() {
        expect("network", "offline", new ConnectException(), false);
        expect("network", "dns", new UnknownHostException(), true);
        expect("network", "connection", new ConnectException(), true);
        expect("network", "connection", new SocketException("Connection reset"), true);
    }

    @Test public void distinguishesTimeoutFromNoConnection() {
        expect("server", "timeout", new SocketTimeoutException(), true);
        expect("network", "offline", new SocketTimeoutException(), false);
        RequestFailure timeout = RequestFailure.from(new SocketTimeoutException(), true);
        expect("network", "offline", timeout, false);
    }

    @Test public void preservesHttpAndCertificateFailuresWhenConnectivityChanges() {
        RequestFailure failure = RequestFailure.from(RequestFailure.http(503), false);
        assertEquals("server", failure.type);
        assertEquals("http", failure.reason);
        assertEquals(503, failure.httpStatus);
        expect("server", "tls", new SSLHandshakeException("certificate failure"), true);
        expect("server", "tls", new SSLHandshakeException("certificate failure"), false);
    }

    @Test public void classifiesResponseErrorsWithoutCallingThemNetworkFailures() {
        expect("server", "response", new JSONException("malformed response"), true);
        expect("server", "response", RequestFailure.invalidResponse(), true);
        expect("server", "communication", new IOException(), true);
        expect("request", "internal", new IllegalStateException("database failure"), true);
        expect("authentication", "validation", RequestFailure.authentication(), true);
    }

    @Test public void unwrapsCausesAndExportsOnlySafeMetadata() throws Exception {
        String secret = "sensitive request data";
        RequestFailure failure = RequestFailure.from(new RuntimeException(new UnknownHostException(secret)), true);
        assertEquals("dns", failure.reason);
        assertEquals(2, failure.toJson().length());
        assertFalse(failure.toJson().toString().contains(secret));
        assertEquals(401, RequestFailure.http(401).toJson().getInt("httpStatus"));
    }
}
