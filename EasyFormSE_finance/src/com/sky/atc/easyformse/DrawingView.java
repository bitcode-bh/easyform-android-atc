//http://android.okhelp.cz/color-picker-dialog-android-example/
//http://www.programcreek.com/java-api-examples/index.php?class=android.widget.ImageView&method=setBackgroundDrawable
package com.sky.atc.easyformse;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//View is for drawing on photo
@StringFogIgnore
class DrawingView extends View
{
	Paint mPaint;
	GetColor color2;
	Bitmap mBitmap;
	Canvas mCanvas;
	Path mPath;
	Paint mBitmapPaint;
	float borderx, bordery, xscale1,yscale1, xscale2, yscale2;
	float h_n, w_n;
	float downx = 0;
	float downy = 0;
	float upx = 0;
	float upy = 0;
    B_new bn = new B_new();

    public static Bitmap originalBitmap;

	public DrawingView(Context context, Bitmap b) 
	{
		super(context);
		// TODO Auto-generated constructor stub\

		Log.d("####BITMAP_HEIGHT_B", String.valueOf(b.getWidth()));

		originalBitmap=b;

		bn.setMutableBitmap(b);
		mBitmap = b;
		color2 = new GetColor();
		h_n = mBitmap.getHeight();
		mPaint = new Paint();
		mPaint.setAntiAlias(true);
		mPaint.setDither(true);	
		// mPaint.setColor(0xFFFF0000);
		mPaint.setStyle(Paint.Style.STROKE);
		mPaint.setStrokeJoin(Paint.Join.ROUND);
		mPaint.setStrokeCap(Paint.Cap.ROUND);
		mPaint.setStrokeWidth(20);

		mPath = new Path();
		mBitmapPaint = new Paint();
		mBitmapPaint.setColor(Color.RED);

		Log.d("####BITMAP_HEIGHT_M", String.valueOf(mBitmap.getWidth()));

	}

	@Override
	public void draw(Canvas canvas) 
	{
		// TODO Auto-generated method stub
		super.draw(canvas);
		canvas.drawColor(Color.BLACK);
		h_n = mBitmap.getHeight();
		w_n = mBitmap.getWidth();
		float h = canvas.getHeight();
		float w = canvas.getWidth();

		float xx = 0;
		if (h < w) 
		{
			xx = h;
		} 
		else 
		{
			xx = w;
		}
		xscale1 = (float) w / w_n;
		yscale1 = h / h_n;
		xscale2 = xscale1;
		yscale2 = yscale1;
		// float diff = h1 - h;

		if (xscale1 > yscale1) // make sure both dimensions fit (use the smaller
								// scale)
		{
			xscale1 = yscale1;

		} 
		else 
		{
			yscale1 = xscale1;
		}
		float newx = w_n * xscale1;
		float newy = h_n * yscale1; // use the same
									// scale
									// for both
									// dimensions
		// if you want it centered on the display (black borders)
		borderx = (float) ((w - newx) / 2.0);
		bordery = (float) ((h - newy) / 2.0);
		// your drawing code will now look like this
		if (w_n > h_n)
		{
			mBitmap = Bitmap.createScaledBitmap(mBitmap, (int) (newx),(int) (newy), true);
			canvas.drawBitmap(mBitmap, borderx, bordery, null);
		}
		else
		{
			mBitmap = Bitmap.createScaledBitmap(mBitmap, canvas.getWidth(),canvas.getHeight(), true);
			canvas.drawBitmap(mBitmap, 0, 0, null);

		}

		mCanvas = new Canvas(mBitmap);
	}

	@Override
	public boolean onTouchEvent(MotionEvent event) 
	{

		B_new b = new B_new();

		int action = event.getAction();
		int colval = b.getmCurrentColor();
		String colhex = Integer.toHexString(colval);
		mPaint.setColor(Color.parseColor("#" + colhex));
		mPaint.setStrokeWidth(color2.getStrockWidth());


		float currentX = event.getX();
		float currentY = event.getY();

		if (w_n > h_n)
		{
			currentX = (currentX - borderx) / xscale1;
			currentY = (currentY - bordery) / xscale1;
		}

		switch (action) 
		{
		case MotionEvent.ACTION_DOWN:
			downx = currentX;
			downy = currentY;
			break;
		case MotionEvent.ACTION_MOVE:
			upx = currentX;
			upy = currentY;
			mCanvas.drawLine(downx, downy, upx, upy, mPaint);
			invalidate();
			downx = upx;
			downy = upy;
			break;
		case MotionEvent.ACTION_UP:
			upx = currentX;
			upy = currentY;

			mCanvas.drawLine(downx, downy, upx, upy, mPaint);
			invalidate();
			break;
		case MotionEvent.ACTION_CANCEL:
			break;
		default:
			break;
		}
		//B_new b = new B_new();
		bn.setB(mBitmap);

		return true;
	}
	public void eraseAll() 
	{		
		mPath.reset();
		mBitmapPaint.reset();
		invalidate();
		this.postInvalidate();
		System.out.println("eraseAll() Inside 2");
	}
}