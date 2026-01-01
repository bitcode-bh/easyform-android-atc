package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.util.Calendar;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.BitmapFactory.Options;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.AttributeSet;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.ViewGroup.LayoutParams;
import android.view.Window;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.sky.atc.easyformse.datautils.MySharedPreferences;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//capture the Signature
@StringFogIgnore
public class CaptureSignature extends Activity {

	LinearLayout mContent;
	signature mSignature;
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
	File directory;
	MySharedPreferences pref;
//	Editor editor;
	Uri outputFileUri;
	private static final int PERMISSION_REQUEST_CODE = 201;
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		this.requestWindowFeature(Window.FEATURE_NO_TITLE);
		setContentView(R.layout.sig);
		pref = sqlitewraper.getSecureShared("MyPref");

		if (checkPermission()) {
			//main logic or main code
		} else {
			requestPermission();
		}

		directory = new File(Environment.getExternalStorageDirectory(), "ATC");
		directory.mkdirs();

		uniqueId = "sign" + System.currentTimeMillis();

		current = uniqueId + ".jpg";
		mypath = new File(directory, current);
		
		

		pref.putString("outputuri", mypath.getAbsolutePath()); // Saving
		// string
		pref.commit();
		

		mContent = (LinearLayout) findViewById(R.id.linearLayout);
		mSignature = new signature(this, null);
		mSignature.setBackgroundColor(Color.WHITE);
		mContent.addView(mSignature, LayoutParams.FILL_PARENT,
				LayoutParams.FILL_PARENT);
		mClear = (Button) findViewById(R.id.clear);
		mGetSign = (Button) findViewById(R.id.getsign);
		mGetSign.setEnabled(false);
		mCancel = (Button) findViewById(R.id.cancel);
		mView = mContent;

		mClear.setOnClickListener(new OnClickListener() {
			public void onClick(View v) {
				Log.v("log_tag", "Panel Cleared");
				mSignature.clear();
				mGetSign.setEnabled(false);
			}
		});

		mGetSign.setOnClickListener(new OnClickListener() {
			public void onClick(View v) {
				Log.v("log_tag", "Panel Saved");
				mGetSign.setTextColor(Color.GREEN);
				// boolean error = captureSignature();
				// if (!error) {
				mView.setDrawingCacheEnabled(true);
				mSignature.save(mView);
				Bundle b = new Bundle();

				// --------------read image convert in to
				// base64----------------////
				try {
					BitmapFactory.Options options = new Options();
					options.inInputShareable = true;
					options.inPurgeable = true;
					options.inMutable = true;
					File image_txt = new File(directory, uniqueId + ".txt");
					
					String mCaptured = pref.getString("outputuri", "k2");

					File imageFile = new java.io.File(mCaptured);

					FileInputStream fis_p = new FileInputStream(imageFile);
					Bitmap bitmap_n = BitmapFactory.decodeFileDescriptor(
							fis_p.getFD(), null, options);
					
					bitmap_n = Bitmap.createScaledBitmap(bitmap_n, 400, 400, true);
					
					ByteArrayOutputStream stream = new ByteArrayOutputStream();
					bitmap_n.compress(Bitmap.CompressFormat.JPEG, 90, stream);
					byte[] image = stream.toByteArray();
					String img_str = Base64.encodeBytes(image);

					FileWriter writer = new FileWriter(image_txt);
					writer.append(img_str);
					writer.flush();
					writer.close();

					// -----------delete file from sd card-----------------//

					// File file = new File(mypath.getAbsolutePath());
					// boolean deleted = file.delete();
					b.putString("status", mCaptured);
					Intent intent = new Intent();
					intent.putExtras(b);
					setResult(RESULT_OK, intent);
					
					pref.putString("photo_path", mCaptured); // Saving string
					pref.commit(); // commit changes

					finish();
				} catch (Exception e) {
					//e.printStackTrace(); // TODO: handle exception
				}

				// }
			}
		});

		mCancel.setOnClickListener(new OnClickListener() {
			public void onClick(View v) {
				Log.v("log_tag", "Panel Canceled");
				Bundle b = new Bundle();
				b.putString("status", "cancel");
				Intent intent = new Intent();
				intent.putExtras(b);
				setResult(RESULT_CANCELED, intent);
				finish();
			}
		});

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

	@Override
	protected void onDestroy() {
		Log.w("GetSignature", "onDestory");
		super.onDestroy();
	}

	private boolean captureSignature() {

		boolean error = false;
		String errorMessage = "";

		if (yourName.getText().toString().equalsIgnoreCase("")) {
			errorMessage = errorMessage + "Please enter your Name\n";
			error = true;
		}

		if (error) {
			Toast toast = Toast
					.makeText(this, errorMessage, Toast.LENGTH_SHORT);
			toast.setGravity(Gravity.TOP, 105, 50);
			toast.show();
		}

		return error;
	}

	private String getTodaysDate() {

		final Calendar c = Calendar.getInstance();
		int todaysDate = (c.get(Calendar.YEAR) * 10000)
				+ ((c.get(Calendar.MONTH) + 1) * 100)
				+ (c.get(Calendar.DAY_OF_MONTH));
		Log.w("DATE:", String.valueOf(todaysDate));
		return (String.valueOf(todaysDate));

	}

	private String getCurrentTime() {

		final Calendar c = Calendar.getInstance();
		int currentTime = (c.get(Calendar.HOUR_OF_DAY) * 10000)
				+ (c.get(Calendar.MINUTE) * 100) + (c.get(Calendar.SECOND));
		Log.w("TIME:", String.valueOf(currentTime));
		return (String.valueOf(currentTime));

	}

	private boolean prepareDirectory() {
		try {
			if (makedirs()) {
				return true;
			} else {
				return false;
			}
		} catch (Exception e) {
			//e.printStackTrace();
//			Toast.makeText(
//					this,
//					"Could not initiate File System.. Is Sdcard mounted properly?",
//					1000).show();
			return false;
		}
	}

	private boolean makedirs() {
		File tempdir = new File(tempDir);
		if (!tempdir.exists())
			tempdir.mkdirs();

		if (tempdir.isDirectory()) {
			File[] files = tempdir.listFiles();
			for (File file : files) {
				if (!file.delete()) {
					System.out.println("Failed to delete " + file);
				}
			}
		}
		return (tempdir.isDirectory());
	}

	public class signature extends View {
		private static final float STROKE_WIDTH = 5f;
		private static final float HALF_STROKE_WIDTH = STROKE_WIDTH / 2;
		private Paint paint = new Paint();
		private Path path = new Path();

		private float lastTouchX;
		private float lastTouchY;
		private final RectF dirtyRect = new RectF();

		public signature(Context context, AttributeSet attrs) {
			super(context, attrs);
			paint.setAntiAlias(true);
			paint.setColor(Color.BLACK);
			paint.setStyle(Paint.Style.STROKE);
			paint.setStrokeJoin(Paint.Join.ROUND);
			paint.setStrokeWidth(STROKE_WIDTH);
		}

		@SuppressLint("WrongThread")
		public void save(View v) {
			//
			// progressBar = new ProgressDialog(v.getContext());
			// progressBar.setCancelable(true);
			// progressBar.setMessage("File downloading ...");
			// progressBar.setProgressStyle(ProgressDialog.STYLE_SPINNER);
			//
			// progressBar.show();
			Log.v("log_tag", "Width: " + v.getWidth());
			Log.v("log_tag", "Height: " + v.getHeight());
			if (mBitmap == null) {
				mBitmap = Bitmap.createBitmap(mContent.getWidth(),
						mContent.getHeight(), Bitmap.Config.RGB_565);
				;
			}
			Canvas canvas = new Canvas(mBitmap);
			try {
				FileOutputStream mFileOutStream = new FileOutputStream(mypath);

				v.draw(canvas);

				mBitmap = Bitmap.createScaledBitmap(mBitmap, 400, 400, true);

				mBitmap.compress(Bitmap.CompressFormat.PNG, 70, mFileOutStream);
				mFileOutStream.flush();
				mFileOutStream.close();

				String url = MediaStore.Images.Media.insertImage(
						getContentResolver(), mBitmap, "title", null);
				Uri myUri = Uri.parse(url);

				path1 = convertMediaUriToPath(myUri);

				Log.v("log_tag", "url: " + url);

				if (mBitmap != null && !mBitmap.isRecycled()) {
					mBitmap.recycle();
					mBitmap = null;
				}
				// In case you want to delete the file
				// boolean deleted = mypath.delete();
				// Log.v("log_tag","deleted: " + mypath.toString() + deleted);
				// If you want to convert the image to string use base64
				// converter

			} catch (Exception e) {
				Log.v("log_tag", e.toString());
			}
		}

		public void clear() {
			path.reset();
			invalidate();
		}

		@Override
		protected void onDraw(Canvas canvas) {
			canvas.drawPath(path, paint);
		}

		@Override
		public boolean onTouchEvent(MotionEvent event) {
			float eventX = event.getX();
			float eventY = event.getY();
			mGetSign.setEnabled(true);

			switch (event.getAction()) {
			case MotionEvent.ACTION_DOWN:
				path.moveTo(eventX, eventY);
				lastTouchX = eventX;
				lastTouchY = eventY;
				return true;

			case MotionEvent.ACTION_MOVE:

			case MotionEvent.ACTION_UP:

				resetDirtyRect(eventX, eventY);
				int historySize = event.getHistorySize();
				for (int i = 0; i < historySize; i++) {
					float historicalX = event.getHistoricalX(i);
					float historicalY = event.getHistoricalY(i);
					expandDirtyRect(historicalX, historicalY);
					path.lineTo(historicalX, historicalY);
				}
				path.lineTo(eventX, eventY);
				break;

			default:
				debug("Ignored touch event: " + event.toString());
				return false;
			}

			invalidate((int) (dirtyRect.left - HALF_STROKE_WIDTH),
					(int) (dirtyRect.top - HALF_STROKE_WIDTH),
					(int) (dirtyRect.right + HALF_STROKE_WIDTH),
					(int) (dirtyRect.bottom + HALF_STROKE_WIDTH));

			lastTouchX = eventX;
			lastTouchY = eventY;

			return true;
		}

		private void debug(String string) {
		}

		private void expandDirtyRect(float historicalX, float historicalY) {
			if (historicalX < dirtyRect.left) {
				dirtyRect.left = historicalX;
			} else if (historicalX > dirtyRect.right) {
				dirtyRect.right = historicalX;
			}

			if (historicalY < dirtyRect.top) {
				dirtyRect.top = historicalY;
			} else if (historicalY > dirtyRect.bottom) {
				dirtyRect.bottom = historicalY;
			}
		}

		private void resetDirtyRect(float eventX, float eventY) {
			dirtyRect.left = Math.min(lastTouchX, eventX);
			dirtyRect.right = Math.max(lastTouchX, eventX);
			dirtyRect.top = Math.min(lastTouchY, eventY);
			dirtyRect.bottom = Math.max(lastTouchY, eventY);
		}
	}

	protected String convertMediaUriToPath(Uri uri) {
		String[] proj = { MediaStore.Images.Media.DATA };
		Cursor cursor = getContentResolver().query(uri, proj, null, null, null);
		int column_index = cursor
				.getColumnIndexOrThrow(MediaStore.Images.Media.DATA);
		cursor.moveToFirst();
		String path = cursor.getString(column_index);
		cursor.close();
		return path;
	}


	private boolean checkPermission() {
		if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
				ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
			// Permission is not granted
			return false;
		}
		return true;
	}

	private void requestPermission() {

		ActivityCompat.requestPermissions(CaptureSignature.this,
				new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE,Manifest.permission.READ_EXTERNAL_STORAGE},
				PERMISSION_REQUEST_CODE);
	}

	@Override
	public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
		switch (requestCode) {
			case PERMISSION_REQUEST_CODE:
				if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED
						&& grantResults[1] == PackageManager.PERMISSION_GRANTED) {
					// Toast.makeText(getApplicationContext(), "Permission Granted", Toast.LENGTH_SHORT).show();

					// main logic
				} else {
					// Toast.makeText(getApplicationContext(), "Permission Denied", Toast.LENGTH_SHORT).show();
					if ( ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
							ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED)  {

						showMessageOKCancel("You need to allow access file and media permissions",
								new DialogInterface.OnClickListener() {
									@Override
									public void onClick(DialogInterface dialog, int which) {
										Intent intent = new Intent();
										intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
										intent.setData(Uri.fromParts("package", mainactivity.getPackageName(), null));
										mainactivity.startActivity(intent);
										finish();
									}
								});

					}
				}
				break;
		}
	}

	private void showMessageOKCancel(String message, DialogInterface.OnClickListener okListener) {
		new AlertDialog.Builder(CaptureSignature.this)
				.setMessage(message)
				.setPositiveButton("OK", okListener)
				.setCancelable(false)
				.create()
				.show();
	}
}