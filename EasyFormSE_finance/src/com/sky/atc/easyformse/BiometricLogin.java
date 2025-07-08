package com.sky.atc.easyformse;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;

import com.bumptech.glide.Glide;
import com.sky.atc.easyformse.datautils.MySharedPreferences;

/**
 * Created by NareshChocha on 4/24/2024.
 *
 * @author NareshChocha
 */
public class BiometricLogin extends AppCompatActivity {
    private BiometricPrompt biometricPrompt;
    private BiometricPrompt.PromptInfo promptInfo;

    MySharedPreferences pref;
    String Colorcode;
    TextView mTextViewUnlock;
    ImageView mImageView;
    @SuppressLint("MissingInflatedId")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.biometric_login);
        pref = sqlitewraper.getSecureShared("MyPref");
        mTextViewUnlock = findViewById(R.id.tv_unlock);
        mImageView = findViewById(R.id.imageview);
        Colorcode = pref.getString("themecolor","");

        Glide.with(this)
                .load(R.drawable.finger) // Replace with your GIF image resource
                .into(mImageView);

        if(Colorcode.equalsIgnoreCase(""))
        {
            mTextViewUnlock.setTextColor(Color.parseColor("#000000"));
        }
        else {
            mTextViewUnlock.setTextColor(Color.parseColor(Colorcode));
        }
        biometricPrompt = new BiometricPrompt(BiometricLogin.this, ContextCompat.getMainExecutor(BiometricLogin.this), new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                // Biometric authentication successful, proceed with login
                Intent successIntent = new Intent();
                successIntent.putExtra("result", true);
                setResult(RESULT_OK, successIntent);
                finish();
            }

            @SuppressLint("RestrictedApi")
            @Override
            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                super.onAuthenticationError(errorCode, errString);
                if (errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON) {
                     biometricPrompt.cancelAuthentication();
                     finish();
                }
                if(errorCode == BiometricPrompt.ERROR_CANCELED || errorCode == BiometricPrompt.ERROR_USER_CANCELED)
                {
                    biometricPrompt.cancelAuthentication();
                    finish();
                }
            }
            @Override
            public void onAuthenticationFailed() {

            }
        });
        promptInfo = new BiometricPrompt.PromptInfo.Builder()
                .setTitle("Login to " + getString(R.string.app_name))
                .setDescription("Place your finger on the fingerprint sensor to verify your identity")
                .setNegativeButtonText("Cancel")
                .build();

        biometricPrompt.authenticate(promptInfo);

    }
}
