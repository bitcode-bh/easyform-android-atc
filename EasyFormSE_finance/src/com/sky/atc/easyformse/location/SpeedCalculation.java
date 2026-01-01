package com.sky.atc.easyformse.location;

import android.location.Location;
import android.util.Log;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Manual Speed calculation
@StringFogIgnore
public class SpeedCalculation {

    private static Location locationA;

    public static float calculateSpeedBetweenPoints(Location locationB) {

        if (locationA == null) {
            locationA = locationB;
            return 0;
        } else {

            float distance = locationA.distanceTo(locationB);
            float milliToTravel = locationB.getTime() - locationA.getTime();

            Log.d("##MY_SPEED_DISTANCE :", distance +" MILLI: "+milliToTravel);

            float seconds = (float) (milliToTravel / 1000.0);

            float speed = distance / seconds;

            Log.d("##MY_SPEED_CAL :", String.valueOf(speed));
            Log.d("##MY_SPEED_API :", String.valueOf(locationB.getSpeed()));

            locationA = locationB;

            float percentgeOfError = percent(speed, locationB.getSpeed());
            
            if (percentgeOfError>30){
                return speed;
            }else {
                return 10000;
            }
        }
    }

    private static float percent(float a, float b) {
        float result = 0;
        result = ((b - a) * 100) / a;
        Log.d("##MY_SPEED_PER :", String.valueOf(result));
        return result;
    }
}
