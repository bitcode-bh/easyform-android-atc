package com.easyform.newjitsi.utils;

import android.content.Context;
import android.content.Intent;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import org.jitsi.meet.sdk.BroadcastIntentHelper;

public class JitsiMeetBroadcastUtils {

    public static void screenShareToggle(Context context, Boolean shareToggle) {
        Intent ScreenOnIntent = BroadcastIntentHelper.buildToggleScreenShareIntent(shareToggle);
        LocalBroadcastManager.getInstance(context).sendBroadcast(ScreenOnIntent);
    }


    public static void endMeeting(Context context) {
        Intent ScreenOnIntent = BroadcastIntentHelper.buildHangUpIntent();
        LocalBroadcastManager.getInstance(context).sendBroadcast(ScreenOnIntent);
    }

}
