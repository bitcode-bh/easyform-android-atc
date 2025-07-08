package com.easyform.jitsi.utils.drawing;

import android.view.MotionEvent;


/**
 * Created by  SAVAN SOLANKI on 10/06/2022.
 *
 * @author Savan Solanki
 */
public class ImageArrowUtils {


    public static String getArrowType() {
        return arrowType;
    }

    public static void setArrowType(String arrowType) {
        ImageArrowUtils.arrowType = arrowType;
    }

    public static String getArrowColor() {
        return arrowColor;
    }

    public static void setArrowColor(String arrowColor) {
        ImageArrowUtils.arrowColor = arrowColor;
    }

    private static String arrowType = "down";
    private static String arrowColor = "blue";

    public static boolean isIsDrawingEnabled() {
        return isDrawingEnabled;
    }

    public static void setIsDrawingEnabled(boolean isDrawingEnabled) {
        ImageArrowUtils.isDrawingEnabled = isDrawingEnabled;
    }

    private static boolean isDrawingEnabled;

    public static MotionEvent getMotionEvent() {
        return motionEvent;
    }

    public static void setMotionEvent(MotionEvent motionEvent) {
        ImageArrowUtils.motionEvent = motionEvent;
    }

    private static MotionEvent motionEvent;
}
