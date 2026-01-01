package com.easyform.newjitsi.activitys.drawing.models;

public class RemoteUtils {

    public static int calRatioHeight;
    public static int newNormalHeight;

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
