package com.sky.atc.easyformse.billscanner.java;

import android.util.Range;

public interface OnTextClickListener {
    void onClicked(CharSequence text, Range range, Object tag);
}
