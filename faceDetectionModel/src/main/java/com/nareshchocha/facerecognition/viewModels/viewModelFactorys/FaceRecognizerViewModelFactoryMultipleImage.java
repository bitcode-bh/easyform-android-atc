package com.nareshchocha.facerecognition.viewModels.viewModelFactorys;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;

import com.nareshchocha.facerecognition.viewModels.GroupFaceRecognizerViewModel;

import java.util.List;

/**
 * Created by NareshChocha on 4/18/2022.
 *
 * @author NareshChocha
 */
public class FaceRecognizerViewModelFactoryMultipleImage implements ViewModelProvider.Factory {
    private final Context context;
    private final List<String> imageFilePaths;

    public FaceRecognizerViewModelFactoryMultipleImage(Context context, List<String> imageFilePaths) {
        this.context = context;
        this.imageFilePaths = imageFilePaths;
    }

    @NonNull
    @Override
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        return (T) new GroupFaceRecognizerViewModel(context, imageFilePaths);
    }
}
