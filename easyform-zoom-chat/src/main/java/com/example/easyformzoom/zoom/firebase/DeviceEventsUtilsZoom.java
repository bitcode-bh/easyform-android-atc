package com.example.easyformzoom.zoom.firebase;

import android.content.Context;
import android.content.SharedPreferences;
import android.database.sqlite.SQLiteDatabase;

import com.example.easyformzoom.zoom.App;

import org.json.JSONArray;

import java.util.ArrayList;

public class DeviceEventsUtilsZoom {

    public static String username="";
    public static String appid="";
    public static String UserId="";
    public static String u_c="";
    public static String roleid="";
    public static String companyFeatureid="";
    public static String company_id="0";
    public static JSONArray webAndroidOpponentArray;
    public static JSONArray iosAndroidOpponentArray;


    public static void saveLoginDetailsToPreferences(String username,String appid,String UserId,String u_c,String roleid,String companyFeatureid,String company_id){

        SharedPreferences sharedPreferences = App.getContext().getSharedPreferences("LOGINDETAILS", Context.MODE_PRIVATE);
//        String dHeight = (sharedPreferences.getString("Height", "320"));
//        String dWidth = (sharedPreferences.getString("Width", "240"));

        SharedPreferences.Editor  sEditor = sharedPreferences.edit();
        sEditor.putString("username",username);
        sEditor.putString("appid",appid);
        sEditor.putString("UserId",UserId);
        sEditor.putString("u_c",u_c);
        sEditor.putString("roleid",roleid);
        sEditor.putString("companyFeatureid",companyFeatureid);
        sEditor.putString("company_id",company_id);
        sEditor.apply();
    }


    public static void retriveDataFromSharedPreferences(){


        SharedPreferences sharedPreferences = App.getContext().getSharedPreferences("LOGINDETAILS", Context.MODE_PRIVATE);
        username = (sharedPreferences.getString("username", "0"));
        appid = (sharedPreferences.getString("appid", "0"));
        UserId = (sharedPreferences.getString("UserId", "0"));
        u_c = (sharedPreferences.getString("u_c", "0"));
        roleid = (sharedPreferences.getString("roleid", "0"));
        companyFeatureid = (sharedPreferences.getString("companyFeatureid", "0"));
        company_id = (sharedPreferences.getString("company_id", "0"));

    }
}
