package com.easyform.smartmeasure.utils;

import android.util.Log;

/**
 * Created by NareshChocha on 5/10/2022.
 *
 * @author NareshChocha
 */
public class TriangleConstants {

    /**
     * @param height set by user
     * @param degree most be lesser than 90°
     * @return base size of Triangle
     * @author NareshChocha
     */
    public static double getBase(double height, double degree) {
        double area = TriangleConstants.findArea(height, degree, 90);
        return TriangleConstants.findBase(height, area);
    }

    /**
     * @param a     height of triangle in miter
     * @param beta  β triangle
     * @param gamma γ triangle that will be 90° default
     * @return Area of the triangle
     * @author NareshChocha
     */
    private static double findArea(double a, double beta, double gamma) {
        double height = Math.pow(a, 2);
        double mBeta = Math.sin(Math.toRadians(beta));
        double mGamma = Math.sin(Math.toRadians(gamma));
        double sum = Math.toRadians(gamma + beta);
        double sumSin = Math.sin(sum);

        return height * mBeta * mGamma / (2 * sumSin);
    }

    /**
     * @param a    height of triangle
     * @param area of triangle return From {@link #findArea(double, double, double)}
     * @return base of the triangle
     * @author NareshChocha
     */
    private static double findBase(double a, double area) {
        return 2 * area / a;
    }

    /**
     * @param baseSize size of base Triangle return From {@link #getBase(double, double)}
     * @param degree   most be grater than 90°
     * @return Height
     * @author NareshChocha
     */
    public static double getHeight(double baseSize, double degree) {
        double area = TriangleConstants.findArea(baseSize, (degree -90));
        return TriangleConstants.findHeight(baseSize, area);
    }

    /**
     * @param b     base of triangle return From {@link #getBase(double, double)}
     * @param alpha α triangle
     * @return Area of the triangle
     * @author NareshChocha
     */
    private static double findArea(double b, double alpha) {
        return Math.pow(b, 2) * Math.tan(Math.toRadians(alpha)) / 2;
    }

    /**
     * @param base of triangle return From {@link #getBase(double, double)}
     * @param area of triangle  return From {@link #findArea(double, double)}
     * @return height of the triangle
     * @author NareshChocha
     */
    private static double findHeight(double base, double area) {
        return 1 * area / base;
    }
}
