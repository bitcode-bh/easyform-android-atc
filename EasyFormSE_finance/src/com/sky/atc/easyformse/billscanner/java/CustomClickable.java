package com.sky.atc.easyformse.billscanner.java;

import android.text.style.ClickableSpan;
import android.util.Range;
import android.view.View;

import androidx.annotation.NonNull;

import com.sky.atc.easyformse.billscanner.java.OnTextClickListener;

public class CustomClickable  extends ClickableSpan {
    private CharSequence text;
    private Object tag;
    private Range range;
    private OnTextClickListener onTextClickListener;
//    private OnTextLongClickListener onTextLongClickListener;


//    public CustomClickable(CharSequence text, Object tag, Range range, OnTextClickListener onTextClickListener) {
//        this.text = text;
//        this.tag = tag;
//        this.range = range;
//        this.onTextClickListener = onTextClickListener;
//    }
//
//    public CustomClickable(String annotatedText, int tag, int length, int flag) {
//       this.text= annotatedText;
//       this.tag=tag;
//       this.range= length
//    }

    OnTextClickListener getOnTextClickListener(){
        return  onTextClickListener;

}
void setOnTextClickListener(OnTextClickListener onTextClickListener){
        this.onTextClickListener = onTextClickListener;
}
    @Override
    public void onClick(@NonNull View widget) {
        if (onTextClickListener!=null){
            handleClickEvent(widget, new Runnable() {
                @Override
                public void run() {
                    onTextClickListener.onClicked(text, range, tag);
                }
            });
        }
    }

    private void handleClickEvent(View widget, Runnable runnable) {
        widget.setEnabled(false);
        runnable.run();
        widget.setEnabled(true);

    }
}
