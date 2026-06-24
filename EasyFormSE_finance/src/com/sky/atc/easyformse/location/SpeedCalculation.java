package com.sky.atc.easyformse.location;

import android.location.Location;
import android.util.Log;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Manual Speed calculation
@StringFogIgnore
public class SpeedCalculation {

    // old code commit 24062026
//    public static Location locationA;
//
//    public static float calculateSpeedBetweenPoints(Location locationB) {
//
//        if (locationA == null) {
//            locationA = locationB;
//            return 0;
//        } else {
//
//            float distance = locationA.distanceTo(locationB);
//            float milliToTravel = locationB.getTime() - locationA.getTime();
//
//            Log.d("##MY_SPEED_DISTANCE :", distance +" MILLI: "+milliToTravel);
//
//            float seconds = (float) (milliToTravel / 1000.0);
//
//            float speed = distance / seconds;
//
//            Log.d("##MY_SPEED_CAL :", String.valueOf(speed));
//            Log.d("##MY_SPEED_API :", String.valueOf(locationB.getSpeed()));
//
//            locationA = locationB;
//
//            float percentgeOfError = percent(speed, locationB.getSpeed());
//
//            if (percentgeOfError>30){
//                return speed;
//            }else {
//                return 10000;
//            }
//        }
//    }

    // gps zig zag issue fixed 24062026
    private static Location locationA;
    private static Float lastValidMovementBearing = null;

    public static float calculateSpeedBetweenPoints(Location locationB) {
        try {

            if (locationA == null) {
                locationA = locationB;
                return 0;
            }

            long nanoTimeDiff = locationB.getElapsedRealtimeNanos() - locationA.getElapsedRealtimeNanos();
            float seconds = nanoTimeDiff / 1_000_000_000f;

            if (seconds <= 0) {
                return 10000;
            }

            float distance = locationA.distanceTo(locationB);
            float speed = distance / seconds;
            float currentMovementBearing = locationA.bearingTo(locationB);


            locationA = locationB;

            if (lastValidMovementBearing != null && distance > 15) {
                float bearingChange = Math.abs(lastValidMovementBearing - currentMovementBearing);
                if (bearingChange > 180) {
                    bearingChange = 360 - bearingChange;
                }

                if (bearingChange > 135.0f && speed > 10.0f) {
                    Log.e("##GPS_FILTER", "REJECTED BEARING JUMP: " + bearingChange + " deg");
                    return 10000;
                }
            }

            float percentgeOfError = percent(speed, locationB.getSpeed());

            if (percentgeOfError > 30 ) {

                Log.d("##GPS_STATUS", "ACCEPTED VALID POINT: " + speed + " m/s");

                lastValidMovementBearing = currentMovementBearing;

                return speed;
            } else {
                Log.e("##GPS_STATUS", "REJECTED HIGH ERROR: " + percentgeOfError + "%");
                return 10000;
            }

        } catch (Exception e) {
            e.printStackTrace();
            return 10000;
        }
    }


    private static float percent(float a, float b) {
        float result = 0;
        result = ((b - a) * 100) / a;
        Log.d("##MY_SPEED_PER :", String.valueOf(result));
        return result;
    }
}
