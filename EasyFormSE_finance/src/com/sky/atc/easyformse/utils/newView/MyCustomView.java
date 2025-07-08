package com.sky.atc.easyformse.utils.newView;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.util.AttributeSet;
import android.util.DisplayMetrics;
import android.view.View;

import androidx.annotation.Nullable;
import androidx.constraintlayout.widget.ConstraintLayout;

import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

import io.michaelrocks.paranoid.Obfuscate;

/**
 * Created by NareshChocha on 12/8/2021.
 *
 * @author NareshChocha
 */
@Obfuscate
public class MyCustomView extends View {
    SQLiteDatabase database;
    String username = "";
    String lat_str = "";
    String lon_str = "";
    String dateTime = "";
    ConstraintLayout.LayoutParams mlayoutParams;


    public MyCustomView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
        dateTime = sdf.format(Calendar.getInstance().getTime());
        database = sqlitewraper.getDatabase();
        Cursor c3 = database.rawQuery(
                "SELECT username,u_c,appid FROM Login_Master", null);
        c3.moveToLast();
        username = c3.getString(0);
        c3.close();
        mlayoutParams = (ConstraintLayout.LayoutParams) getLayoutParams();

    }

    public MyCustomView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    public void setLat(double lat_n) {
        this.lat_str = "Lat: " + lat_n;
    }

    public void setLon(double lon_n) {
        this.lon_str = "Long: " + lon_n;
    }

    public MyCustomView(Context context) {
        super(context);

    }

    Paint backGroundPaint = new Paint();
    Paint textPaint = new Paint();

    public static int convertDpToPixel(int dp, Context context) {
        //return dp * (context.getResources().getDisplayMetrics().densityDpi / DisplayMetrics.DENSITY_DEFAULT);
        return (dp * context.getResources().getDisplayMetrics().densityDpi) / DisplayMetrics.DENSITY_DEFAULT;
    }

    @Override
    protected void onDraw(Canvas canvas) {
        Rect bounds = new Rect();
        int heightDraw = convertDpToPixel(22, getContext());
        int addHeight=18;
        int addX=5;

        if (mlayoutParams == null) {
            mlayoutParams = (ConstraintLayout.LayoutParams) getLayoutParams();
        }
        backGroundPaint.setColor(Color.parseColor("#EBC6C6C6"));
        canvas.drawRect(0, 0, getWidth(), getHeight(), backGroundPaint);

        textPaint.setColor(Color.BLACK);
        textPaint.setTypeface(Typeface.DEFAULT_BOLD);
        textPaint.setTextSize(convertDpToPixel(addHeight, getContext()));
        textPaint.getTextBounds(dateTime, 0, dateTime.length(), bounds);

        canvas.drawText(dateTime, convertDpToPixel(addX, getContext()), heightDraw, textPaint);
        heightDraw += convertDpToPixel(addHeight, getContext());
        if (!lat_str.equals("")) {
            canvas.drawText(lat_str, convertDpToPixel(addX, getContext()), heightDraw, textPaint);
            heightDraw += convertDpToPixel(addHeight, getContext());
        }
        if (!lon_str.equals("")) {
            canvas.drawText(lon_str, convertDpToPixel(addX, getContext()), heightDraw, textPaint);
            heightDraw += convertDpToPixel(addHeight, getContext());
        }

        canvas.drawText("username: " + username, convertDpToPixel(addX, getContext()), heightDraw, textPaint);
        heightDraw += convertDpToPixel(15, getContext());
        if (getWidth() < (bounds.width() + convertDpToPixel(20, getContext())) ||
                getWidth() > (bounds.width() + convertDpToPixel(20, getContext()))) {
            mlayoutParams.width = bounds.width() + convertDpToPixel(20,getContext());
            setLayoutParams(mlayoutParams);
        }
        if (getHeight() > heightDraw || getHeight() < heightDraw) {
            mlayoutParams.height = heightDraw;
            setLayoutParams(mlayoutParams);
        }

        super.onDraw(canvas);
    }
}
