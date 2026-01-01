package com.sky.atc.easyformse.photo;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.os.Bundle;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.android.material.snackbar.Snackbar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.DefaultItemAnimator;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.LinearLayout;

import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.camera_new;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.easy_draw_new;
import com.sky.atc.easyformse.sqlitewraper;

import java.io.File;
import java.util.List;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Burst mode for more than one photo
@StringFogIgnore
public class BurstPhotoActivity extends AppCompatActivity implements PhotoRecylerViewAdapter.ItemClickListener {

    File selectedFile;
    private MySharedPreferences pref;
    private String b_write;
    private String width;
    private String height;
    private String quality;
    private String picdevicelat;
    private String picdevicelng;
    private String max_width;
    private String max_height;
    private int cameraviewid;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_burst_photo);
//      Toolbar toolbar = findViewById(R.id.toolbar);
//      setSupportActionBar(toolbar);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);


        pref = sqlitewraper.getSecureShared("MyPref");

        List<File> listOfphoto = (List<File>) getIntent().getSerializableExtra("listofphoto");

        setupRecyclerView(listOfphoto);

        Bundle Extras = getIntent().getExtras();

        File f_image = (File) getIntent().getSerializableExtra("File");
        b_write = Extras.getString("b_write", "k2");
        width = Extras.getString("width");
        height = Extras.getString("height");
        quality = Extras.getString("quality");
        String flagdraw = Extras.getString("flagdraw");
        String drawflag = Extras.getString("drawflag");
        picdevicelat = Extras.getString("picclicklat");
        picdevicelng = Extras.getString("picclicklng");
        max_width = Extras.getString("max_width");
        max_height = Extras.getString("max_height");
        cameraviewid = Extras.getInt("cameraview");
        int serverWidth = Integer.parseInt(Extras.getString("serverwidth"));
        int serverHeight = Integer.parseInt(Extras.getString("serverheight"));


        FloatingActionButton fab = findViewById(R.id.fab);
        fab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

//                Snackbar.make(view, "Replace with your own action", Snackbar.LENGTH_LONG)
//                        .setAction("Action", null).show();


                if (selectedFile != null) {

                    Intent i = new Intent(sqlitewraper.context, easy_draw_new.class);
                    i.putExtra("File", selectedFile);
                    i.putExtra("b_write", b_write);
                    i.putExtra("width", max_width);
                    i.putExtra("quality", quality);
                    i.putExtra("height", max_height);
                    i.putExtra("picclicklat", String.valueOf(picdevicelat));
                    i.putExtra("picclicklng", String.valueOf(picdevicelng));
                    i.putExtra("flagdraw", "0");
                    i.putExtra("drawflag", "0");
                    i.putExtra("cameraview", cameraviewid);
                    i.putExtra("serverwidth", width);
                    i.putExtra("serverheight", height);

                    startActivityForResult(i, 101);

                } else {
                    Snackbar.make(view, "Please select atleast one photo", Snackbar.LENGTH_LONG)
                            .setAction("Action", null).show();
                }

            }
        });
    }

    private void setupRecyclerView(List<File> photoNames) {

        RecyclerView recyclerView = findViewById(R.id.rvphoto);
//        recyclerView.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, true));
        recyclerView.setItemAnimator(new DefaultItemAnimator());
        recyclerView.setLayoutManager(new GridLayoutManager(this, 2));
        PhotoRecylerViewAdapter adapter = new PhotoRecylerViewAdapter(this, photoNames);
        adapter.setClickListener(this);
        recyclerView.setAdapter(adapter);
    }

    @Override
    public void onItemClick(View view, int position, File file) {
        selectedFile = file;
        Log.d("##BURST_PHOTO", String.valueOf(position));

        PhotoConstants.originalPhoto= PhotoConstants.originalPhotoList.get(position);

        showSelectedImage(selectedFile);
    }


    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (resultCode == Activity.RESULT_OK) {

            String status = pref.getString("photo_path", "");
            Bundle b = new Bundle();
            b.putString("status", status);
            Intent intent1 = new Intent();
            intent1.putExtras(b);
            setResult(RESULT_OK, intent1);
            finish();
        } else {
            Bundle b = new Bundle();
            Intent intent1 = new Intent();
            intent1.putExtras(b);
            setResult(RESULT_CANCELED, intent1);
            finish();

//            String status = pref.getString("photo_path", "");
//            Bundle b = new Bundle();
//            b.putString("status", status);
//            Intent intent1 = new Intent();
//            intent1.putExtras(b);
//            setResult(RESULT_OK, intent1);
//            finish();
        }
    }

    private void showSelectedImage(File file) {

        AlertDialog.Builder builder = new AlertDialog.Builder(BurstPhotoActivity.this);
        // Get the layout inflater
        LinearLayout linearLayout = new LinearLayout(this);
        linearLayout.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        ImageView imageView = new ImageView(this);

        imageView.setScaleType(ImageView.ScaleType.CENTER_CROP);

        Bitmap myBitmap = BitmapFactory.decodeFile(file.getAbsolutePath());

        Matrix matrix = new Matrix();

        if (!camera_new.isCropMode) {
            matrix.postRotate(90);
        }

        Bitmap scaledBitmap = Bitmap.createScaledBitmap(myBitmap, myBitmap.getWidth(), myBitmap.getHeight(), true);

        Bitmap rotatedBitmap = Bitmap.createBitmap(scaledBitmap, 0, 0, scaledBitmap.getWidth(), scaledBitmap.getHeight(), matrix, true);

        imageView.setImageBitmap(rotatedBitmap);

        linearLayout.addView(imageView);
        builder.setCancelable(true);
        builder.setView(linearLayout);
        builder.create();
        builder.setPositiveButton("SELECT", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.dismiss();


                if (selectedFile != null) {

                    Intent i = new Intent(sqlitewraper.context, easy_draw_new.class);
                    i.putExtra("File", selectedFile);
                    i.putExtra("b_write", b_write);
                    i.putExtra("width", max_width);
                    i.putExtra("quality", quality);
                    i.putExtra("height", max_height);
                    i.putExtra("picclicklat", String.valueOf(picdevicelat));
                    i.putExtra("picclicklng", String.valueOf(picdevicelng));
                    i.putExtra("flagdraw", "0");
                    i.putExtra("drawflag", "0");
                    i.putExtra("cameraview", cameraviewid);
                    i.putExtra("serverwidth", width);
                    i.putExtra("serverheight", height);

                    startActivityForResult(i, 101);

                } else {
//                    Snackbar.make, "Please select atleast one photo", Snackbar.LENGTH_LONG)
//                            .setAction("Action", null).show();
                }

            }
        });

        builder.setNegativeButton("BACK", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.dismiss();
            }
        });

        builder.show();
    }
}
