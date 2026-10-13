package com.easyform.newjitsi.activitys.call;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.os.StrictMode;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.NotificationManagerCompat;

import com.easyform.newjitsi.R;
import com.easyform.newjitsi.activitys.loading.LoadingActivity;
import com.easyform.newjitsi.broadcasts.JitsiPluginBroadcast;
import com.easyform.newjitsi.utils.NotificationUtils;
import com.easyform.newjitsi.utils.Utils;

public class IncomingCallActivity extends AppCompatActivity {

    ImageButton btnAccept;
    ImageButton btnReject;
    TextView txtCallfrom;

    Bundle extras;
    int notificationId;
    String callfrom;
    Intent intent;
    public static Activity mActivity;
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        setContentView(R.layout.activity_incoming);
        mActivity = IncomingCallActivity.this;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            // For newer than Android Oreo: call setShowWhenLocked, setTurnScreenOn
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            // If you want to display the keyguard to prompt the user to unlock the phone:
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            keyguardManager.requestDismissKeyguard(this, null);
            keyguardManager.inKeyguardRestrictedInputMode();
        } else {
            // For older versions, do it as you did before.
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }

        int flags = WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH
                | WindowManager.LayoutParams.FLAG_FULLSCREEN;
        getWindow().addFlags(flags);

        btnAccept = findViewById(R.id.takeBtn);
        btnReject = findViewById(R.id.rejectBtn);
        txtCallfrom = findViewById(R.id.type_inc_call);
        // The two buttons used to bounce every three seconds. They are plain
        // labelled buttons now (activity_incoming.xml), and the label is drawn
        // over the button, so moving the button would slide it out from under
        // its own words.

        intent = getIntent();
        if (intent != null) {

            callfrom = intent.getStringExtra("callfrom");
            extras = intent.getBundleExtra("Bundle_extras");
            notificationId = intent.getIntExtra("notificationId",0);

            txtCallfrom.setText(callfrom);
        }


        btnAccept.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

                dismissNotification();
                Intent loadingActivityIntent = getLoadingActivityIntent(IncomingCallActivity.this, Utils.BroadcastAction.JITSI_CALL_ACCEPT, extras);
                loadingActivityIntent.putExtra(Utils.BroadcastActionExtrasKeys.NOTIFICATION_ID, notificationId);
                startActivity(loadingActivityIntent);
                finish();
            }
        });
        btnReject.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                dismissNotification();

                Intent rejectIntent = new Intent(IncomingCallActivity.this, JitsiPluginBroadcast.class);
                rejectIntent.setAction(Utils.BroadcastAction.JITSI_CALL_REJECT);
                rejectIntent.putExtra(Utils.BroadcastActionExtrasKeys.NOTIFICATION_ID, notificationId); // use actual ID
                rejectIntent.putExtras(extras);
                sendBroadcast(rejectIntent);

                finish();
            }
        });

    }

    Intent getLoadingActivityIntent(Context context, String action, Bundle extras) {
        Intent loadingActivityIntent = new Intent(context, LoadingActivity.class);
        loadingActivityIntent.setAction(action);
        loadingActivityIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        loadingActivityIntent.putExtras(extras);
        return loadingActivityIntent;
    }

    public void dismissNotification() {
        NotificationManagerCompat notificationManager1 = NotificationManagerCompat.from(getApplicationContext());
        notificationManager1.cancel(notificationId);
    }

    @Override
    protected void onResume() {
        super.onResume();

    }

    @Override
    protected void onStart() {
        super.onStart();
    }

    @Override
    public void onBackPressed() {
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        dismissNotification();
        NotificationUtils.stopRingtone();
        finish();
    }

    public void finishActivity()
    {
        finish();
    }
}
