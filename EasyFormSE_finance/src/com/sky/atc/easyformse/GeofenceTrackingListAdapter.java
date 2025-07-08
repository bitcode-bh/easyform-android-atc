package com.sky.atc.easyformse;

import static androidx.core.app.ActivityCompat.recreate;
import static androidx.core.content.ContextCompat.startActivity;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.content.Context;
import android.content.Intent;
import android.graphics.Movie;
import android.graphics.Typeface;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.sky.atc.easyformse.datautils.MySharedPreferences;

import java.util.ArrayList;

import jxl.write.BoldStyle;

/**
 * Created by NareshChocha on 9/5/2023.
 *
 * @author NareshChocha
 */
public class GeofenceTrackingListAdapter extends RecyclerView.Adapter<GeofenceTrackingListAdapter.MyViewHolder> {
    ArrayList<GetGeofenceTrakingDetails> mListAdapters;
    Context mContext;
    static  String IsClick ="false";

    public GeofenceTrackingListAdapter(GeofencTrackingMapActivity geofencTrackingMapActivity, ArrayList<GetGeofenceTrakingDetails> mArrayList) {
        this.mListAdapters = mArrayList;
        this.mContext = geofencTrackingMapActivity;
    }

    @NonNull
    @Override
    public MyViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View itemView = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.add_geofence_title, parent, false);
        return new MyViewHolder(itemView);
    }

    @Override
    public void onBindViewHolder(@NonNull MyViewHolder holder, int position) {
        int  rowPos = holder.getPosition();
        if (rowPos == 0) {
            holder.mTextViewid.setTypeface(null, Typeface.BOLD);
            holder.mTextViewPlaceId.setTypeface(null, Typeface.BOLD);
            holder.mTextViewAddress.setTypeface(null, Typeface.BOLD);
            holder.mTextViewRadius.setTypeface(null, Typeface.BOLD);
            holder.mTextViewid.setText("Id");
            holder.mTextViewPlaceId.setText("Place Id");
            holder.mTextViewRadius.setText("Radius");
            holder.mTextViewAddress.setText("Address");
        }
        else {
            GetGeofenceTrakingDetails trakingDetails = mListAdapters.get(rowPos - 1);

            holder.mTextViewid.setText(trakingDetails.getId());
            holder.mTextViewPlaceId.setText(trakingDetails.getPlaceId());
            holder.mTextViewRadius.setText(trakingDetails.getRadius());
            holder.mTextViewAddress.setText(trakingDetails.getAddress());

            holder.itemView.setOnClickListener(v -> {
                GeofencTrackingMapActivity.mLinearLayoutMap.setVisibility(View.VISIBLE);
                GeofencTrackingMapActivity.mLinearLayoutRecycleview.setVisibility(View.GONE);

                IsClick = "true";
                MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
                pref.putString("latitude", trakingDetails.getLat());
                pref.putString("longitude", trakingDetails.getLng());
                pref.putString("PlaceId", trakingDetails.getPlaceId());
                pref.putString("Radius",trakingDetails.getRadius());
                pref.putString("Address", trakingDetails.getAddress());
                pref.commit();
                GeofencTrackingMapActivity.refreshActivity();
            });
        }

    }

    @Override
    public int getItemCount() {
        return mListAdapters.size() + 1;
    }

    public static class MyViewHolder extends RecyclerView.ViewHolder {

        TextView mTextViewid;
        TextView mTextViewPlaceId;
        TextView mTextViewAddress;
        TextView mTextViewRadius;
        public MyViewHolder(View itemView) {
            super(itemView);

            mTextViewid = itemView.findViewById(R.id.tv_id);
            mTextViewPlaceId = itemView.findViewById(R.id.tv_placeid);
            mTextViewAddress = itemView.findViewById(R.id.tv_address);
            mTextViewRadius = itemView.findViewById(R.id.tv_Radius);

        }
    }
}


