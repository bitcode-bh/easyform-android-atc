package com.easyform.jitsi.utils.drawing;

/**
 * Created by  SAVAN SOLANKI on 10/06/2022.
 *
 * @author Savan Solanki
 */

public class ArDrawingUtils {


    public static boolean isDrawingEnable = false;

    public static String getDrawingType() {
        return drawingType;
    }

    public static void setDrawingType(String drawingType) {
        ArDrawingUtils.drawingType = drawingType;
    }

    private static String drawingType = "";

}
