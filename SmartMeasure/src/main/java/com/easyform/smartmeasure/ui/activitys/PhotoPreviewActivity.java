package com.easyform.smartmeasure.ui.activitys;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.exifinterface.media.ExifInterface;

import com.easyform.smartmeasure.R;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;


/**
 * Created by NareshChocha on 9/17/2024.
 *
 * @author NareshChocha
 */
public class PhotoPreviewActivity extends AppCompatActivity {
//    ActivityPh mActivityPhotoPreviewBinding;
    String photo_path;
    String height;
    String type;
    int rot = 0;
    ImageView imageViewphotopreview;
    TextView mTextViewOk;
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.photo_preview);
        getWindow().setStatusBarColor(this.getResources().getColor(R.color.cardview_dark_background));
        Bundle Extras = getIntent().getExtras();
        if(Extras != null)
        {
            height = String.valueOf(Extras.getDouble("height"));
            photo_path =  Extras.getString("photo_path");
            type = Extras.getString("type");
        }
        imageViewphotopreview = (ImageView) findViewById(R.id.imgview);
        mTextViewOk = (TextView) findViewById(R.id.textview_ok);
        if(photo_path != null)
        {
            Bitmap bitmap = BitmapFactory.decodeFile(photo_path);
            bitmap = imageOreintationValidator(bitmap, photo_path);
            imageViewphotopreview.setImageBitmap(bitmap);
        }

        mTextViewOk.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent successIntent = new Intent();
                // successIntent.putExtra("isManuallyEnterKey", isManuallyEnter);
                successIntent.putExtra("distance", getDistanceByType(Double.parseDouble(height)));
                successIntent.putExtra("photo_path",photo_path);
                setResult(RESULT_OK, successIntent);
                finish();
            }
        });
    }

    private float getDistanceByType(double distanceMeters) {

        double distanceCm = ((int) (distanceMeters * 1000)) / 10.0f;
        float floatFeet = (float) ((distanceMeters) * 3.28084);
        double inch = distanceCm * 0.394;

        if (type.equalsIgnoreCase("cm")) {
            return (float) distanceCm;
        } else if (type.equalsIgnoreCase("ft")) {
            return floatFeet;
        } else if (type.equalsIgnoreCase("in")) {
            return (float) inch;
        } else {
            return (float) distanceMeters;
        }
    }

    private Bitmap imageOreintationValidator(Bitmap bitmap, String path) {

        ExifInterface ei;
        try {
            ei = new ExifInterface(path);
            int orientation = ei.getAttributeInt(ExifInterface.TAG_ORIENTATION,
                    ExifInterface.ORIENTATION_NORMAL);
            switch (orientation) {
                case ExifInterface.ORIENTATION_ROTATE_90:
                    bitmap = rotateImage(bitmap, 90);
                    rot++;
                    break;
                case ExifInterface.ORIENTATION_ROTATE_180:
                    bitmap = rotateImage(bitmap, 180);
                    rot++;
                    break;
                case ExifInterface.ORIENTATION_ROTATE_270:
                    bitmap = rotateImage(bitmap, 270);
                    rot++;
                    break;
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        return bitmap;
    }
    public static Bitmap rotateImage(Bitmap source, float angle) {

        Bitmap retVal = source;

        try {
            Matrix matrix = new Matrix();
            matrix.postRotate(angle);
            retVal = Bitmap.createBitmap(source, 0, 0, source.getWidth(),
                    source.getHeight(), matrix, true);
        } catch (Exception e) {


            final Writer result = new StringWriter();
            final PrintWriter printWriter = new PrintWriter(result);
            //////e.printStackTrac//////e.printWriter);
            String stacktrace = result.toString();
            printWriter.close();
            retVal = source;

        }

        return retVal;

    }
}
