package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.app.ActivityManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.trip.FloatingBubbleService;
import org.apache.cordova.CordovaActivity;
import java.util.ArrayList;
import java.util.Locale;

/**
 * Created by NareshChocha on 9/19/2024.
 *
 * @author NareshChocha
 */
public class NotificationActivity extends CordovaActivity {
    TextView mTextViewSnooze;
    TextView mTextViewtv_next;
    LinearLayout mLinearLayout;
    ScrollView mScrollView;
    TextView message;

    Runnable mRunnable;
    private Handler mhandler;
    String content;
    SharedPreferences mSharedPreferences;
    SharedPreferences.Editor mEditor;
    public static TextToSpeech textToSpeech;

    boolean isSpeakingstop = false;
    MySharedPreferences pref;
    private MediaPlayer mediaPlayer;

    private ArrayList<String> notificationMessages = new ArrayList<>();
    Animation slide_down_anim;
    String ReadNoti;
    String notificationTitle;
    String IsFromPlugin = "false";
    SharedPreferences sharedPreferences = context.getSharedPreferences("Notivalue", 0);
    SharedPreferences.Editor editor;


    BroadcastReceiver mMessageReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent.getAction().equals("com.example.Notificationdata")) {
                notificationTitle = intent.getStringExtra("notification_title");
                ReadNoti = intent.getStringExtra("readnoti");
                if (intent.getStringArrayListExtra("notification_list") != null) {
                    notificationMessages = intent.getStringArrayListExtra("notification_list");
                    if(notificationMessages.size() > 0) {
                        if (notificationTitle.equals(notificationMessages.get(0).toString())) {
                            notificationMessages.remove(0);
                        }
                        mLinearLayout.removeAllViews();
                        for (int i = 0; i < notificationMessages.size(); i++) {
                            addtextview(notificationMessages.get(i));
                        }
                    }

                }
            }
        }
    };
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.dialog_popup_notification_received);

        mTextViewSnooze = findViewById(R.id.tv_ok);
        message = (TextView) findViewById(R.id.tvmsgcontent);
        mTextViewtv_next = findViewById(R.id.tv_next);
        mLinearLayout = findViewById(R.id.mLinearlayout);
        mScrollView = findViewById(R.id.scrollview);

        pref = sqlitewraper.getSecureShared("MyPref");
        LocalBroadcastManager.getInstance(this).registerReceiver(mMessageReceiver,
                new IntentFilter("com.example.Notificationdata"));

        mSharedPreferences = getSharedPreferences("MyPref", MODE_PRIVATE);
        mEditor = mSharedPreferences.edit();
        editor = sharedPreferences.edit();

        if (getIntent().getExtras() != null) {
            notificationTitle = getIntent().getExtras().getString("notification_title");
            ReadNoti = getIntent().getExtras().getString("readnoti");
            if (getIntent().getExtras().getString("IsFromPlugin") != null) {
                IsFromPlugin = getIntent().getExtras().getString("IsFromPlugin");
            }
            if (getIntent().getStringArrayListExtra("notification_list") != null) {
                notificationMessages = getIntent().getStringArrayListExtra("notification_list");
                if (notificationMessages.size() > 0) {
                    if (notificationTitle.equals(notificationMessages.get(0).toString())) {
                        notificationMessages.remove(0);
                    }
                    mLinearLayout.removeAllViews();
                    for (int i = 0; i < notificationMessages.size(); i++) {
                            addtextview(notificationMessages.get(i));
                    }

                }
            }
        }
        // Play notification sound
        AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        // Mute the notification sound
        audioManager.setStreamVolume(AudioManager.STREAM_NOTIFICATION, 0, 0);
        // Play a different sound
        MediaPlayer mediaPlayer = MediaPlayer.create(this, R.raw.glitchy);
        mediaPlayer.start();

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            String utteranceId = "unique_id";
            // Speak notification content

            if (ReadNoti.equalsIgnoreCase("yes")) {

                speakingcontent(notificationTitle);

            } else {
                message.setText(notificationTitle);
            }
            slide_down_anim = AnimationUtils.loadAnimation(getApplicationContext(),
                    R.anim.bounce);
            message.startAnimation(slide_down_anim);
            //

        }, 500);


        mTextViewSnooze.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                try {
                    if (textToSpeech != null) {
                        if (notificationMessages.isEmpty()) {
                            isSpeakingstop = true;
                            textToSpeech.stop();
                            startCountDown(message.getText().toString(), "no");
                            notificationMessages.clear();
                            finish();
                        } else {
                            // start timer
                            startCountDown(message.getText().toString(), "yes");

                            for (int i = 0; i < notificationMessages.size(); i++) {
                                //Log.d("notification sizee", String.valueOf(notificationMessages.get(i).toString() + notificationMessages.size()));
                                message.setText("");
                                message.setText(notificationMessages.get(0).toString());
                                slide_down_anim = AnimationUtils.loadAnimation(getApplicationContext(),
                                        R.anim.bounce);
                                message.startAnimation(slide_down_anim);

                            }
                            if (message.getText().toString().equals(notificationMessages.get(0).toString())) {
                                notificationMessages.remove(0);
                                mLinearLayout.removeAllViews();
                                for (int j = 0; j < notificationMessages.size(); j++) {
                                    addtextview(notificationMessages.get(j));
                                }
                            }
                            if (ReadNoti.equalsIgnoreCase("yes")) {
                                textToSpeech.stop();
                                speakingcontent(message.getText().toString());
                            }
                            boolean check4 = DeviceEventsUtils.isMyServiceRunning(context, FloatingBubbleService.class.getName());
                            if (check4) {
                                int count = notificationMessages.size();
                                FloatingBubbleService.mTextViewNotificationCount.setText(String.valueOf(count));
                            }
                        }
                    }
                } catch (IllegalArgumentException e) {
                    Log.e("debug_tag", "view not found");
                }
            }
        });

        mTextViewtv_next.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

                try {
                    if (textToSpeech != null) {
                        if (notificationMessages.isEmpty()) {
                            try {
                                //  textToSpeech.stop();
                                // isSpeakingstop = true;


//                                if (IsFromPlugin.equalsIgnoreCase("true")) {
//
//                                    boolean check4 = DeviceEventsUtils.isMyServiceRunning(context, FloatingBubbleService.class.getName());
//                                    if (check4) {
//                                        Intent intent = new Intent(getApplicationContext(), FloatingBubbleService.class);
//                                        stopService(intent);
//                                    }
//                                }


                                editor.putString("notification_list", "");
                                editor.putString("notification_title","");
                                editor.putString("readnoti","");
                                editor.apply();

                                boolean check4 = DeviceEventsUtils.isMyServiceRunning(context, FloatingBubbleService.class.getName());
                                if (check4) {
                                    FloatingBubbleService.mTextViewNotificationCount.setVisibility(View.GONE);
                                }

                                    Intent intent = new Intent(getApplicationContext(), FloatingBubbleService.class);
                                    startService(intent);
                                    finish();


                               // Intent resultIntent = new Intent(context, OpenNextNotificationPage.class);
                               // startActivity(resultIntent);


                            } catch (IllegalArgumentException e) {
                                Log.e("debug_tag", "view not found");
                            }
                        } else {

                            for (int j = 0; j < notificationMessages.size(); j++) {
                                addtextview(notificationMessages.get(j));

                            }

                            boolean check4 = DeviceEventsUtils.isMyServiceRunning(context, FloatingBubbleService.class.getName());
                            //if (!check4) {
                                Intent intent = new Intent(getApplicationContext(), FloatingBubbleService.class);
                                intent.putExtra("notification_title", notificationMessages.get(0).toString());
                                intent.putExtra("readnoti", ReadNoti);
                                intent.putExtra("notification_list", notificationMessages);
                                startService(intent);
                                finish();
                            //}

                            if (ReadNoti.equalsIgnoreCase("yes")) {
                                textToSpeech.stop();
                                speakingcontent(message.getText().toString());
                            }
                        }
                    }
                } catch (IllegalArgumentException e) {
                    Log.e("debug_tag", "view not found");
                }
            }
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Handle new notification title when the activity is already open
        String notificationTitle = intent.getStringExtra("notification_title");

        notificationMessages.add(notificationTitle);
        addtextview(notificationTitle);
    }


    private CountDownTimer countDownTimer;

    private void startCountDown(String soonzetext, String addnotification) {
        if (countDownTimer != null) {
            countDownTimer.cancel();
        }
        // counter start 5 min
        countDownTimer = new CountDownTimer(300000, 1000) {
            @Override
            public void onTick(long millisUntilFinished) {
                // You can update UI here if needed
            }

            @Override
            public void onFinish() {

                mhandler = new Handler(Looper.getMainLooper());
                mRunnable = new Runnable() {
                    @Override
                    public void run() {
                        if (addnotification.equalsIgnoreCase("yes")) {
                            boolean check4 = DeviceEventsUtils.isMyServiceRunning(context, FloatingBubbleService.class.getName());
                            if (check4) {

                                FloatingBubbleService bubbleService = FloatingBubbleService.getInstance();
                                bubbleService.addNotificationContent(soonzetext,ReadNoti);
                            } else {
                                notificationMessages.add(soonzetext);
                                addtextview(soonzetext);
                            }
                        } else {
                            String utteranceId = "unique_id";
                            textToSpeech.speak(soonzetext, TextToSpeech.QUEUE_ADD, null, utteranceId);
                            message.setText(soonzetext);

                            Intent activityIntent = new Intent(context, NotificationActivity.class);
                            activityIntent.putExtra("notification_title", soonzetext);
                            activityIntent.putExtra("readnoti", "yes");
                            activityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                            context.startActivity(activityIntent);
                        }

                    }
                };
                mhandler.postDelayed(mRunnable, 1000);


            }
        }.start();
    }

//    text to speech convert
    public void speakingcontent(String notificationTitle) {
        textToSpeech = new TextToSpeech(getApplicationContext(), new TextToSpeech.OnInitListener() {
            @Override
            public void onInit(int i) {
                String utteranceId = "unique_id";
                if (i != TextToSpeech.ERROR) {
                    textToSpeech.setLanguage(Locale.getDefault());
                    textToSpeech.speak(notificationTitle, TextToSpeech.QUEUE_ADD, null, utteranceId);
                    message.setText(notificationTitle);
                }

                textToSpeech.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override
                    public void onStart(String s) {
                        Log.d("MainActivity", "TTS speech Stared");
                    }

                    @Override
                    public void onDone(String s) {
                        mhandler = new Handler(Looper.getMainLooper());
                        mRunnable = new Runnable() {
                            @Override
                            public void run() {
                                // TTS speech finished, continue here
                                if (!isSpeakingstop) {
                                    textToSpeech.stop();
                                   // Log.d("MainActivity", "TTS speech finished" + notificationTitle);
                                    textToSpeech.speak(notificationTitle, TextToSpeech.QUEUE_FLUSH, null, utteranceId);
                                }

                            }
                        };
                        mhandler.postDelayed(mRunnable, 2000);

                    }

                    @Override
                    public void onError(String s) {

                    }
                });
            }
        });
    }

//    @Override
//    public void onInit(int status) {
//        if (status == TextToSpeech.SUCCESS) {
//
//            int result = textToSpeech.setLanguage(Locale.getDefault());
//            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
//                Log.e("NotificationListener", "Language not supported");
//            }
//
//            textToSpeech.setOnUtteranceProgressListener(new UtteranceProgressListener() {
//                @Override
//                public void onStart(String utteranceId) {
//                    // TTS speech started
//                    Log.d("MainActivity", "TTS speech Stared");
//                }
//
//                @Override
//                public void onDone(String utteranceId) {
//                    // TTS speech finished, continue here
//                    if (utteranceId.equals("unique_id")) {
//                        // Perform the desired action after TTS speech is finished
//                        Log.d("MainActivity", "TTS speech finished");
//                        content = mSharedPreferences.getString("Content", "");
//
//                            mhandler = new Handler(Looper.getMainLooper());
//                            mRunnable = new Runnable() {
//                                @Override
//                                public void run() {
//                                    Log.d("speech finished", content);
//                                    if (!isSpeakingstop) {
//                                        textToSpeech.stop();
//                                        textToSpeech.speak(content, TextToSpeech.QUEUE_ADD, null, utteranceId);
//                                        // message.setText(content);
//                                    }
//
//                                }
//                            };
//                            mhandler.postDelayed(mRunnable, 2000);
//
//                    }
//                }
//
//                @Override
//                public void onError(String utteranceId) {
//                    // TTS speech error
//                }
//            });
//
//        } else {
//            Log.e("NotificationListener", "TextToSpeech initialization failed");
//        }
//
//    }

    public void addtextview(String tvnoticontent) {
        TextView textView1 = new TextView(this);
        textView1.setLayoutParams(new WindowManager.LayoutParams(WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT));
        textView1.setText(tvnoticontent);
        textView1.setTextColor(Color.parseColor("#E5E4E2"));
        textView1.setTextAlignment(View.TEXT_ALIGNMENT_CENTER);
        textView1.setPadding(20, 20, 20, 20); // in pixels (left, top, right, bottom)
        slide_down_anim = AnimationUtils.loadAnimation(getApplicationContext(),
                R.anim.slide_down);
        textView1.startAnimation(slide_down_anim);
        mLinearLayout.addView(textView1, 0);

        mScrollView.fullScroll(View.FOCUS_DOWN);
    }

    @Override
    public void onDestroy() {
//        if (textToSpeech != null) {
//            textToSpeech.stop();
//            textToSpeech.shutdown();
//        }
//        if (mediaPlayer != null) {
//            mediaPlayer.release();
//        }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        return;
    }

}
