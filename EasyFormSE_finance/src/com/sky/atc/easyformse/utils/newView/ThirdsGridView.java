package com.sky.atc.easyformse.utils.newView;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.util.AttributeSet;
import android.view.View;

/** The rule-of-thirds grid drawn over a camera picture: two lines each way. */
public class ThirdsGridView extends View {
    private final Paint line = new Paint();

    public ThirdsGridView(Context context, AttributeSet attrs) {
        super(context, attrs);
        line.setColor(0x38FFFFFF);
        line.setStrokeWidth(getResources().getDisplayMetrics().density);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        float w = getWidth(), h = getHeight();
        canvas.drawLine(w / 3f, 0, w / 3f, h, line);
        canvas.drawLine(2f * w / 3f, 0, 2f * w / 3f, h, line);
        canvas.drawLine(0, h / 3f, w, h / 3f, line);
        canvas.drawLine(0, 2f * h / 3f, w, 2f * h / 3f, line);
    }
}
