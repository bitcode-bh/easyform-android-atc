package com.sky.atc.easyformse.sensordetection;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.telephony.SmsManager;
import android.util.Log;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;

public class FallAlertActivity extends AppCompatActivity {

    private TextView timerText;
    TextView btnConfirm;
    TextView btnDecline;
    private CountDownTimer countDownTimer;

    private static final int TOTAL_TIME = 20;
    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    FusedLocationProviderClient fusedLocationClient;

    @SuppressLint("WrongViewCast")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.fall_alert_activity);

        timerText = findViewById(R.id.timertext);
        btnConfirm = findViewById(R.id.btconfrom);
        btnDecline = findViewById(R.id.btnDecline);

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);


        startAlarm();

        startVibration();


        startTimer();

        btnConfirm.setOnClickListener(v -> {

            stopTimer();
            stopAlarm();
            sendEmergencyAlert();
           // finish();
        });

        btnDecline.setOnClickListener(v -> {

            stopTimer();
            stopAlarm();
            //sendEmergencyAlert();
           // finish();
        });
    }

    //    private void startAlarm() {
//        setMaxVolume();
//
//        mediaPlayer = new MediaPlayer();
//
//        Uri uri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.beep_sound);
//
//        try {
//            mediaPlayer.setDataSource(this, uri);
//
//            AudioAttributes attributes = new AudioAttributes.Builder()
//                    .setUsage(AudioAttributes.USAGE_ALARM)   //  THIS IS KEY
//                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
//                    .build();
//
//            mediaPlayer.setAudioAttributes(attributes);
//
//            mediaPlayer.setLooping(true);
//            mediaPlayer.prepare();
//            mediaPlayer.start();
//
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//    }
    private void startAlarm() {
        mediaPlayer = MediaPlayer.create(this, R.raw.beep_sound);
        mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
        mediaPlayer.setLooping(true);
        mediaPlayer.start();
    }

    private void stopAlarm() {
        if (mediaPlayer != null) {
            mediaPlayer.stop();
            mediaPlayer.release();
            mediaPlayer = null;
        }

        if (vibrator != null) {
            vibrator.cancel();
        }

        finish();
    }

    private void startVibration() {
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            VibrationEffect effect = VibrationEffect.createWaveform(
                    new long[]{0, 500, 500}, 0
            );
            vibrator.vibrate(effect);
        } else {
            vibrator.vibrate(new long[]{0, 500, 500}, 0);
        }
    }

    private void startTimer() {
        countDownTimer = new CountDownTimer(TOTAL_TIME * 1000, 1000) {

            int timeLeft = TOTAL_TIME;

            @Override
            public void onTick(long millisUntilFinished) {
                timerText.setText(String.valueOf(timeLeft));
                timeLeft--;
            }

            @Override
            public void onFinish() {
                sendEmergencyAlert();
                stopAlarm();
               // finish();
            }
        }.start();
    }

    private void stopTimer() {
        stopAlarm();
        if (countDownTimer != null) {
            countDownTimer.cancel();
        }
    }

    public void sendEmergencyAlert()
    {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        fusedLocationClient.getLastLocation().addOnSuccessListener(location -> {
            if (location != null) {
                double lat = location.getLatitude();
                double lng = location.getLongitude();

                String mapsLink = "https://maps.google.com/?q=" + lat + "," + lng;

                Toast.makeText(this, mapsLink, Toast.LENGTH_LONG).show();

                String message =
                        "Accident detected!\n"
                                + "Location:\n"
                                + mapsLink;

                sendSMS(message);

            }
        });

    }


    private void sendSMS(String message) {

        try {
            if (vibrator != null) {
                vibrator.cancel();
            }
            if (ActivityCompat.checkSelfPermission(
                    this,
                    Manifest.permission.SEND_SMS
            ) != PackageManager.PERMISSION_GRANTED) {

                return;
            }

            MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
            String Emergency_Contact_No;
            Emergency_Contact_No = pref.getString("Emergency_Contact_No","");

            String[] phoneNumbers = {
                   Emergency_Contact_No
            };

            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(
                   Emergency_Contact_No,
                    null,
                    message,
                    null,
                    null
            );
//            for (String phone : phoneNumbers) {
//
//
//                Toast.makeText(
//                        this,
//                        phoneNumbers.toString(),
//                        Toast.LENGTH_LONG
//                ).show();
//            }

            Toast.makeText(
                    this,
                    Emergency_Contact_No + "Emergency SMS Sent",
                    Toast.LENGTH_LONG
            ).show();

        } catch (Exception e) {

            e.printStackTrace();
            Log.d("SMS Failed",e.getMessage());
            Toast.makeText(
                    this,
                    "SMS Failed: " + e.getMessage(),
                    Toast.LENGTH_LONG
            ).show();
        }
    }


    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopAlarm();
    }
}