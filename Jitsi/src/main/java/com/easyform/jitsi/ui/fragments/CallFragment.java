package com.easyform.jitsi.ui.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.fragment.app.DialogFragment;
import androidx.fragment.app.FragmentManager;

import com.easyform.jitsi.databinding.FragmentCallBinding;

public class CallFragment extends DialogFragment {
    FragmentCallBinding fragmentCallBinding;

    public CallFragment() {
        // Required empty public constructor
    }

    public static final String TAG = "example_dialog";

    public static CallFragment display(FragmentManager fragmentManager) {
        CallFragment callFragment = new CallFragment();
        callFragment.show(fragmentManager, TAG);
        return callFragment;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        fragmentCallBinding = FragmentCallBinding.inflate(inflater, container, false);
        return fragmentCallBinding.getRoot();
    }
}