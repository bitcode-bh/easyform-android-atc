package com.easyform.newjitsi.utils;

import com.easyform.newjitsi.network.requests.notifcation.FirebaseRequestData;
import org.junit.Test;
import java.util.Map;
import static org.junit.Assert.*;

public class FCMNotificationPayloadTest {
    private FirebaseRequestData invite(String senderPlatform) {
        return new FirebaseRequestData("Call body", "Call title", "call", "sender",
                "room", "jitsiMeet", "0", "sender-token", "", "",
                senderPlatform, "remote-token", "1", "2", "jitsiMeet", "", "",
                false, "", "");
    }

    @Test
    public void androidSenderToIosRecipientIncludesAnAlert() {
        Map<?, ?> message = (Map<?, ?>) FCMNotificationApiCall
                .buildMessage(invite("android"), "ios-token", true).get("message");
        Map<?, ?> alert = (Map<?, ?>) message.get("notification");
        assertEquals("Call title", alert.get("title"));
        assertEquals("Call body", alert.get("body"));
        assertEquals("ios-token", message.get("token"));
        assertEquals("android", ((Map<?, ?>) message.get("data")).get("devicetype"));
    }

    @Test
    public void iosSenderToAndroidRecipientRemainsDataOnly() {
        Map<?, ?> message = (Map<?, ?>) FCMNotificationApiCall
                .buildMessage(invite("ios"), "android-token", false).get("message");
        assertFalse(message.containsKey("notification"));
        assertEquals("android-token", message.get("token"));
        assertEquals("ios", ((Map<?, ?>) message.get("data")).get("devicetype"));
    }
}
