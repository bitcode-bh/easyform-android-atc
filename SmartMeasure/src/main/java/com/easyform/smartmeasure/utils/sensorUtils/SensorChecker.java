package com.easyform.smartmeasure.utils.sensorUtils;

/**
 * Created by NareshChocha on 12/05/2021.
 *
 * @author NareshChocha
 */
public interface SensorChecker {

	/**
	 * Checks if the device that is currently running the application has a hardware gyroscope built into it.
	 * 
	 * @return True, if a gyroscope is available. False otherwise.
	 */
	boolean IsGyroscopeAvailable();
}