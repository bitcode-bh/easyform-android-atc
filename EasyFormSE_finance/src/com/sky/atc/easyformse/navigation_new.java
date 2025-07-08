package com.sky.atc.easyformse;

import java.io.File;

import android.app.ProgressDialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import androidx.fragment.app.FragmentActivity;
import android.view.View;
import android.view.Window;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;

import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;

import io.michaelrocks.paranoid.Obfuscate;

@Obfuscate
public class navigation_new extends FragmentActivity {

	LinearLayout mContent;

	Button mClear, mGetSign, mCancel;
	public static String tempDir;
	public int count = 1;
	public String current = null;
	private Bitmap mBitmap;
	View mView;
	File mypath, sendpath;
	String path1;
	private String uniqueId;
	private EditText yourName;
	ProgressDialog progressBar;
	private GoogleMap googleMap;
	LatLngBounds.Builder bld = new LatLngBounds.Builder();
	public ProgressDialog progressDialog;
	private static LatLng USer_place;
	private static LatLng Site_place;
	LatLngBounds bounds;
	Button button;

	String user_lat;
	String user_long;
	String site_lat;
	String site_long;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		this.requestWindowFeature(Window.FEATURE_NO_TITLE);
//		setContentView(R.layout.map);
//		SupportMapFragment fm = (SupportMapFragment) getSupportFragmentManager()
//				.findFragmentById(R.id.map);
//		googleMap = fm.getMap();
		Bundle data = this.getIntent().getExtras();
		user_lat = data.getString("user_lat");
		user_long = data.getString("user_long");
		site_lat = data.getString("site_lat");
		site_long = data.getString("site_long");

		double us_lat = Double.parseDouble(user_lat);
		
		if(sqlitewraper.internetflag==1)
		{

		Uri gmmIntentUri = Uri.parse("google.navigation:q=" + site_lat + ","
				+ site_long);
		Intent mapIntent = new Intent(Intent.ACTION_VIEW, gmmIntentUri);
//		mapIntent.setPackage("com.google.android.apps.maps");
		startActivity(mapIntent);
		}
		else{
			Bundle b = new Bundle();
			b.putString("hg", "kkk");
			Intent intent = new Intent();
			intent.putExtras(b);
			setResult(RESULT_CANCELED, intent);
			finish();
			
		}
		// tempDir = Environment.getExternalStorageDirectory() + "/"
		// + getResources().getString(R.string.external_dir) + "/";
		// ContextWrapper cw = new ContextWrapper(getApplicationContext());
		// File directory = cw.getDir(
		// getResources().getString(R.string.external_dir),
		// Context.MODE_PRIVATE);
		//
		// prepareDirectory();

	}
	
	@Override
	public void onBackPressed() {
		Bundle b = new Bundle();
		Intent intent = new Intent();
		intent.putExtras(b);
		setResult(RESULT_CANCELED, intent);
		finish();

		// TODO Auto-generated method stub
		super.onBackPressed();
	}


}
