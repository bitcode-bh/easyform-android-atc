package com.sky.atc.easyformse;

import android.app.Notification;
import android.content.Intent;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

public class VoipNotificationService
        extends NotificationListenerService {

    private static final String TAG = "WHATSAPP_CALL";

    public static final String ACTION_WHATSAPP_CALL =
            "com.sky.atc.easyformse.WHATSAPP_CALL";
    public static final String ACTION_Teams_CALL =
            "com.sky.atc.easyformse.Teams_CALL";

    public static final String EXTRA_CALL_STATE =
            "call_state";

    public static final String CALL_STARTED =
            "STARTED";

    public static final String CALL_ENDED =
            "ENDED";


    private static final String WHATSAPP_PACKAGE = "com.whatsapp";

    private boolean whatsappCallActive = false;


    @Override
    public void onNotificationPosted(
            StatusBarNotification sbn) {

//        if (!"com.whatsapp".equals(sbn.getPackageName())) {
//            return;
//        }

        String packageName = sbn.getPackageName();

        if (WHATSAPP_PACKAGE.equals(packageName)) {

            handleWhatsAppPosted(sbn);

        }


    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {

        String packageName = sbn.getPackageName();

        if (WHATSAPP_PACKAGE.equals(packageName)) {

            handleWhatsAppRemoved(sbn);

        }
    }

    private void sendCallEvent(String state) {

        Intent intent =
                new Intent(ACTION_WHATSAPP_CALL);

        intent.setPackage(getPackageName());

        intent.putExtra(
                EXTRA_CALL_STATE,
                state);

        sendBroadcast(intent);
    }



    private void handleWhatsAppPosted(StatusBarNotification sbn) {

        Notification notification = sbn.getNotification();

        if (notification == null ||
                notification.extras == null) {
            return;
        }

        Bundle extras = notification.extras;

        CharSequence textCs =
                extras.getCharSequence(Notification.EXTRA_TEXT);

        String text = textCs != null
                ? textCs.toString()
                : "";

        Log.d("WHATSAPP_CALL",
                "POSTED id=" + sbn.getId()
                        + " text=" + text);

        if ("Incoming voice call".equalsIgnoreCase(text.trim())) {

            Log.d("WHATSAPP_CALL",
                    "Incoming WhatsApp call");

            return;
        }

        if ("Ongoing voice call".equalsIgnoreCase(text.trim())) {

            if (!whatsappCallActive) {

                whatsappCallActive = true;

                Log.d("WHATSAPP_CALL",
                        "WhatsApp CALL START");

                sendCallEvent(CALL_STARTED);
            }
        }
    }



    private void handleWhatsAppRemoved(
            StatusBarNotification sbn) {

        Log.d("WHATSAPP_CALL",
                "REMOVED id=" + sbn.getId());

        Log.d("WHATSAPP_CALL",
                "whatsappCallActive="
                        + whatsappCallActive);

        if (whatsappCallActive) {

            Log.d("WHATSAPP_CALL",
                    "WHATSAPP CALL END");

            sendCallEvent(CALL_ENDED);

            whatsappCallActive = false;
        }
    }


}
