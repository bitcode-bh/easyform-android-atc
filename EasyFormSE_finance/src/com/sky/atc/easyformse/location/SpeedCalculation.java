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

    // gps zig zag issue 02072026
    public static Location locationA;
    private static Float lastValidMovementBearing = null;

    public static float calculateSpeedBetweenPoints(Location locationB) {

        try {

            if (locationB == null) {
                return 10000;
            }


            if ((locationB.getLatitude() == 0.0 && locationB.getLongitude() == 0.0)
                    || (Math.abs(locationB.getLatitude()) < 0.0001
                    && Math.abs(locationB.getLongitude()) < 0.0001)) {

                Log.d("GPS_FILTER", "Rejected : 0,0 Location");
                return 10000;
            }


            if (locationA == null) {
                locationA = new Location(locationB);
                return 0;
            }

            long timeDiff;

            if (locationA.getElapsedRealtimeNanos() > 0 &&
                    locationB.getElapsedRealtimeNanos() > 0) {

                timeDiff = (locationB.getElapsedRealtimeNanos()
                        - locationA.getElapsedRealtimeNanos()) / 1000000L;

            } else {

                timeDiff = locationB.getTime() - locationA.getTime();
            }

            float seconds = timeDiff / 1000f;
            float distance = locationA.distanceTo(locationB);

            float speed = distance / seconds;

            // Reject impossible speed
            if (speed > 40f) {
                //Log.d("GPS_FILTER", "Rejected : Speed " + speed);
                return 10000;
            }

            float currentBearing = locationA.bearingTo(locationB);

            if (lastValidMovementBearing != null && distance > 15f) {

                float bearingChange = Math.abs(lastValidMovementBearing - currentBearing);

                if (bearingChange > 180f) {
                    bearingChange = 360f - bearingChange;
                }

                if (bearingChange > 135f && speed > 10f) {
                   // Log.d("GPS_FILTER", "Rejected : Bearing Jump");
                    return 10000;
                }
            }

            lastValidMovementBearing = currentBearing;
            locationA = new Location(locationB);


            return speed;

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
