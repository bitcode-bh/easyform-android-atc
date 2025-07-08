package com.sky.atc.easyformse.utils.newView;

import android.view.MotionEvent;
import android.view.View;

import androidx.appcompat.widget.AppCompatButton;

import com.sky.atc.easyformse.NewCameraActivity;

public class OnDragStartTouchListener implements View.OnTouchListener {

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
    View viewRectangleMask;
    MyBackgroundView mbView;

    public OnDragStartTouchListener(View view, View viewRectangleMask, MyBackgroundView mbView) {
        this(view, (View) view.getParent(), null, viewRectangleMask);
        this.mbView = mbView;
    }

    public OnDragStartTouchListener(View view, View parent, OnDragActionListener onDragActionListener, View viewRectangleMask) {
        this.viewRectangleMask = viewRectangleMask;
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
        maxWidthView = mParent.getMeasuredWidth() - (int) (mView.getMeasuredWidth() / 2F);
    }

    public void updateViewBounds() {
        width = mView.getWidth();
        dX = 0;

        height = mView.getHeight();
        dY = 0;
    }

    public void updateParentBounds() {
        maxLeft = 0;
        maxRight = maxLeft + mParent.getWidth();

        maxTop = 0;
        maxBottom = maxTop + mParent.getHeight();
    }

    @Override
    public boolean onTouch(View v, MotionEvent event) {
        if (isDragging) {

            setMaxValues();
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
            bounds[1] = (viewRectangleMask.getMeasuredHeight() / 2F) + viewRectangleMask.getY() - (mView.getMeasuredHeight() / 2F);
           /* bounds[1] = event.getRawY() + dY;
            if (bounds[1] < maxTop) {
                bounds[1] = maxTop;
            }*/
            // BOTTOM
            /*bounds[3] = bounds[1] + height;
            if (bounds[3] > maxBottom) {
                bounds[3] = maxBottom;
                bounds[1] = bounds[3] - height;
            }*/

            switch (event.getAction()) {
                case MotionEvent.ACTION_CANCEL:
                case MotionEvent.ACTION_UP:
                    onDragFinish();
                    break;
                case MotionEvent.ACTION_MOVE:

                    updateViewSize(bounds[0], bounds[1]);
                    break;
            }
            return true;
        } else {
            switch (event.getAction()) {
                case MotionEvent.ACTION_DOWN:
                    isDragging = true;
                    if (!isInitialized) {
                        updateBounds();
                    }
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

    private void updateViewSize(float topX, float topY) {
        int addTop = (int) (viewRectangleMask.getX() - (topX + (mView.getMeasuredWidth() / 2F)));
        int mWidth = (int) (viewRectangleMask.getWidth() + addTop);
        if (mWidth <= maxWidthView) {
            viewRectangleMask.setX(viewRectangleMask.getX() - addTop);
            viewRectangleMask.getLayoutParams().width = mWidth;
            viewRectangleMask.requestLayout();
            mView.animate().x(topX).y(topY).setDuration(0).start();
        }
        mbView.setRect(viewRectangleMask, false);
        updateSideView();
    }

    int maxWidthView = 0;

    private void setMaxValues() {
        if (viewRectangleMask.getMeasuredWidth() > NewCameraActivity.minWidthView) {
            maxRight = viewRectangleMask.getX() + (viewRectangleMask.getMeasuredWidth() - NewCameraActivity.minWidthView) + (mView.getMeasuredWidth() / 2F);
        } else {
            maxRight = viewRectangleMask.getX() + (mView.getMeasuredWidth() / 2F);
        }
    }

    AppCompatButton btnDownSide, btnUpSide, btnEndSide;

    public void setBtnDownSide(AppCompatButton btnDownSide) {
        this.btnDownSide = btnDownSide;
    }

    public void setBtnUpSide(AppCompatButton btnUpSide) {
        this.btnUpSide = btnUpSide;
    }

    public void setBtnEndSide(AppCompatButton btnEndSide) {
        this.btnEndSide = btnEndSide;
    }


    private void updateSideView() {
        if (btnUpSide != null)
            btnUpSide.animate().x(((viewRectangleMask.getMeasuredWidth() / 2F) + viewRectangleMask.getX()) - (btnUpSide.getMeasuredWidth() / 2F))
                    .y((viewRectangleMask.getY() - (btnUpSide.getMeasuredHeight() / 2F))).setDuration(0).start();
        if (btnDownSide != null)
            btnDownSide.animate().x(((viewRectangleMask.getMeasuredWidth() / 2F) + viewRectangleMask.getX()) - (btnDownSide.getMeasuredWidth() / 2F)).
                    y(viewRectangleMask.getY() + viewRectangleMask.getMeasuredHeight() - (btnDownSide.getMeasuredHeight() / 2F)).setDuration(0).start();
      /*  if (btnStartSide != null)
            btnStartSide.animate().x(viewRectangleMask.getX() - btnStartSide.getMeasuredWidth()).y((viewRectangleMask.getMeasuredHeight() / 2F) + viewRectangleMask.getY() - (btnStartSide.getMeasuredHeight() / 2F)).setDuration(0).start();*/

        if (btnEndSide != null)
            btnEndSide.animate().x(viewRectangleMask.getX() + viewRectangleMask.getMeasuredWidth() - (btnEndSide.getMeasuredWidth() / 2F)).y((viewRectangleMask.getMeasuredHeight() / 2F) + viewRectangleMask.getY() - (btnEndSide.getMeasuredHeight() / 2F)).setDuration(0).start();
    }

    private void onDragFinish() {
        if (mOnDragActionListener != null) {
            mOnDragActionListener.onDragEnd(mView);
        }
        mbView.setRect(viewRectangleMask, true);
        dX = 0;
        dY = 0;
        isDragging = false;
    }
}