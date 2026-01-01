package com.easyform.newjitsi.activitys.drawing.AR;

import static com.easyform.newjitsi.activitys.drawing.AR.ARDrawActivity.node;
import static org.webrtc.ContextUtils.getApplicationContext;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.graphics.Color;
import android.os.Build;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.core.content.ContextCompat;
import androidx.lifecycle.ViewModel;

import com.bumptech.glide.Glide;
import com.easyform.newjitsi.R;
import com.google.ar.core.Anchor;
import com.google.ar.sceneform.AnchorNode;
import com.google.ar.sceneform.Node;
import com.google.ar.sceneform.rendering.ViewRenderable;

import java.util.ArrayList;
import java.util.HashMap;


/**
 * Created by NareshChocha on 4/12/2023.
 *
 * @author NareshChocha
 */
public class ArDrawViewModel extends ViewModel {

    private final ArrayList<Anchor> anchors = new ArrayList<>();
    private final ArrayList<Node> nodes = new ArrayList<>();
    private ViewRenderable viewRenderable;

    private static final double MIN_OPENGL_VERSION = 3.0;

    private static LinearLayout linearLayout;
    private static String textColor = "#f500d1";


    public HashMap<String, Float> newCoords(float oldX, float oldY, int oldResX, int oldResY) {


        float newX = oldX / oldResX * newResolution().get("getX");
        float newY = oldY / oldResY * newResolution().get("getY");

        HashMap<String, Float> newCordinates = new HashMap<>();
        newCordinates.put("newX", newX);
        newCordinates.put("newY", newY);

        return newCordinates;
    }

    private HashMap<String, Integer> newResolution() {

        DisplayMetrics displayMetrics = new DisplayMetrics();
        WindowManager wm = (WindowManager) getApplicationContext().getSystemService(Context.WINDOW_SERVICE); // the results will be higher than using the activity context object or the getWindowManager() shortcut
        wm.getDefaultDisplay().getMetrics(displayMetrics);

        int screenWidth = displayMetrics.widthPixels;
        int screenHeight = displayMetrics.heightPixels;
//        sharedPreferences = getSharedPreferences("RATIO", Context.MODE_PRIVATE);
//        String dHeight1 =(sharedPreferences.getString("Height","320"));
//        String dWidth1  = (sharedPreferences.getString("Width","240"));
//        int dHeight = Integer.parseInt((sharedPreferences.getString("Height","320")));
//        int dWidth  = Integer.parseInt((sharedPreferences.getString("Width","240")));
        HashMap<String, Integer> newResolution = new HashMap<>();
        newResolution.put("getX", screenWidth);
        newResolution.put("getY", screenHeight);

        return newResolution;
    }


    @RequiresApi(api = Build.VERSION_CODES.N)
    public void addArrow(AnchorNode anchorNode, String arrowType, String arrowColor) {


        Log.d("##ADDARROW", "1");

        int arrowDrawable = selectArrowdrwable(arrowType, arrowColor);

        LinearLayout linearLayout = (LinearLayout) LayoutInflater.from(getApplicationContext()).inflate(R.layout.text_view, null);
        Log.d("##ADDARROW", "2");
        ImageView imgView = new ImageView(getApplicationContext());
        Log.d("##ADDARROW", "3");


        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);

        Log.d("##ADDARROW", "4");

//        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(100, 100);
        imgView.setLayoutParams(lp);
        Glide.with(getApplicationContext())
                .load(arrowDrawable)
                .override(100, 100)
                .into(imgView);

//        imgView.setRotation(90);

        Log.d("##ADDARROW", "5");


        linearLayout.addView(imgView);

        Log.d("##ADDARROW", "6");


        ViewRenderable.builder()
                .setView(getApplicationContext(), linearLayout)
                .build()
                .thenAccept(renderable -> {

                    Log.d("##ADDARROW", "7");

                    viewRenderable = renderable;
                    viewRenderable.setShadowCaster(false);
                    viewRenderable.setShadowReceiver(false);

                    node = new Node();
//                    node.setLocalRotation(Quaternion.axisAngle(new Vector3(1f, 0, 0), 180f));
                    node.setParent(anchorNode);
                    node.setRenderable(viewRenderable);
                    nodes.add(node);

                    Log.d("##ADDARROW", "8");


                })
                .exceptionally(
                        throwable -> {
                            Toast toast =
                                    Toast.makeText(getApplicationContext(), "Unable to load andy renderable", Toast.LENGTH_LONG);
                            toast.setGravity(Gravity.CENTER, 0, 0);
                            toast.show();
                            return null;
                        });

    }

    private int selectArrowdrwable(String arrowType, String arrowColor) {


        //Down with Colors
        if (arrowType.equalsIgnoreCase("down") && arrowColor.equalsIgnoreCase("blue")) {

            return R.drawable.down_blue;
        }
        if (arrowType.equalsIgnoreCase("down") && arrowColor.equalsIgnoreCase("green")) {
            return R.drawable.down_green;
        }
        if (arrowType.equalsIgnoreCase("down") && arrowColor.equalsIgnoreCase("orange")) {

            return R.drawable.down_orange;
        }
        if (arrowType.equalsIgnoreCase("down") && arrowColor.equalsIgnoreCase("yellow")) {

            return R.drawable.down_yellow;
        }

        //Up

        if (arrowType.equalsIgnoreCase("up") && arrowColor.equalsIgnoreCase("blue")) {

            return R.drawable.up_blue;
        }
        if (arrowType.equalsIgnoreCase("up") && arrowColor.equalsIgnoreCase("green")) {

            return R.drawable.up_green;
        }
        if (arrowType.equalsIgnoreCase("up") && arrowColor.equalsIgnoreCase("orange")) {

            return R.drawable.up_orange;
        }
        if (arrowType.equalsIgnoreCase("up") && arrowColor.equalsIgnoreCase("yellow")) {

            return R.drawable.up_yellow;
        }

        //left

        if (arrowType.equalsIgnoreCase("left") && arrowColor.equalsIgnoreCase("blue")) {

            return R.drawable.left_blue;
        }
        if (arrowType.equalsIgnoreCase("left") && arrowColor.equalsIgnoreCase("green")) {

            return R.drawable.left_green;
        }
        if (arrowType.equalsIgnoreCase("left") && arrowColor.equalsIgnoreCase("orange")) {

            return R.drawable.left_orange;
        }
        if (arrowType.equalsIgnoreCase("left") && arrowColor.equalsIgnoreCase("yellow")) {

            return R.drawable.left_yellow;
        }


        //right
        if (arrowType.equalsIgnoreCase("right") && arrowColor.equalsIgnoreCase("blue")) {

            return R.drawable.right_blue;
        }
        if (arrowType.equalsIgnoreCase("right") && arrowColor.equalsIgnoreCase("green")) {

            return R.drawable.right_green;
        }
        if (arrowType.equalsIgnoreCase("right") && arrowColor.equalsIgnoreCase("orange")) {

            return R.drawable.right_orange;
        }
        if (arrowType.equalsIgnoreCase("right") && arrowColor.equalsIgnoreCase("yellow")) {

            return R.drawable.right_yellow;
        }
        return 0;
    }


    @RequiresApi(api = Build.VERSION_CODES.N)
    public void drawText(AnchorNode anchorNode, String drawingText) {

        linearLayout = (LinearLayout) LayoutInflater.from(getApplicationContext()).inflate(R.layout.text_view, null);

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(10, 10);
        params.setMargins(45, 0, 5, 0);

        TextView dynamicTextBackground = new TextView(getApplicationContext());
        dynamicTextBackground.setLayoutParams(params);
        dynamicTextBackground.setBackgroundColor(Color.YELLOW);
        dynamicTextBackground.setText("1");
        dynamicTextBackground.setTextSize(1);

        TextView dynamicTextView = new TextView(getApplicationContext());

        dynamicTextView.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT));
        dynamicTextView.setText(drawingText);
        dynamicTextView.setId(anchors.size());
        dynamicTextView.setBackgroundColor(Color.WHITE);
        dynamicTextView.setTextColor(Color.parseColor(textColor));
        dynamicTextView.setPadding(2, 2, 2, 2);


        dynamicTextBackground.setBackgroundDrawable(ContextCompat.getDrawable(getApplicationContext(), R.drawable.badge_circle));
        linearLayout.addView(dynamicTextBackground);
        linearLayout.addView(dynamicTextView);

        ViewRenderable.builder()
                .setView(getApplicationContext(), linearLayout)
                .build()
                .thenAccept(renderable -> {

                    viewRenderable = renderable;
                    viewRenderable.setShadowCaster(false);
                    viewRenderable.setShadowReceiver(false);

                    node = new Node();
                    node.setParent(anchorNode);
                    node.setRenderable(viewRenderable);
                    nodes.add(node);

                })
                .exceptionally(
                        throwable -> {
                            Toast toast =
                                    Toast.makeText(getApplicationContext(), "Unable to load andy renderable", Toast.LENGTH_LONG);
                            toast.setGravity(Gravity.CENTER, 0, 0);
                            toast.show();
                            return null;
                        });
    }
}
