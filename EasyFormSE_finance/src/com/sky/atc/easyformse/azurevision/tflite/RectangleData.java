package com.sky.atc.easyformse.azurevision.tflite;

public class RectangleData {
    private float top;
    private float bottom;
    private float right;
    private String detectedText;
    private double probability = -1;
    private boolean canGet = true;
    private float left;

    public double getProbability() {
        return probability;
    }

    public void setProbability(double probability) {
        this.probability = probability;
    }


    public boolean isCanGet() {
        return canGet;
    }

    public void setCanGet(boolean canGet) {
        this.canGet = canGet;
    }

    public float getTop() {
        return top;
    }

    public void setTop(float top) {
        this.top = top;
    }

    public float getBottom() {
        return bottom;
    }

    public void setBottom(float bottom) {
        this.bottom = bottom;
    }

    public float getRight() {
        return right;
    }

    public void setRight(float right) {
        this.right = right;
    }

    public float getLeft() {
        return left;
    }

    public void setLeft(float left) {
        this.left = left;
    }

    public String getDetectedText() {
        return detectedText;
    }

    public void setDetectedText(String detectedText) {
        this.detectedText = detectedText;
    }

    public RectangleData(float left, float top, float right, float bottom, String detectedText) {
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.detectedText = detectedText;
    }

    @Override
    public String toString() {
        return "RectangleData{" +
                "top=" + top +
                ", bottom=" + bottom +
                ", right=" + right +
                ", detectedText='" + detectedText + '\'' +
                ", probability=" + probability +
                ", canGet=" + canGet +
                ", left=" + left +
                "}\n";
    }
}
