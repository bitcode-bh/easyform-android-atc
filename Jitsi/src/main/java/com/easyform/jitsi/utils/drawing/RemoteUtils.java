package com.easyform.jitsi.utils.drawing;


/**
 * Created by  SAVAN SOLANKI on 10/06/2022.
 *
 * @author Savan Solanki
 */
public class RemoteUtils {

    public static int calRatioHeight;
    public static int newNormalHeight;
    private static String participateId;


    public static String getParticipateId() {
        return participateId;
    }

    public static void setParticipateId(String participateId) {
        RemoteUtils.participateId = participateId;
    }

    public static int getRealSizeHeight() {
        return realSizeHeight;
    }

    public static void setRealSizeHeight(int realSizeHeight) {
        RemoteUtils.realSizeHeight = realSizeHeight;
    }

    public static int getRealSizeWidth() {
        return realSizeWidth;
    }

    public static void setRealSizeWidth(int realSizeWidth) {
        RemoteUtils.realSizeWidth = realSizeWidth;
    }

    private static int realSizeHeight;
    private static int realSizeWidth;

    private static int remoteHeight;

    public static int getRemoteHeight() {
        return remoteHeight;
    }

    public static void setRemoteHeight(int remoteHeight) {
        RemoteUtils.remoteHeight = remoteHeight;
    }

    public static int getRemoteWidth() {
        return remoteWidth;
    }

    public static void setRemoteWidth(int remoteWidth) {
        RemoteUtils.remoteWidth = remoteWidth;
    }

    private static int remoteWidth;


}
