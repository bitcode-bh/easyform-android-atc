package com.sky.atc.easyformse;

/**
 * Created by NareshChocha on 4/28/2025.
 *
 * @author NareshChocha
 */
public class NativeClass {




    public static String stringFromJNI() {
        return a();
    }
    public static native String a();

    static boolean isCheckRoot()
    {
        return b();
    }
    public static native boolean b();


    static boolean isCheckDebug()
    {
        return c();
    }
    public static native boolean c();

    static boolean isFridaServer()
    {
        return d();
    }
    public static native boolean d();

    static boolean isMagiskDetected()
    {
        return f();
    }
    public static native boolean f();

    static boolean FridaServer()
    {
        return g();
    }
    public static native boolean g();

    static boolean detectShamikoNative()
    {
        return h();
    }
    public static native boolean h();

    static boolean detectHook()
    {
        return I();
    }
    public static native boolean I();


}
