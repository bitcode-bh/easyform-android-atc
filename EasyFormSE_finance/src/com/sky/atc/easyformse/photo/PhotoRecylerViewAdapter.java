package com.sky.atc.easyformse.photo;


import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.camera_new;

import java.io.File;
import java.util.List;

import io.michaelrocks.paranoid.Obfuscate;

//photo Recyclerview adpater for photo burst activity
@Obfuscate
public class PhotoRecylerViewAdapter extends RecyclerView.Adapter<PhotoRecylerViewAdapter.ViewHolder> {

    private List<File> mData;
    private LayoutInflater mInflater;
    private ItemClickListener mClickListener;
    private int selectedPosition;

    // data is passed into the constructor
    PhotoRecylerViewAdapter(Context context, List<File> data) {
        this.mInflater = LayoutInflater.from(context);
        this.mData = data;
    }

    // inflates the row layout from xml when needed
    @Override
    public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View view = mInflater.inflate(R.layout.rv_photocard, parent, false);
        return new ViewHolder(view);
    }

    // binds the data to the TextView in each row
    @Override
    public void onBindViewHolder(ViewHolder holder, int position) {
        File pathOfImage = mData.get(position);
        Bitmap myBitmap = BitmapFactory.decodeFile(pathOfImage.getAbsolutePath());

        Matrix matrix = new Matrix();

        if (!camera_new.isCropMode) {
            matrix.postRotate(90);
        }

        Bitmap scaledBitmap;
        if (camera_new.isCropMode) {
            scaledBitmap = Bitmap.createScaledBitmap(myBitmap, myBitmap.getWidth(), myBitmap.getHeight(), true);
        } else {
            scaledBitmap = Bitmap.createScaledBitmap(myBitmap, 720, 1280, true);
        }


        Bitmap rotatedBitmap = Bitmap.createBitmap(scaledBitmap, 0, 0, scaledBitmap.getWidth(), scaledBitmap.getHeight(), matrix, true);


        holder.myimageView.setImageBitmap(rotatedBitmap);
//        holder.myimageView.setImageDrawable(ContextCompat.getDrawable(sqlitewraper.context,R.drawable.atc_logo));


//        if (selectedPosition == position) {
////          holder.myimageView.setBackgroundColor(Color.parseColor("#000000"));
//            holder.selectedImageIcon.setVisibility(View.VISIBLE);
//        } else {
//            holder.selectedImageIcon.setVisibility(View.GONE);
////          holder.myimageView.setBackgroundColor(Color.parseColor("#ffffff"));
//        }
    }

    // total number of rows
    @Override
    public int getItemCount() {
        return mData.size();
    }


    // stores and recycles views as they are scrolled off screen
    public class ViewHolder extends RecyclerView.ViewHolder implements View.OnClickListener {
        ImageView myimageView;
        TextView selectedImageIcon;

        ViewHolder(View itemView) {
            super(itemView);
            myimageView = itemView.findViewById(R.id.imgPhoto);
            if (camera_new.isCropMode) {
                myimageView.setScaleType(ImageView.ScaleType.FIT_CENTER);
            }
            selectedImageIcon = itemView.findViewById(R.id.selectedimageicon);
            itemView.setOnClickListener(this);
        }

        @Override
        public void onClick(View view) {

            File file = mData.get(getAdapterPosition());

            if (mClickListener != null)
                mClickListener.onItemClick(view, getAdapterPosition(), file);

            selectedPosition = getAdapterPosition();
            notifyDataSetChanged();
        }
    }

    // convenience method for getting data at click position
//    String getItem(int id) {
//        return mData.get(id);
//    }

    // allows clicks events to be caught
    void setClickListener(ItemClickListener itemClickListener) {
        this.mClickListener = itemClickListener;
    }

    // parent activity will implement this method to respond to click events
    public interface ItemClickListener {
        void onItemClick(View view, int position, File file);
    }
}