package com.easyform.newjitsi.viewModels;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.easyform.newjitsi.network.Apis;
import com.easyform.newjitsi.network.Models.FirebaseResponse;
import com.easyform.newjitsi.network.Models.JwtTokenResponce;
import com.easyform.newjitsi.network.RetrofitClient;
import com.easyform.newjitsi.network.requests.AuthJson;
import com.easyform.newjitsi.network.requests.LoginData;
import com.easyform.newjitsi.network.requests.RoomNo;
import com.easyform.newjitsi.network.requests.notifcation.NotificationData;
import com.easyform.newjitsi.network.requests.notifcation.FirebaseRequest;
import com.google.gson.Gson;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import timber.log.Timber;

public class ProgressViewModel extends ViewModel {
    private static final String TAG = ProgressViewModel.class.getName();
    ExecutorService executorService = Executors.newFixedThreadPool(4);

    private final MutableLiveData<Boolean> _isNotificationAPIIsFinish = new MutableLiveData<Boolean>(false);
    public LiveData<Boolean> isNotificationAPIIsFinish = _isNotificationAPIIsFinish;

    private final MutableLiveData<List<JwtTokenResponce>> _jwtTokenResponceList = new MutableLiveData<List<JwtTokenResponce>>();
    public LiveData<List<JwtTokenResponce>> jwtTokenResponceList = _jwtTokenResponceList;

    public void sendNotification(List<String> fcmIds, NotificationData notificationData, List<String> fcmIosIds, boolean isIos) {
        executorService.execute(() -> {
            FirebaseRequest firebaseRequest = new FirebaseRequest();
            if (isIos) {
                firebaseRequest.setNotification(notificationData);
                firebaseRequest.setRegistrationIds(fcmIosIds);
            } else {
                firebaseRequest.setData(notificationData);
                firebaseRequest.setRegistrationIds(fcmIds);
            }

            try {
                Response<FirebaseResponse> mFirebaseResponse = RetrofitClient.getApiServices().sendNotification(Apis.FCMURL, "application/json", Apis.authorization, firebaseRequest).execute();
                if (mFirebaseResponse.isSuccessful() && mFirebaseResponse.code() == 200) {
                    if (fcmIosIds.size() > 0 && !isIos) {
                        sendNotification(fcmIds, notificationData, fcmIosIds, true);
                    } else {
                        _isNotificationAPIIsFinish.postValue(true);
                    }
                } else {
                    if (mFirebaseResponse.errorBody() != null) {
                        Timber.tag(TAG).e("notification APi Error :=> %s", mFirebaseResponse.errorBody().string());
                    } else {
                        Timber.tag(TAG).e("notification APi Error :=> errorBody is null ");
                    }
                }

            } catch (IOException e) {
                Timber.tag(TAG).e("notification APi Error :=> %s", e.toString());
            }
        });
    }


    public void getJwtToken(String url, AuthJson authJson, LoginData loginData, String roomNameNoti) {
        executorService.execute(() -> {
            List<RoomNo> roomNos = new ArrayList<>();
            String roomName;
            String Emailsend = "";
            if (roomNameNoti != null && !roomNameNoti.isEmpty()) {
                roomName = roomNameNoti;
            } else {
                roomName = loginData.getUserId() + "" + loginData.getCompanyId();
            }
            roomNos.add(new RoomNo(roomName, Emailsend));
            try {
                Response<List<JwtTokenResponce>> mFirebaseResponse = RetrofitClient.getApiServices().getJwtToken(url, new Gson().toJson(authJson), roomNos).execute();
                if (mFirebaseResponse.isSuccessful() && mFirebaseResponse.code() == 200) {
                    _jwtTokenResponceList.postValue(mFirebaseResponse.body());
                } else {
                    if (mFirebaseResponse.errorBody() != null) {
                        Timber.tag(TAG).e("notification APi Error :=> %s", mFirebaseResponse.errorBody().string());
                    } else {
                        Timber.tag(TAG).e("notification APi Error :=> errorBody is null ");
                    }
                }

            } catch (IOException e) {
                Timber.tag(TAG).e("notification APi Error :=> %s", e.toString());
            }
        });
    }


}
