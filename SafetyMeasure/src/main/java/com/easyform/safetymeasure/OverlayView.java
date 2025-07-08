package com.easyform.safetymeasure;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.util.Log;
import android.view.View;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by NareshChocha on 5/27/2025.
 *
 * @author NareshChocha
 */
public class OverlayView extends View {
    private List<YOLODetection> detections = new ArrayList<>();
    private Paint boxPaint;
    private Paint labelTextPaint;
    Paint labelBackgroundPaint;

    public OverlayView(Context context) {
        super(context);
        init();
    }

    public OverlayView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        boxPaint = new Paint();
//        boxPaint.setColor(Color.parseColor("#008000"));
        boxPaint.setStyle(Paint.Style.STROKE);
        boxPaint.setStrokeWidth(3);

        labelBackgroundPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
//        labelBackgroundPaint.setColor(Color.parseColor("#008000"));

        labelTextPaint = new Paint();
        labelTextPaint.setColor(Color.WHITE);
        labelTextPaint.setTextSize(20);
        labelTextPaint.setStrokeWidth(2);
    }

    public void setDetections(List<YOLODetection> detections) {
        this.detections = detections;
        invalidate();
    }

    @SuppressLint("DrawAllocation")
    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        int index = 0;

        SafetyMeasureActivity.jsonArray = new JSONArray();
        for (YOLODetection detection : detections) {
            float x = detection.box_x;
            float y = detection.box_y;
            float width = detection.box_width;
            float height = detection.box_height;

            float confidence = Float.parseFloat(String.format("%.2f", detection.confidence));
            if(confidence >= 0.5 && detection.className.equalsIgnoreCase("WithHelmet"))
            {
                boxPaint.setColor(Color.parseColor("#008000"));
                labelBackgroundPaint.setColor(Color.parseColor("#008000"));
            }
            else if(confidence >= 0.4 && detection.className.equalsIgnoreCase("Mask"))
            {
                boxPaint.setColor(Color.parseColor("#008000"));
                labelBackgroundPaint.setColor(Color.parseColor("#008000"));
            }
            else if(confidence >= 0.5 && detection.className.equalsIgnoreCase("Safety Vest"))
            {
                boxPaint.setColor(Color.parseColor("#008000"));
                labelBackgroundPaint.setColor(Color.parseColor("#008000"));
            }
            else {
                boxPaint.setColor(Color.parseColor("#D0312D"));
                labelBackgroundPaint.setColor(Color.parseColor("#D0312D"));
            }

            float left = x - width / 2;
            float top = y - height / 2;
            float right = x + width / 2;
            float bottom = y + height / 2;



            // Draw bounding box
            canvas.drawRect(new RectF(left, top, right, bottom), boxPaint);

            // Prepare label
            String label = detection.className + " " + String.format("%.2f", detection.confidence);

            // Measure text size
            Rect textBounds = new Rect();
            labelTextPaint.getTextBounds(label, 0, label.length(), textBounds);
            float textWidth = textBounds.width();
            float textHeight = textBounds.height();

            // Alternate X offset: -40, 0, +40
            float[] xOffsets = {-70, 0};
            float labelOffsetX = xOffsets[index % xOffsets.length];

            float labelLeft = left + labelOffsetX;
            if (labelLeft + textWidth + 20 > getWidth())
                labelLeft = getWidth() - textWidth - 20;
            if (labelLeft < 0) labelLeft = 10;

            float labelTop = top - 10;
            if (labelTop < 0) labelTop = top + 10;


            // Background box
            float backgroundLeft = labelLeft;
            float backgroundTop = labelTop - textHeight - 10;
            float backgroundRight = labelLeft + textWidth + 20;
            float backgroundBottom = labelTop + 10;

            canvas.drawRect(backgroundLeft, backgroundTop, backgroundRight, backgroundBottom, labelBackgroundPaint);

            canvas.drawText(label, labelLeft + 10, labelTop, labelTextPaint);

            try{
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("Name", detection.className);
                jsonObject.put("confidence",String.format("%.2f", detection.confidence));
                SafetyMeasureActivity.jsonArray.put(jsonObject);
//                 Log.d("JsonArray",SafetyMeasureActivity.jsonArray.toString());
            }
            catch (Exception e)
            {
                Log.d("Exception",e.toString());
            }

            index++; // for alternating positions
            // Move right for next label
//            labelOffsetX += (textWidth + 40);
//            if (labelOffsetX > bitmap.getWidth()) labelOffsetX = 0;

        }
    }
}
