package com.easyform.smartmeasure.models;

/**
 * Created by NareshChocha on 5/13/2022.
 *
 * @author NareshChocha
 */
public class TriangleData {
    private double triangleX;

    private String filePath;

    public TriangleData(double triangleX, String filePath) {
        this.triangleX = triangleX;
        this.filePath = filePath;
    }

    public void setTriangleX(double triangleX) {
        this.triangleX = triangleX;
    }

    public double getTriangleX() {
        return triangleX;
    }


    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getFilePath() {
        return filePath;
    }



    @Override
    public String toString() {
        return
                "TriangleData{ " +
                        "filePath = '" + filePath + '\'' +
                        ",triangleX = '" + triangleX + '\'' +
                        " }";
    }
}
