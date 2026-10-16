/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/
package org.apache.cordova;

import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.Locale;

/**
 * Helper class for WebViews to implement prompt(), alert(), confirm() dialogs.
 * Visual language matches the in-app End Work Trip confirm (centered title/body,
 * shared filled buttons, no divider).
 */
public class CordovaDialogsHelper {
    private static final int COLOR_TITLE = 0xFF1C2333;
    private static final int COLOR_BODY = 0xFF8B93A7;
    private static final int COLOR_BORDER = 0xFFD0D5DD;
    private static final int COLOR_PRIMARY = 0xFF2A3086;
    private static final int COLOR_DANGER = 0xFFE25555;
    private static final int COLOR_SUCCESS = 0xFF4CAF50; // Existing checksheet green.

    private final Context context;
    private Dialog lastHandledDialog;

    public CordovaDialogsHelper(Context context) {
        this.context = context;
    }

    public void showAlert(String message, final Result result) {
        showCard("Alert", message, null, "OK", null, true, result);
    }

    public void showConfirm(String message, final Result result) {
        String text = message == null ? "" : message.toLowerCase(Locale.ROOT);
        boolean yesNo = text.contains("unsaved") || text.contains("changes are not saved")
                || text.contains("exit") || text.contains("logout");
        showCard("Confirm", message, null, yesNo ? "Yes" : "OK", yesNo ? "Stay" : "Cancel", false, result);
    }

    public void showPrompt(String message, String defaultValue, final Result result) {
        showCard("Confirm", message, defaultValue == null ? "" : defaultValue, "OK", "Cancel", false, result);
    }

    public void destroyLastDialog() {
        if (lastHandledDialog != null) {
            lastHandledDialog.cancel();
        }
    }

    public interface Result {
        public void gotResult(boolean success, String value);
    }

    private void showCard(String title, String message, final String promptDefault,
                          String okLabel, String cancelLabel, final boolean backConfirms,
                          final Result result) {
        final boolean[] settled = {false};
        final Dialog dialog = new Dialog(context);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setCancelable(true);

        final EditText input = promptDefault == null ? null : makeInput(promptDefault);

        final Result wrapped = new Result() {
            @Override
            public void gotResult(boolean success, String value) {
                if (settled[0]) {
                    return;
                }
                settled[0] = true;
                result.gotResult(success, value);
            }
        };

        dialog.setContentView(buildCard(title, message, input, okLabel, cancelLabel, new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String value = input != null ? input.getText().toString() : null;
                wrapped.gotResult(true, value);
                dialog.dismiss();
            }
        }, cancelLabel == null ? null : new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                wrapped.gotResult(false, null);
                dialog.dismiss();
            }
        }, isDestructive(message)));

        dialog.setOnCancelListener(new DialogInterface.OnCancelListener() {
            @Override
            public void onCancel(DialogInterface d) {
                wrapped.gotResult(backConfirms, null);
            }
        });
        dialog.setOnKeyListener(new DialogInterface.OnKeyListener() {
            @Override
            public boolean onKey(DialogInterface d, int keyCode, KeyEvent event) {
                if (keyCode == KeyEvent.KEYCODE_BACK && event.getAction() == KeyEvent.ACTION_UP) {
                    wrapped.gotResult(backConfirms, null);
                    dialog.dismiss();
                    return true;
                }
                return false;
            }
        });

        Window window = dialog.getWindow();
        if (window != null) {
            window.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
            WindowManager.LayoutParams lp = window.getAttributes();
            lp.width = dp(300);
            window.setAttributes(lp);
        }

        lastHandledDialog = dialog;
        dialog.show();
    }

    private View buildCard(String title, String message, EditText input,
                           String okLabel, String cancelLabel,
                           View.OnClickListener onOk, View.OnClickListener onCancel,
                           boolean dangerOk) {
        LinearLayout root = new LinearLayout(context);
        root.setOrientation(LinearLayout.VERTICAL);
        GradientDrawable card = new GradientDrawable();
        card.setColor(Color.WHITE);
        card.setCornerRadius(dp(16));
        root.setBackground(card);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            root.setElevation(dp(12));
        }
        root.setPadding(0, 0, 0, 0);

        LinearLayout inner = new LinearLayout(context);
        inner.setOrientation(LinearLayout.VERTICAL);
        inner.setPadding(dp(20), dp(20), dp(20), dp(8));
        inner.setGravity(Gravity.CENTER_HORIZONTAL);

        TextView titleView = new TextView(context);
        titleView.setText(title);
        titleView.setGravity(Gravity.CENTER);
        titleView.setTextColor(COLOR_TITLE);
        titleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 17);
        titleView.setTypeface(Typeface.create("sans-serif-medium", Typeface.BOLD));
        inner.addView(titleView, lp(-1, -2, 0));

        if (!TextUtils.isEmpty(message)) {
            TextView body = new TextView(context);
            body.setText(message);
            body.setGravity(Gravity.CENTER);
            body.setTextColor(COLOR_BODY);
            body.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
            body.setLineSpacing(0, 1.45f);
            LinearLayout.LayoutParams bodyLp = lp(-1, -2, 0);
            bodyLp.topMargin = dp(8);
            inner.addView(body, bodyLp);
        }

        if (input != null) {
            LinearLayout.LayoutParams inLp = lp(-1, -2, 0);
            inLp.topMargin = dp(12);
            inner.addView(input, inLp);
        }

        root.addView(inner, lp(-1, -2, 0));

        LinearLayout buttons = new LinearLayout(context);
        buttons.setOrientation(LinearLayout.HORIZONTAL);
        buttons.setPadding(dp(16), dp(8), dp(16), dp(16));
        buttons.setGravity(Gravity.CENTER_VERTICAL);

        if (onCancel != null) {
            TextView cancel = makeButton(cancelLabel, "Stay".equals(cancelLabel) ? COLOR_SUCCESS : COLOR_DANGER);
            cancel.setOnClickListener(onCancel);
            LinearLayout.LayoutParams cLp = lp(0, dp(40), 1);
            cLp.rightMargin = dp(5);
            buttons.addView(cancel, cLp);
        }

        TextView ok = makeButton(okLabel, dangerOk ? COLOR_DANGER : COLOR_PRIMARY);
        ok.setOnClickListener(onOk);
        LinearLayout.LayoutParams oLp = lp(0, dp(40), 1);
        if (onCancel != null) {
            oLp.leftMargin = dp(5);
        }
        buttons.addView(ok, oLp);

        root.addView(buttons, lp(-1, -2, 0));
        return root;
    }

    private EditText makeInput(String defaultValue) {
        EditText input = new EditText(context);
        input.setText(defaultValue);
        input.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        input.setTextColor(COLOR_TITLE);
        input.setHintTextColor(COLOR_BODY);
        input.setPadding(dp(12), dp(10), dp(12), dp(10));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.WHITE);
        bg.setCornerRadius(dp(8));
        bg.setStroke(dp(1), COLOR_BORDER);
        input.setBackground(bg);
        if (!TextUtils.isEmpty(defaultValue)) {
            input.setSelection(defaultValue.length());
        }
        return input;
    }

    private TextView makeButton(String label, int fill) {
        TextView btn = new TextView(context);
        btn.setText(label);
        btn.setGravity(Gravity.CENTER);
        btn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        btn.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        btn.setClickable(true);
        btn.setFocusable(true);
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(12));
        bg.setColor(fill);
        bg.setStroke(dp(1), fill);
        btn.setTextColor(Color.WHITE);
        btn.setBackground(bg);
        return btn;
    }

    private static boolean isDestructive(String message) {
        if (message == null) {
            return false;
        }
        String m = message.toLowerCase(Locale.ROOT);
        return m.contains("exit") || m.contains("logout") || m.contains("delete")
                || m.contains("remove") || m.contains("discard") || m.contains("unsaved") || m.contains("changes are not saved") || m.contains("stop the trip") || m.contains("stop trip");
    }

    private LinearLayout.LayoutParams lp(int w, int h, float weight) {
        return new LinearLayout.LayoutParams(w, h, weight);
    }

    private int dp(int value) {
        return Math.round(value * context.getResources().getDisplayMetrics().density);
    }
}
