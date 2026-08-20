package com.sky.atc.easyformse;

import android.location.Location;

public class KalmanFilter2D {
    private static final int STATE_SIZE = 5;
    private static final double EARTH_RADIUS = 6371000.0; // meters

    // State vector: [x (East m), y (North m), vx (m/s), vy (m/s), heading (rad)]
    private double[][] state;
    private double[][] covariance;
    private double[][] measurement;

    private long lastPredictionTime = 0;
    private double originLat = 0.0;
    private double originLon = 0.0;
    private boolean isInitialized = false;

    public KalmanFilter2D() {
        state = new double[STATE_SIZE][1];
        covariance = identity(STATE_SIZE);
        for (int i = 0; i < STATE_SIZE; i++) {
            covariance[i][i] = 100.0;
        }
    }

    public boolean isInitialized() {
        return isInitialized;
    }

    /**
     * Initializes the filter with origin coordinates and heading in degrees.
     *
     * @param initLat        Origin Latitude
     * @param initLon        Origin Longitude
     * @param initHeadingDeg Initial bearing in degrees (0 = North, 90 = East)
     */
    public void init(double initLat, double initLon, double initHeadingDeg) {
        this.originLat = initLat;
        this.originLon = initLon;

        // Position relative to origin is 0,0
        state[0][0] = 0.0; // x (East)
        state[1][0] = 0.0; // y (North)
        state[2][0] = 0.0; // vx
        state[3][0] = 0.0; // vy
        // Convert heading from degrees to radians
        state[4][0] = normalizeAngle(Math.toRadians(initHeadingDeg));
        this.lastPredictionTime = 0;
        this.isInitialized = true;
        this.covariance = identity(STATE_SIZE);
        covariance[0][0] = 25.0;  // Position X uncertainty (m^2)
        covariance[1][1] = 25.0;  // Position Y uncertainty (m^2)
        covariance[2][2] = 10.0;  // Velocity X uncertainty ((m/s)^2)
        covariance[3][3] = 10.0;  // Velocity Y uncertainty ((m/s)^2)
        covariance[4][4] = 0.5;   // Heading uncertainty (rad^2)

        measurement = new double[][]{
                {1, 0, 0, 0, 0},
                {0, 1, 0, 0, 0}
        };



    }

    /**
     * Prediction step using IMU Accelerometer and Gyroscope data.
     *
     * @param accel     [ax, ay, az] in m/s^2 (Linear acceleration preferred)
     * @param gyro      [gx, gy, gz] in rad/s
     * @param timestamp Event timestamp in nanoseconds
     */
    public void predict(float[] accel, float[] gyro, long timestamp) {
        if (!isInitialized) return;

        if (lastPredictionTime == 0) {
            lastPredictionTime = timestamp;
            return;
        }

        double dt = (timestamp - lastPredictionTime) / 1e9;
        lastPredictionTime = timestamp;

        if (dt <= 0.0 || dt > 1.0) {
            return;
        }

        double heading = state[4][0];
        double ax = accel[0]; // lateral (right)
        double ay = accel[1]; // forward (top)

        double cosH = Math.cos(heading);
        double sinH = Math.sin(heading);

        // Body-to-World (ENU) transformation:
        // Heading 0 = North (+Y), 90 deg = East (+X)
        double axEast = ax * cosH + ay * sinH;
        double axNorth = -ax * sinH + ay * cosH;

        // State transition matrix F
        double[][] F = {
                {1, 0, dt, 0,  0},
                {0, 1, 0,  dt, 0},
                {0, 0, 1,  0,  0},
                {0, 0, 0,  1,  0},
                {0, 0, 0,  0,  1}
        };

        // Control input matrix B
        double[][] B = {
                {0.5 * dt * dt, 0},
                {0, 0.5 * dt * dt},
                {dt, 0},
                {0, dt},
                {0, 0}
        };

        double[][] u = {{axEast}, {axNorth}};

        // State prediction
        state = add(multiply(F, state), multiply(B, u));

        // Process noise scaled with dt
        double qPos = 0.1 * dt;
        double qVel = 0.5 * dt;
        double qHeading = 0.02 * dt;

        double[][] processNoise = {
                {qPos, 0,    0,    0,    0},
                {0,    qPos, 0,    0,    0},
                {0,    0,    qVel, 0,    0},
                {0,    0,    0,    qVel, 0},
                {0,    0,    0,    0,    qHeading}
        };

        // Covariance prediction
        covariance = add(multiply(multiply(F, covariance), transpose(F)), processNoise);

        // Update heading from Z-axis gyro
        if (gyro != null && gyro.length >= 3) {
            double omegaZ = gyro[2]; // rad/s
            state[4][0] = normalizeAngle(state[4][0] + omegaZ * dt);
        }
    }

    /**
     * Measurement update step using GPS location fix.
     *
     * @param location GPS location
     */
    public void update(Location location) {
        if (!isInitialized) {
            init(location.getLatitude(), location.getLongitude(), location.getBearing());
            return;
        }

        // Convert Lat/Lon to meters relative to origin (Equirectangular approximation)
        double cosLat = Math.cos(Math.toRadians(originLat));
        double metersX = (location.getLongitude() - originLon) * (Math.PI / 180.0) * EARTH_RADIUS * cosLat;
        double metersY = (location.getLatitude() - originLat) * (Math.PI / 180.0) * EARTH_RADIUS;

        double[][] z = {{metersX}, {metersY}};

        // Measurement noise covariance R based on GPS accuracy
        double accuracy = location.hasAccuracy() ? location.getAccuracy() : 10.0;
        if (accuracy < 2.0) accuracy = 2.0; // minimum noise floor
        double rVar = accuracy * accuracy;
        double[][] R = {{rVar, 0}, {0, rVar}};

        // Innovation y = z - Hx
        double[][] Hx = multiply(measurement, state);
        double[][] y = subtract(z, Hx);

        // Innovation covariance S = HPH^T + R
        double[][] HPHt = multiply(multiply(measurement, covariance), transpose(measurement));
        double[][] S = add(HPHt, R);

        // Kalman gain K = PH^T * S^-1
        double[][] K = multiply(multiply(covariance, transpose(measurement)), inverse(S));

        // State update x = x + Ky
        state = add(state, multiply(K, y));
        state[4][0] = normalizeAngle(state[4][0]);

        // Covariance update P = (I - KH)P
        double[][] I = identity(STATE_SIZE);
        double[][] I_KH = subtract(I, multiply(K, measurement));
        covariance = multiply(I_KH, covariance);
    }

    /**
     * Returns filtered [Latitude, Longitude].
     */
    public double[] getPosition() {
        if (!isInitialized) return new double[]{0.0, 0.0};

        double cosLat = Math.cos(Math.toRadians(originLat));
        if (Math.abs(cosLat) < 1e-6) cosLat = 1e-6;

        double lon = originLon + (state[0][0] / (EARTH_RADIUS * cosLat)) * (180.0 / Math.PI);
        double lat = originLat + (state[1][0] / EARTH_RADIUS) * (180.0 / Math.PI);
        return new double[]{lat, lon};
    }

    /**
     * Returns filtered heading in degrees (0 - 360).
     */
    public double getHeading() {
        double deg = Math.toDegrees(normalizeAngle(state[4][0]));
        if (deg < 0) deg += 360.0;
        return deg;
    }

    // --- Matrix Math Helpers ---

    private double[][] multiply(double[][] A, double[][] B) {
        int m = A.length;
        int n = B[0].length;
        int p = B.length;
        double[][] C = new double[m][n];
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                for (int k = 0; k < p; k++) {
                    C[i][j] += A[i][k] * B[k][j];
                }
            }
        }
        return C;
    }

    private double[][] add(double[][] A, double[][] B) {
        int m = A.length;
        int n = A[0].length;
        double[][] C = new double[m][n];
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                C[i][j] = A[i][j] + B[i][j];
            }
        }
        return C;
    }

    private double[][] subtract(double[][] A, double[][] B) {
        int m = A.length;
        int n = A[0].length;
        double[][] C = new double[m][n];
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                C[i][j] = A[i][j] - B[i][j];
            }
        }
        return C;
    }

    private double[][] transpose(double[][] A) {
        int m = A.length;
        int n = A[0].length;
        double[][] T = new double[n][m];
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                T[j][i] = A[i][j];
            }
        }
        return T;
    }

    private double[][] identity(int n) {
        double[][] I = new double[n][n];
        for (int i = 0; i < n; i++) {
            I[i][i] = 1.0;
        }
        return I;
    }

    private double[][] inverse(double[][] A) {
        if (A.length == 2) {
            double det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
            if (Math.abs(det) < 1e-10) return identity(2);
            return new double[][]{
                    {A[1][1] / det, -A[0][1] / det},
                    {-A[1][0] / det, A[0][0] / det}
            };
        }
        return identity(A.length);
    }

    private double normalizeAngle(double angle) {
        while (angle > Math.PI) angle -= 2.0 * Math.PI;
        while (angle < -Math.PI) angle += 2.0 * Math.PI;
        return angle;
    }
}