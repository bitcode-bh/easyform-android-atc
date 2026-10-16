package com.sky.atc.easyformse.camera;
import android.app.Activity;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.view.*;
import android.widget.*;
import androidx.constraintlayout.widget.ConstraintLayout;
import com.sky.atc.easyformse.R;
import java.util.function.Consumer;

/** Bare, solid viewfinder control: changing it never rebinds a camera session. */
public final class MirrorControl {
    private final ImageButton button;
    private boolean mirrored = true;
    public MirrorControl(Activity activity, ViewGroup parent, Consumer<Boolean> listener) {
        int size = activity.getResources().getDimensionPixelSize(R.dimen.camera_control_touch);
        button = new ImageButton(activity); button.setImageResource(R.drawable.cam_mirror);
        button.setBackgroundColor(Color.TRANSPARENT); button.setPadding(size/4,size/4,size/4,size/4);
        float density = activity.getResources().getDisplayMetrics().density;
        if (parent instanceof LinearLayout) {
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(0, Math.round(64*density), 1);
            button.setPadding(Math.round(18*density), Math.round(18*density), Math.round(18*density), Math.round(18*density));
            parent.addView(button, 0, params);
        } else if (parent instanceof ConstraintLayout) {
            ConstraintLayout.LayoutParams params = new ConstraintLayout.LayoutParams(size,size);
            params.leftToLeft = 0; params.bottomToBottom = 0;
            params.leftMargin = Math.round(34*density); params.bottomMargin = Math.round(26*density);
            parent.addView(button,params);
        } else {
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(size,size,Gravity.LEFT|Gravity.BOTTOM);
            params.leftMargin = Math.round(34*density); params.bottomMargin = Math.round(26*density);
            parent.addView(button,params);
        }
        button.setOnClickListener(v -> { setMirrored(!mirrored); listener.accept(mirrored); });
        setMirrored(true); button.setVisibility(View.GONE);
    }
    public void show(boolean front) { button.setVisibility(front ? View.VISIBLE : View.GONE); }
    public void setMirrored(boolean value) {
        mirrored=value; button.setSelected(value);
        button.setImageTintList(ColorStateList.valueOf(Color.WHITE));
        button.setContentDescription(value ? "Mirrored preview. Tap to unmirror" : "Unmirrored preview. Tap to mirror");
    }
}
