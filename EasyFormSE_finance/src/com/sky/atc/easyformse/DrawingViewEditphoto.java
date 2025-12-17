//http://android.okhelp.cz/color-picker-dialog-android-example/
//http://www.programcreek.com/java-api-examples/index.php?class=android.widget.ImageView&method=setBackgroundDrawable
package com.sky.atc.easyformse;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PorterDuff;
import android.util.Log;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;

import io.michaelrocks.paranoid.Obfuscate;

//View is for drawing on photo
@Obfuscate
class DrawingViewEditphoto extends View
{
	Paint mPaint;
	GetColor color2;

	float downx = 0;
	float downy = 0;


	public static Bitmap originalBitmap;
	private ScaleGestureDetector scaleDetector;
	private Matrix matrix = new Matrix();
	private float scaleFactor = 1f;
	private float minScale = 0.8f;
	private float maxScale = 5f;

	private static final int INVALID_POINTER_ID = -1;
	private int activePointerId = INVALID_POINTER_ID;

	private float lastPanX, lastPanY;
	private boolean isPanning = false;
	private boolean blockDrawing = false;

	private Bitmap baseBitmap;
	private Bitmap drawBitmap;
	private Canvas drawCanvas;


	public DrawingViewEditphoto(Context context, Bitmap b) {
		super(context);

		scaleDetector = new ScaleGestureDetector(context, new ScaleListener());

		baseBitmap = b;

		drawBitmap = Bitmap.createBitmap(
				b.getWidth(),
				b.getHeight(),
				Bitmap.Config.ARGB_8888
		);

		drawCanvas = new Canvas(drawBitmap);

		mPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
		mPaint.setStyle(Paint.Style.STROKE);
		mPaint.setStrokeJoin(Paint.Join.ROUND);
		mPaint.setStrokeCap(Paint.Cap.ROUND);
		mPaint.setStrokeWidth(20);
	}


	@Override
	protected void onDraw(Canvas canvas) {
		super.onDraw(canvas);

		canvas.save();
		canvas.concat(matrix);

		canvas.drawBitmap(baseBitmap, 0, 0, null);
		canvas.drawBitmap(drawBitmap, 0, 0, null);

		canvas.restore();
	}



	public void resetZoom() {
		matrix.reset();
		scaleFactor = 1f;
		invalidate();
	}



//	@Override
//	public boolean onTouchEvent(MotionEvent event) {
//
//		// Always let ScaleGestureDetector inspect first
//		scaleDetector.onTouchEvent(event);
//
//		int action = event.getActionMasked();
//
//
//		if (event.getPointerCount() > 1 || scaleDetector.isInProgress()) {
//			activePointerId = INVALID_POINTER_ID;
//			isDrawingEnabled = false;
//			return true;
//		}
//
//
//		if (action == MotionEvent.ACTION_DOWN) {
//			isDrawingEnabled = true;
//		}
//
//		if (!isDrawingEnabled) return true;
//
//
//
//		B_new b = new B_new();
//		int colval = b.getmCurrentColor();
//		String colhex = Integer.toHexString(colval);
//		mPaint.setColor(Color.parseColor("#" + colhex));
//		mPaint.setStrokeWidth(color2.getStrockWidth());
//
//		switch (action) {
//
//			case MotionEvent.ACTION_DOWN: {
//				activePointerId = event.getPointerId(0);
//				float[] mapped = mapTouch(event);
//				downx = mapped[0];
//				downy = mapped[1];
//
//				break;
//			}
//
//			case MotionEvent.ACTION_MOVE: {
//
//				if (activePointerId == INVALID_POINTER_ID) return true;
//
//				int index = event.findPointerIndex(activePointerId);
//				if (index < 0) return true;
//
//				float[] mapped = mapTouch(event);
//				float x = mapped[0];
//				float y = mapped[1];
//
////				if (drawCanvas == null) {
////					drawCanvas = new Canvas(mBitmap);
////				}
//
//				drawCanvas.drawLine(downx, downy, x, y, mPaint);
//				invalidate();
//
//				downx = x;
//				downy = y;
//				break;
//			}
//
//			case MotionEvent.ACTION_UP:
//			case MotionEvent.ACTION_CANCEL: {
//				activePointerId = INVALID_POINTER_ID;
//				break;
//			}
//		}
//
//		//bn.setB(mBitmap);
//		return true;
//	}


	@Override
	public boolean onTouchEvent(MotionEvent event) {

		scaleDetector.onTouchEvent(event);

		int action = event.getActionMasked();


		B_new b = new B_new();
		int colval = b.getmCurrentColor();
		String colhex = Integer.toHexString(colval);
		mPaint.setColor(Color.parseColor("#" + colhex));
		mPaint.setStrokeWidth(color2.getStrockWidth());

		switch (action) {


			case MotionEvent.ACTION_DOWN: {
				blockDrawing = false;
				isPanning = false;

				activePointerId = event.getPointerId(0);

				float[] mapped = mapTouch(event);
				downx = mapped[0];
				downy = mapped[1];
				return true;
			}


			case MotionEvent.ACTION_POINTER_DOWN: {
				blockDrawing = true;
				isPanning = true;
				activePointerId = INVALID_POINTER_ID;

				lastPanX = event.getX();
				lastPanY = event.getY();
				return true;
			}


			case MotionEvent.ACTION_MOVE: {

				if (event.getPointerCount() > 1
						|| scaleDetector.isInProgress()
						|| blockDrawing) {

					float dx = event.getX() - lastPanX;
					float dy = event.getY() - lastPanY;

					matrix.postTranslate(dx, dy);
					invalidate();

					lastPanX = event.getX();
					lastPanY = event.getY();
					return true;
				}

				if (activePointerId == INVALID_POINTER_ID) return true;

				int index = event.findPointerIndex(activePointerId);
				if (index < 0) return true;

				float[] mapped = mapTouch(event);
				float x = mapped[0];
				float y = mapped[1];


				drawCanvas.drawLine(downx, downy, x, y, mPaint);
				invalidate();

				downx = x;
				downy = y;
				return true;
			}


			case MotionEvent.ACTION_UP:
			case MotionEvent.ACTION_POINTER_UP:
			case MotionEvent.ACTION_CANCEL: {
				blockDrawing = false;
				isPanning = false;
				activePointerId = INVALID_POINTER_ID;
				return true;
			}
		}

		//bn.setB(mBitmap);
		return true;
	}



	private float[] mapTouch(MotionEvent event) {
		Matrix inverse = new Matrix();
		matrix.invert(inverse);

		float[] pts = { event.getX(), event.getY() };
		inverse.mapPoints(pts);
		return pts;
	}


	private class ScaleListener extends ScaleGestureDetector.SimpleOnScaleGestureListener {

		@Override
		public boolean onScale(ScaleGestureDetector detector) {

			float scale = detector.getScaleFactor();
			float newScale = scaleFactor * scale;

			if (newScale < minScale) scale = minScale / scaleFactor;
			if (newScale > maxScale) scale = maxScale / scaleFactor;

			scaleFactor *= scale;
			matrix.postScale(scale, scale,
					detector.getFocusX(),
					detector.getFocusY());

			invalidate();
			return true;
		}
	}



	public void eraseAll() {
		drawCanvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
		invalidate();
	}

	public Bitmap getFinalBitmap() {

		Bitmap result = Bitmap.createBitmap(
				baseBitmap.getWidth(),
				baseBitmap.getHeight(),
				Bitmap.Config.ARGB_8888
		);

		Canvas canvas = new Canvas(result);
		canvas.drawBitmap(baseBitmap, 0, 0, null);
		canvas.drawBitmap(drawBitmap, 0, 0, null);

		return result;
	}

}