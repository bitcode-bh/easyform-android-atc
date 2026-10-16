package com.sky.atc.easyformse.camera;
import android.app.*;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.*;
import android.widget.*;

/** Native counterpart of the application's centered F7 confirm/alert tokens. */
public final class AppCameraDialog {
    private AppCameraDialog() {}
    public static void show(Activity activity,String title,String message,String positive,boolean cancel,Runnable action) {
        if(activity.isFinishing() || activity.isDestroyed()) return;
        Dialog dialog=new Dialog(activity); dialog.requestWindowFeature(Window.FEATURE_NO_TITLE); dialog.setCancelable(cancel);
        float density=activity.getResources().getDisplayMetrics().density;
        int padding=Math.round(20*density);
        LinearLayout body=new LinearLayout(activity); body.setOrientation(LinearLayout.VERTICAL); body.setPadding(padding,padding,padding,padding);
        GradientDrawable background=new GradientDrawable(); background.setColor(Color.WHITE); background.setCornerRadius(16*density); body.setBackground(background);
        TextView heading=new TextView(activity); heading.setText(title); heading.setTextSize(17); heading.setTypeface(null,Typeface.BOLD); heading.setTextColor(0xff1c2333); heading.setGravity(Gravity.CENTER); body.addView(heading);
        TextView description=new TextView(activity); description.setText(message); description.setTextColor(0xff8b93a7); description.setTextSize(13); description.setGravity(Gravity.CENTER); description.setPadding(0,Math.round(8*density),0,Math.round(16*density)); body.addView(description);
        LinearLayout row=new LinearLayout(activity); body.addView(row);
        if(cancel) add(activity,row,"Cancel",false,density,()->dialog.dismiss());
        add(activity,row,positive,true,density,()->{dialog.dismiss();action.run();});
        dialog.setContentView(body); dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent); dialog.show();
        dialog.getWindow().setLayout(Math.min(activity.getResources().getDisplayMetrics().widthPixels-Math.round(32*density),Math.round(300*density)),-2);
    }
    private static void add(Activity activity,LinearLayout row,String title,boolean primary,float density,Runnable action) {
        Button button=new Button(activity); button.setText(title); button.setAllCaps(false); button.setTextSize(14); button.setTextColor(Color.WHITE); button.setPadding(0,0,0,0); button.setMinWidth(0); button.setMinHeight(0);
        GradientDrawable shape=new GradientDrawable(); shape.setCornerRadius(12*density); int fill = !primary || title.matches("(?i)^(delete|remove|reject|discard|clear)\\b.*") ? activity.getResources().getColor(com.sky.atc.easyformse.R.color.action_negative_red) : 0xff2a3086; shape.setColor(fill); shape.setStroke(Math.max(1,Math.round(density)),fill); button.setBackground(shape);
        LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(0,Math.round(48*density),1); if(row.getChildCount()>0) params.leftMargin=Math.round(10*density); row.addView(button,params); button.setOnClickListener(v->action.run());
    }
}
