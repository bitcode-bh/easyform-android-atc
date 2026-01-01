package com.sky.atc.easyformse;

import android.graphics.Color;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Color Utils - Draw
@StringFogIgnore
public class GetColor 
{
	private static int ColorValue;
	
	public static int getDefaultColor() 
	{
		return DefaultColor;
	}

	public static void setDefaultColor(int defaultColor) 
	{
		DefaultColor = defaultColor;
	}

	private static int StrockWidth=5;
	private static int DefaultColor=Color.WHITE;
	private static int DefaultBrushSize;
	private static int mCurrentX=0;
	private static int mCurrentY=0;
	public static int getmCurrentX() {
		return mCurrentX;
	}

	public static void setmCurrentX(int mCurrentX) {
		GetColor.mCurrentX = mCurrentX;
	}

	public static int getmCurrentY() {
		return mCurrentY;
	}

	public static void setmCurrentY(int mCurrentY) {
		GetColor.mCurrentY = mCurrentY;
	}

	public static int getDefaultBrushSize() {
		return DefaultBrushSize;
	}

	public static void setDefaultBrushSize(int defaultBrushSize) {
		DefaultBrushSize = defaultBrushSize;
	}

	public static int getStrockWidth() 
	{
		return StrockWidth;
	}

	public static void setStrockWidth(int strockWidth) {
		StrockWidth = strockWidth;
	}

	public static int getColorValue() {
		return ColorValue;
	}

	public void setColorValue(int colorValue) {
		ColorValue = colorValue;
	}

}
