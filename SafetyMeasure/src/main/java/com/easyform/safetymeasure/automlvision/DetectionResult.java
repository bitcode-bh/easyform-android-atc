package com.easyform.safetymeasure.automlvision;

import android.graphics.RectF;

public class DetectionResult {

    public final RectF bbox;
    public final String label;
    public final float score;

    public DetectionResult(RectF bbox, String label, float score) {
        this.bbox = bbox;
        this.label = label;
        this.score = score;
    }

}
