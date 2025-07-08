package com.nareshchocha.facerecognition.viewModels.viewModelFactorys;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;
import com.nareshchocha.facerecognition.viewModels.FaceRecognizerViewModel;

/**
 * Created by NareshChocha on 4/18/2022.
 *
 * @author NareshChocha
 */
public class FaceRecognizerViewModelFactory implements ViewModelProvider.Factory {
    Context context;
    String fileOrFolderPath;

    public FaceRecognizerViewModelFactory(Context context,String fileOrFolderPath) {
        this.context = context;
        this.fileOrFolderPath=fileOrFolderPath;
    }

    @NonNull
    @Override
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        return ((T) new FaceRecognizerViewModel(context,fileOrFolderPath));
    }
}
