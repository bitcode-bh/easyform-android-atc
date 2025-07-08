package com.sky.atc.easyformse.utils.newView;

import android.view.MotionEvent;
import android.view.View;

import androidx.appcompat.widget.AppCompatButton;

public class OnDragTouchListener implements View.OnTouchListener {

    /**
     * Callback used to indicate when the drag is finished
     */
    public interface OnDragActionListener {
        /**
         * Called when drag event is started
         *
         * @param view The view dragged
         */
        void onDragStart(View view);

        /**
         * Called when drag event is completed
         *
         * @param view The view dragged
         */
        void onDragEnd(View view);
    }

    private View mView;
    private View mParent;
    private boolean isDragging;
    private boolean isInitialized = false;

    private int width;
    private float maxLeft;
    private float maxRight;
    private float dX;

    private int height;
    private float maxTop;
    private float maxBottom;
    private float dY;

    private OnDragActionListener mOnDragActionListener;
    MyBackgroundView myBackgroundView;
    AppCompatButton btnUpSide, btnDownSide, btnStartSide, btnEndSide;

    public void setBtnUpSide(AppCompatButton btnUpSide) {
        this.btnUpSide = btnUpSide;
    }

    public void setBtnDownSide(AppCompatButton btnDownSide) {
        this.btnDownSide = btnDownSide;
    }

    public void setBtnStartSide(AppCompatButton btnStartSide) {
        this.btnStartSide = btnStartSide;
    }

    public void setBtnEndSide(AppCompatButton btnEndSide) {
        this.btnEndSide = btnEndSide;
    }

    public OnDragTouchListener(View view, MyBackgroundView myBackgroundView, OnDragActionListener onDragActionListener) {
        this(view, (View) view.getParent(), onDragActionListener);
        this.myBackgroundView = myBackgroundView;
    }

    public OnDragTouchListener(View view, View parent, OnDragActionListener onDragActionListener) {
        initListener(view, parent);
        setOnDragActionListener(onDragActionListener);
    }

    public void setOnDragActionListener(OnDragActionListener onDragActionListener) {
        mOnDragActionListener = onDragActionListener;
    }

    public void initListener(View view, View parent) {
        mView = view;
        mParent = parent;
        isDragging = false;
        isInitialized = false;
    }

    public void updateBounds() {
        updateViewBounds();
        updateParentBounds();
        isInitialized = true;
    }

    public void updateViewBounds() {
        width = mView.getWidth();
        dX = 0;

        height = mView.getHeight();
        dY = 0;
    }

    public void updateParentBounds() {

        if (btnStartSide != null) {
            maxLeft = (btnStartSide.getMeasuredWidth() / 2F);
        } else {
            maxLeft = 0;
        }
        if (btnEndSide != null) {
            maxRight = mParent.getWidth() - (btnEndSide.getMeasuredHeight() / 2F);
        } else {
            maxRight = mParent.getWidth();
        }

        if (btnUpSide != null) {
            maxTop = (btnUpSide.getMeasuredHeight() / 2F);
        } else {
            maxTop = 20;
        }

        if (btnDownSide != null) {
            maxBottom = mParent.getHeight() - (btnDownSide.getMeasuredHeight() / 2F);
        } else {
            maxBottom = mParent.getHeight();
        }
    }

    @Override
    public boolean onTouch(View v, MotionEvent event) {
        if (isDragging) {
            updateParentBounds();
            float[] bounds = new float[4];
            // LEFT
            bounds[0] = event.getRawX() + dX;
            if (bounds[0] < maxLeft) {
                bounds[0] = maxLeft;
            }
            // RIGHT
            bounds[2] = bounds[0] + width;
            if (bounds[2] > maxRight) {
                bounds[2] = maxRight;
                bounds[0] = bounds[2] - width;
            }
            // TOP
            bounds[1] = event.getRawY() + dY;
            if (bounds[1] < maxTop) {
                bounds[1] = maxTop;
            }
            // BOTTOM
            bounds[3] = bounds[1] + height;
            if (bounds[3] > maxBottom) {
                bounds[3] = maxBottom;
                bounds[1] = bounds[3] - height;
            }

            switch (event.getAction()) {
                case MotionEvent.ACTION_CANCEL:
                case MotionEvent.ACTION_UP:
                    onDragFinish();
                    break;
                case MotionEvent.ACTION_MOVE:
                    mView.animate().x(bounds[0]).y(bounds[1]).setDuration(0).start();
                    myBackgroundView.setRect(mView, false);
                    updateSideView();
                    break;
            }
            return true;
        } else {
            switch (event.getAction()) {
                case MotionEvent.ACTION_DOWN:
                    isDragging = true;
                    /*if (!isInitialized) {*/
                    updateBounds();
                    /*}*/
                    dX = v.getX() - event.getRawX();
                    dY = v.getY() - event.getRawY();
                    if (mOnDragActionListener != null) {
                        mOnDragActionListener.onDragStart(mView);
                    }
                    return true;
            }
        }
        return false;
    }

    private void updateSideView() {
        btnUpSide.animate().x(((mView.getMeasuredWidth() / 2F) + mView.getX()) - (btnUpSide.getMeasuredWidth() / 2F))
                .y((mView.getY() - (btnUpSide.getMeasuredHeight() / 2F))).setDuration(0).start();
        btnDownSide.animate().x(((mView.getMeasuredWidth() / 2F) + mView.getX()) - (btnDownSide.getMeasuredWidth() / 2F)).
                y(mView.getY() + mView.getMeasuredHeight() - (btnDownSide.getMeasuredHeight() / 2F)).setDuration(0).start();

        btnStartSide.animate().x(mView.getX() - (btnStartSide.getMeasuredWidth() / 2F)).y((mView.getMeasuredHeight() / 2F) + mView.getY() - (btnStartSide.getMeasuredHeight() / 2F)).setDuration(0).start();

        btnEndSide.animate().x(mView.getX() + mView.getMeasuredWidth() - (btnEndSide.getMeasuredWidth() / 2F)).y((mView.getMeasuredHeight() / 2F) + mView.getY() - (btnEndSide.getMeasuredHeight() / 2F)).setDuration(0).start();
    }

    private void onDragFinish() {
        myBackgroundView.setRect(mView, true);
        if (mOnDragActionListener != null) {
            mOnDragActionListener.onDragEnd(mView);
        }

        dX = 0;
        dY = 0;
        isDragging = false;
    }
}