package com.easyform.newjitsi.activitys;

import androidx.appcompat.app.AppCompatActivity;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.TextView;

import com.easyform.newjitsi.R;
import com.easyform.newjitsi.network.Apis;
import com.easyform.newjitsi.network.requests.LoginData;
import com.easyform.newjitsi.utils.Utils;
import com.facebook.react.modules.core.PermissionListener;

import org.jitsi.meet.sdk.BroadcastEvent;
import org.jitsi.meet.sdk.JitsiMeet;
import org.jitsi.meet.sdk.JitsiMeetActivity;
import org.jitsi.meet.sdk.JitsiMeetActivityDelegate;
import org.jitsi.meet.sdk.JitsiMeetActivityInterface;
import org.jitsi.meet.sdk.JitsiMeetConferenceOptions;
import org.jitsi.meet.sdk.JitsiMeetOngoingConferenceService;
import org.jitsi.meet.sdk.JitsiMeetUserInfo;
import org.jitsi.meet.sdk.log.JitsiMeetLogger;
import org.w3c.dom.Text;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public class JitsiMeetCustomActivity extends JitsiMeetActivity {
    String JWTToken;
    String UserDataURL;
    LoginData mLoginData = null;
    private final BroadcastReceiver broadcastReceiver = new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            JitsiMeetCustomActivity.this.onBroadcastReceived(intent);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (!Objects.equals(getIntent().getAction(), "org.jitsi.meet.CONFERENCE")) {
            getIntentExtraData(getIntent().getExtras());
            registerForBroadcastMessages();
            URL serverURL = null;
            try {
                serverURL = new URL(Apis.JITSI_MEET_URL);
            } catch (MalformedURLException e) {
                e.printStackTrace();
            }
            if (serverURL != null) {
                JitsiMeetUserInfo mJitsiMeetUserInfo = new JitsiMeetUserInfo();
                mJitsiMeetUserInfo.setDisplayName(mLoginData.getUsername());
                JitsiMeetConferenceOptions options = new JitsiMeetConferenceOptions.Builder()
                        .setServerURL(serverURL)
                        .setRoom(JWTToken)
                        .setAudioMuted(true)

                        .setUserInfo(mJitsiMeetUserInfo)
                        .setFeatureFlag("notifications.enabled", true)
                        .setFeatureFlag("invite.enabled", false)
                        .setFeatureFlag("android.screensharing.enabled", true)
                        .setFeatureFlag("pip-while-screen-sharing.enabled", true)
                        .setFeatureFlag("video-share.enabled", true)
                        .setVideoMuted(true)
                        .build();


                Customlaunch(this, options);
            }
        } else {

            getJitsiView().addView(getMyView());
        }
    }

    View getMyView() {
        return LayoutInflater.from(this).inflate(R.layout.activity_jitsi_meet_custom, null, false);

    }

    public static void Customlaunch(Context context, JitsiMeetConferenceOptions options) {
        Intent intent = new Intent(context, JitsiMeetCustomActivity.class);
        intent.setAction("org.jitsi.meet.CONFERENCE");
        intent.putExtra("JitsiMeetConferenceOptions", options);

        if (!(context instanceof Activity)) {
            intent.setFlags(268435456);
        }

        context.startActivity(intent);
    }


    private void onBroadcastReceived(Intent intent) {
        if (intent != null) {
            BroadcastEvent event = new BroadcastEvent(intent);
            switch (event.getType()) {
                case CONFERENCE_JOINED:
                    this.onConferenceJoined(event.getData());
                    break;
                case CONFERENCE_WILL_JOIN:
                    this.onConferenceWillJoin(event.getData());
                    break;
                case CONFERENCE_TERMINATED:
                    this.onConferenceTerminated(event.getData());
                    break;
                case PARTICIPANT_JOINED:
                    this.onParticipantJoined(event.getData());
                    break;
                case SCREEN_SHARE_TOGGLED:
                    this.onScreenShareToggled(event.getData());
                    break;
                case PARTICIPANTS_INFO_RETRIEVED:
                    this.onParticipantsInfoRetrieved(event.getData());
                    break;
                case PARTICIPANT_LEFT:
                    this.onParticipantLeft(event.getData());
            }
        }
    }

    protected void onConferenceTerminated(HashMap<String, Object> extraData) {
        JitsiMeetLogger.i("Conference terminated: " + extraData, new Object[0]);
        this.finish();
    }

    protected void onConferenceWillJoin(HashMap<String, Object> extraData) {
        JitsiMeetLogger.i("Conference will join: " + extraData, new Object[0]);
    }

    protected void onParticipantJoined(HashMap<String, Object> extraData) {
        try {
            JitsiMeetLogger.i("Participant joined: ", new Object[]{extraData});
        } catch (Exception var3) {
            JitsiMeetLogger.w("Invalid participant joined extraData", new Object[]{var3});
        }

        Intent send = new Intent("org.jitsi.meet.RETRIEVE_PARTICIPANTS_INFO");
        send.putExtra("requestId", "demo");
        LocalBroadcastManager.getInstance(this).sendBroadcast(send);
    }

    protected void onScreenShareToggled(HashMap<String, Object> extraData) {
        try {
            JitsiMeetLogger.i("onScreenShareToggled joined: ", new Object[]{extraData});
        } catch (Exception var3) {
            JitsiMeetLogger.w("Invalid participant joined extraData", new Object[]{var3});
        }
    }

    protected void onParticipantsInfoRetrieved(HashMap<String, Object> extraData) {
        try {
            for (Map.Entry<String, Object> entry : extraData.entrySet()) {
                JitsiMeetLogger.e("onParticipantsInfoRetrieved : ", "key: " + entry.getKey() + "  value: " + entry.getValue());
            }

        } catch (Exception var3) {
            JitsiMeetLogger.w("Invalid participant joined extraData", new Object[]{var3});
        }
    }

    protected void onParticipantLeft(HashMap<String, Object> extraData) {
        try {
            JitsiMeetLogger.i("Participant left: ", new Object[]{extraData});
        } catch (Exception var3) {
            JitsiMeetLogger.w("Invalid participant left extraData", new Object[]{var3});
        }

    }

    private void registerForBroadcastMessages() {
        IntentFilter intentFilter = new IntentFilter();
        BroadcastEvent.Type[] var2 = BroadcastEvent.Type.values();
        int var3 = var2.length;

        for (int var4 = 0; var4 < var3; ++var4) {
            BroadcastEvent.Type type = var2[var4];
            intentFilter.addAction(type.getAction());
        }

        LocalBroadcastManager.getInstance(this).registerReceiver(this.broadcastReceiver, intentFilter);
    }

    private void getIntentExtraData(Bundle extras) {
        try {
            JWTToken = extras.getString(Utils.BundleExtras.JWT_TOKEN);
            UserDataURL = extras.getString(Utils.BundleExtras.USER_DATA_URL);
            mLoginData = (LoginData) extras.getSerializable(Utils.BundleExtras.LOGIN_DATA);

        } catch (Exception e) {

        }

    }
}