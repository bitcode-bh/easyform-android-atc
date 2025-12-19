package com.sky.atc.easyformse;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

public class ToastUtil {


    public static void show(Context context, String message) {
        if (context == null) return;

        LayoutInflater inflater = LayoutInflater.from(context);
        View view = inflater.inflate(R.layout.custom_toast_msg, null);

        TextView txt = view.findViewById(R.id.custom_toast_text);
        txt.setText(message);

        Toast toast = new Toast(context.getApplicationContext());
        toast.setView(view);
        toast.setDuration(Toast.LENGTH_LONG);
        toast.show();
    }
}
