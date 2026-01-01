package com.easyform.newjitsi.network.Models;

import android.os.Build;
import android.util.Log;

import org.json.JSONObject;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.util.Base64;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Created by NareshChocha on 1/27/2025.
 *
 * @author NareshChocha
 */
public class AccessToken {
    private static final String firebaseMessagingScope =
            "https://www.googleapis.com/auth/firebase.messaging";
    static String private_key = "-----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC0k+bk4fsNv2u+SLBdUIUZWZLQ07GEXJV6e6zy1Twgf8U5Q2CZfYhaFEqAQFFZciPgB6J09IbzjkuDniLAOVvZcfxrrHPdHQKfiw8y6fLKj+Qtf9tuOoeoVzQxhWFjf3mGNkiqjvedqxUeM07u3nrxXYHYnhtiafqWaP/MyqaiaTezq2rQOnm+/Xd3KBSsPIcv+Q/xKOxl/PG5coWTREld6B+GDCsUReJPFNEfEDC+uQ8IwH7dDImvABpGaOkWTSFJYXu9MR4+n2WZhp9uVHh1CySSvqqyyUinpHFCI1YMFgh97yPby9oYMFVJuO2yQTz7Sme4HZI0MgYXZE7DEeJVAgMBAAECggEAGaN6P/sZ4xzPlmfJqqYZD71ZDA9SgAGJM6fFqYC/FboubW/0kjZxmqCQ5166biG3mEJdPY/ObVxBuoFEW9iJAvmdJkiI9tb8nVxoHwl6cGo3soIZzK/AvRUMkw9mAXOC9JxWeujrnVZCHFSam225NPXazr+8EaAMdTiZQSFwwVRDmNIPvNC05PSkzHH0++wYNY7gWrRzmicXWEHfopnJS1yqM5cC1TfmlVlFz6eSxZudNB+DHV1Hv5MJMtWzb2+dmBJx9LLW0Of+U+hhQi416JZqE2v5CK11GsDK6tQWiPukx8QRMrVwS2dGhXSDc5mmfvUzV0y5DRde/kOcb+/zQQKBgQDyJYccHZ95dXM5VQzMjzBkOkqv9P/iEnvbabNyNQsvZtkSsn7c0Mhh3BXzGY/DGeMigooEbd7SG76jJclvfrVxG+KC5zC/IgNXsdQjbk5PYcrw5UrZqUual9gIoMkE+M4qHhRl6+f5whBLsUjTYMx/OahFbRtwmx57BNgSpeISUQKBgQC+6KNz89MNHgBGvfgjDtlYevKGWS8csAks/9hjxdl457xVUFA+qHB+diLLLX5hc3fkjZD8ithJ+Ja0PD9zScJp5JZ+fFheWTJKmXX7ECIcO4wP3H8qoEVsd5OwFvB3ulRIejAO1Cr+ttCAiaKsLyVInuTXsad4IOtfjvDa0PCqxQKBgQCCrJvgIWBZZHec/ffdQHyl6gs6L6YTM1Rh0QYE4Pk7SG5mt6rcsVMh9Gpn+WhqqkK38ehXgY9YpZ5YXuD46VEzTBAOAoN88fcJ0S6hPDrIfgbNv3+IPONO9xifd11j8H0Zn4f0hL14PDEdF/wsDjXthoj3hmzjdOKbEr8kOR7qMQKBgG4CVrYpibOkVxpsu8FP/DS9XGXInJpWYmM45vPPfdrrBp7O0f7ZR0HIR5J3G72CMVNVtHeidrJhek5P7Ww807f7jjFC7BUqJw3P0qmjCVTlh3dYYzsn8floCoXNIjKL/6doKatR3Zi7tfhr136LCFwJm+sjJ1LU/W0qTGZ7QkPVAoGAReTVEA2KRwMZSWHFp1WZfCG9DBa6sMmbTsA5P26cz06ltr0XQJHVI9j7XPEt3Sq2PqBA025DKLWKh5KbRZumOwuIIlYliCZWFPXe+e8iM1crmwGlETqLYv5v/dLt6Z7pqlbdrD7Iz/J1r7OdNnssByzZhUTLpKWRjcMiTCw2zmQ=-----END PRIVATE KEY-----";
    public static String client_email = "firebase-adminsdk-uygu2@wipro-86aed.iam.gserviceaccount.com";

    public static String keyWithoutHeaders = AccessToken.private_key
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replace("\n", "")
            .replace("\\", "");





    // Base64Url encoding (used in JWT)
    public static String encode(byte[] data) {
        String encoded = null;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            encoded = Base64.getEncoder().encodeToString(data);
        }
        encoded = encoded.replace('+', '-').replace('/', '_').replace("=", "");
        return encoded;
    }

    public static byte[] decode(String data) {
        // Add padding if necessary to make the length of data a multiple of 4
        int padding = 4 - data.length() % 4;
        if (padding < 4) {
            data = data + "=".repeat(padding); // Add the appropriate number of "="
        }

        // Replace Base64Url characters with Base64 characters
        data = data.replace('-', '+').replace('_', '/');
        return Base64.getDecoder().decode(data);
    }

    public static String generateJWT(String privateKeyString, String clientEmail) throws Exception {
        // Step 1: Create the header
        String header = "{\"alg\":\"RS256\",\"typ\":\"JWT\"}";

        // Step 2: Create the payload
        long now = System.currentTimeMillis() / 1000;
        long exp = now + 3600;  // Expiration time is 1 hour from now
        String payload = "{\"iss\":\"" + clientEmail + "\",\"scope\":\"https://www.googleapis.com/auth/firebase.messaging\",\"aud\":\"https://oauth2.googleapis.com/token\",\"exp\":" + exp + ",\"iat\":" + now + "}";

        // Step 3: Base64Url encode the header and payload
        String encodedHeader = base64UrlEncode(header.getBytes("UTF-8"));
        String encodedPayload = base64UrlEncode(payload.getBytes("UTF-8"));

        // Step 4: Create the signature
        String unsignedToken = encodedHeader + "." + encodedPayload;
        String signature = signRS256(unsignedToken, privateKeyString);

        // Step 5: Return the JWT (header + payload + signature)
        return unsignedToken + "." + signature;
    }

    private static String base64UrlEncode(byte[] data) {
        String encoded = null;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            encoded = Base64.getEncoder().encodeToString(data);
        }
        encoded = encoded.replace('+', '-').replace('/', '_').replace("=", "");
        return encoded;
    }

    private static String signRS256(String data, String privateKeyString) throws Exception {
        // Convert the private key to a PrivateKey object
        byte[] keyBytes = null;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            keyBytes = decode(privateKeyString);
        }
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        PrivateKey privateKey = keyFactory.generatePrivate(new java.security.spec.PKCS8EncodedKeySpec(keyBytes));

        // Use the RS256 algorithm to sign the data
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        signature.update(data.getBytes("UTF-8"));
        byte[] signedData = signature.sign();

        return base64UrlEncode(signedData);
    }


    public static String getAccessToken(String jwtToken) throws Exception {
//        // Define the URL for Google's OAuth2 token endpoint
//        String url = "https://oauth2.googleapis.com/token";
//
//        // Open connection to the URL
//        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
//        connection.setRequestMethod("POST");
//        connection.setDoOutput(true);
//
//        // Set the request body for the POST request (URL encoded)
//        String body = "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + jwtToken +
//                "scope=https://www.googleapis.com/auth/firebase.messaging&aud=https://oauth2.googleapis.com/token&iss=firebase-adminsdk-uygu2@wipro-86aed.iam.gserviceaccount.com" ;
//        connection.getOutputStream().write(body.getBytes("UTF-8"));
//
//        // Read the response
//        BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
//        String inputLine;
//        StringBuilder response = new StringBuilder();
//        while ((inputLine = in.readLine()) != null) {
//            response.append(inputLine);
//        }
//        in.close();

        OkHttpClient client = new OkHttpClient().newBuilder()
                .build();
        MediaType mediaType = MediaType.parse("text/plain");
        RequestBody body = new MultipartBody.Builder().setType(MultipartBody.FORM)
                .addFormDataPart("assertion",jwtToken)
                .addFormDataPart("grant_type","urn:ietf:params:oauth:grant-type:jwt-bearer")
                .addFormDataPart("scope","https://www.googleapis.com/auth/firebase.messaging")
                .addFormDataPart("aud","https://oauth2.googleapis.com/token")
                .addFormDataPart("iss","firebase-adminsdk-uygu2@wipro-86aed.iam.gserviceaccount.com")
                .addFormDataPart("exp","1625491000")
                .addFormDataPart("iat","1625487400")
                .build();
        Request request = new Request.Builder()
                .url("https://oauth2.googleapis.com/token")
                .method("POST", body)
                .build();
        Response response = client.newCall(request).execute();

        // Extract the access token from the response
        String responseBody = response.body().string();
        JSONObject jsonObject = new JSONObject(responseBody);
        String accessToken = jsonObject.getString("access_token");
        Log.d("access_toke",accessToken);
       // int tokenStart = responseBody.indexOf("\"access_token\":\"") + 15;
       // int tokenEnd = responseBody.indexOf("\"", tokenStart);
        return accessToken;
    }
}
