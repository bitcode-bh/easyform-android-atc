package com.sky.atc.easyformse;

public class IMUSample {
    public final float[] accel;
    public final float[] gyro;
    public final long timestamp;

    public IMUSample(float[] accel, float[] gyro, long timestamp) {
        this.accel = accel;
        this.gyro = gyro;
        this.timestamp = timestamp;
    }
}