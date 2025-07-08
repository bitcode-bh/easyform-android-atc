package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.snackbar.Snackbar;


import io.michaelrocks.paranoid.Obfuscate;

//to Setting app
@Obfuscate
public class SettingFragment extends Fragment {

    MaterialButton mbtnCheckDeveloper;
    boolean settingEnabled;
    int result;
    String ischeckdontkeepsetting;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_setting, container,
                false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        mbtnCheckDeveloper = view.findViewById(R.id.mbtcheckdeveloper);

        mbtnCheckDeveloper.setOnClickListener(v -> {
            // for check device setting developer option enable disable
            settingEnabled = Settings.Global.getInt(context.getContentResolver(), Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, Build.TYPE.equals("eng") ? 1 : 0) != 0;
            // false means option off true means option on

            // for check don't keep activity options from setting
            result = Settings.Global.getInt(context.getContentResolver(), Settings.Global.ALWAYS_FINISH_ACTIVITIES, 0);
            // 0 means option off 1 means option on
//
            if (result == 1) {
                ischeckdontkeepsetting = "true";
            } else {
                ischeckdontkeepsetting = "false";
            }

            Intent sharingIntent = new Intent(android.content.Intent.ACTION_SEND);
            sharingIntent.setType("text/plain");
            String[] shareEmail = {"krishna.vaddoriya@skyproductivity.com"};
            String shareSub = "Device details";
            String shareBody = "Device name: " + getDeviceName() + "\nDevice model: " + Build.MODEL +"\nAndroid version: " + Build.VERSION.RELEASE +"\nDeveloper option: " + settingEnabled
            +"\nDon't keep activity: " + ischeckdontkeepsetting ;
            sharingIntent.putExtra(Intent.EXTRA_EMAIL, shareEmail);
            sharingIntent.putExtra(android.content.Intent.EXTRA_SUBJECT, shareSub);
            sharingIntent.putExtra(android.content.Intent.EXTRA_TEXT, shareBody);
            startActivity(Intent.createChooser(sharingIntent,"Email Chooser"));
        });

    }
    public String getDeviceName() {
        String manufacturer = Build.MANUFACTURER;
        String model = Build.MODEL;
        if (model.toLowerCase().startsWith(manufacturer.toLowerCase())) {
            return capitalize(model);
        } else {
            return capitalize(manufacturer) + " " + model;
        }
    }

    private String capitalize(String s) {
        if (s == null || s.length() == 0) {
            return "";
        }
        char first = s.charAt(0);
        if (Character.isUpperCase(first)) {
            return s;
        } else {
            return Character.toUpperCase(first) + s.substring(1);
        }
    }

    void showSnackBar(View view, String message) {
        Snackbar snackbar = Snackbar.make(view, message, Snackbar.LENGTH_INDEFINITE);
        snackbar.setAction("Ok", v -> {
            snackbar.dismiss();
        });
        snackbar.show();
    }

}
