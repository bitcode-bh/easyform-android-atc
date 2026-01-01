package com.sky.atc.easyformse;

import android.location.Address;
import android.location.Geocoder;
import android.os.AsyncTask;
import android.util.Log;

import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.BasicResponseHandler;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.protocol.BasicHttpContext;
import org.apache.http.protocol.HttpContext;
import org.json.JSONObject;

import java.util.List;
import java.util.Locale;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Address API to get address from API
@StringFogIgnore
public class AddressApi {


    public static String getCompleteAddress(double LATITUDE, double LONGITUDE) {

        String address = "";
        String url = null;
        String addressApi = sqlitewraper.context.getResources().getString(R.string.ADDRESSAPI);


        if (addressApi.equalsIgnoreCase("sky")) {

            url = "http://ec2-13-232-162-94.ap-south-1.compute.amazonaws.com/nominatim/reverse.php?format=json&lat=" + LATITUDE + "&lon=" + LONGITUDE + "&zoom=18";
            new AsyncAddress().execute(url,String.valueOf(LATITUDE),String.valueOf(LONGITUDE));

        }
        if (addressApi.equalsIgnoreCase("google")) {

            Geocoder geocoder = new Geocoder(sqlitewraper.context, Locale.getDefault());
            try {
                List<Address> addresses = geocoder.getFromLocation(LATITUDE, LONGITUDE, 1);
                if (addresses != null) {
                    Address returnedAddress = addresses.get(0);
                    StringBuilder strReturnedAddress = new StringBuilder("");

                    for (int i = 0; i <= returnedAddress.getMaxAddressLineIndex(); i++) {
                        strReturnedAddress.append(returnedAddress.getAddressLine(i)).append("\n");
                    }
                    address = strReturnedAddress.toString();
                    Log.w("##MyCurrentaddress", strReturnedAddress.toString());
                } else {
                    Log.w("##MyCurerentAdress", "No Address returned!");
                }
            } catch (Exception e) {
                e.printStackTrace();
                Log.w("##MyCurrent", "Canont get Address!");
            }
        }
        return address;
    }

    static class AsyncAddress extends AsyncTask<String, String, String> {
        String url;
        double latitude ;
        double longitude;
        String address;
        @Override
        protected void onPreExecute() {
            super.onPreExecute();
        }

        @Override
        protected void onPostExecute(String s) {
            super.onPostExecute(s);

        }

        @Override
        protected String doInBackground(String... strings) {

            try {
                 url = strings[0];
                 latitude = Double.parseDouble(strings[1]);
                 longitude = Double.parseDouble(strings[2]);

                HttpClient httpClient = new DefaultHttpClient();
                HttpContext localContext = new BasicHttpContext();
                HttpPost httpPost = new HttpPost(url);
                HttpResponse response = httpClient.execute(httpPost, localContext);

                String jsonResponse = new BasicResponseHandler().handleResponse(response);
                JSONObject jsonObj = new JSONObject(jsonResponse);
                 address = jsonObj.getString("display_name");

                return address;
            } catch (Exception e) {
                address = DeviceEventsUtils.getCompleteAddressString(latitude,longitude);
                e.printStackTrace();
            }

            return address;
        }
    }


}
