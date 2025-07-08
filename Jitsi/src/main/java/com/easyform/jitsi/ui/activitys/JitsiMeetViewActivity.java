package com.easyform.jitsi.ui.activitys;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.graphics.Point;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.util.Log;
import android.util.Size;
import android.view.Display;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.PopupMenu;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.FragmentActivity;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModelProvider;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.abdeveloper.library.MultiSelectDialog;
import com.abdeveloper.library.MultiSelectModel;
import com.easyform.jitsi.R;
import com.easyform.jitsi.broadcasts.JitsiPluginBroadcast;
import com.easyform.jitsi.databinding.ActivityJitsimeetviewBinding;
import com.easyform.jitsi.network.Apis;
import com.easyform.jitsi.network.Models.Auth1;
import com.easyform.jitsi.network.Models.FcmRequest;
import com.easyform.jitsi.network.Models.Participate;
import com.easyform.jitsi.network.Models.UserGetResponse;
import com.easyform.jitsi.network.RetrofitClient;
import com.easyform.jitsi.network.requests.Args;
import com.easyform.jitsi.network.requests.AuthJson;
import com.easyform.jitsi.network.requests.LoginData;
import com.easyform.jitsi.network.requests.ParticipateId;
import com.easyform.jitsi.network.requests.ZoomMeetingItem;
import com.easyform.jitsi.network.requests.notifcation.Data;
import com.easyform.jitsi.network.requests.usershow.AuthData;
import com.easyform.jitsi.network.requests.usershow.Datas;
import com.easyform.jitsi.utils.drawing.App;
import com.easyform.jitsi.utils.drawing.ArDrawingUtils;
import com.easyform.jitsi.utils.drawing.CustomNormalDrawing;
import com.easyform.jitsi.utils.drawing.DrawingEventListners;
import com.easyform.jitsi.utils.drawing.EventUtils;
import com.easyform.jitsi.utils.drawing.ImageArrowUtils;
import com.easyform.jitsi.utils.drawing.PaintView;
import com.easyform.jitsi.utils.drawing.PaintViewNormal;
import com.easyform.jitsi.utils.drawing.RemoteUtils;
import com.easyform.jitsi.viewModels.MainViewModel;
import com.facebook.react.modules.core.PermissionListener;
import com.github.ybq.android.spinkit.sprite.Sprite;
import com.github.ybq.android.spinkit.style.MultiplePulseRing;
import com.google.android.gms.common.api.Api;
import com.google.ar.sceneform.samples.hellosceneform.HelloSceneformActivity;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import org.jitsi.meet.sdk.BroadcastEvent;
import org.jitsi.meet.sdk.BroadcastIntentHelper;
import org.jitsi.meet.sdk.JitsiMeetActivity;
import org.jitsi.meet.sdk.JitsiMeetActivityDelegate;
import org.jitsi.meet.sdk.JitsiMeetActivityInterface;
import org.jitsi.meet.sdk.JitsiMeetConferenceOptions;
import org.jitsi.meet.sdk.JitsiMeetOngoingConferenceService;
import org.jitsi.meet.sdk.JitsiMeetView;
import org.jitsi.meet.sdk.log.JitsiMeetLogger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.michaelbel.bottomsheet.BottomSheet;
import org.michaelbel.bottomsheet.BottomSheetCallback;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import petrov.kristiyan.colorpicker.ColorPicker;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import timber.log.Timber;


/**
 * Created by  SAVAN SOLANKI on 10/06/2022.
 *
 * @author Savan Solanki
 */

public class JitsiMeetViewActivity extends FragmentActivity implements JitsiMeetActivityInterface, MenuItem.OnMenuItemClickListener, DrawingEventListners {
    private static final String TAGDATA = "JitsiMainactivity";
    private static final String WCFURL = "https://development.easyform.in/coreapi/api/JwtToken/JwtToken_String";
    private JitsiMeetView view;
    private MainViewModel mainViewModel;
    boolean[] selectedUser;
    boolean[] selectedParticipateUser;
    String token = null;
    int width = 0;
    int height = 0;
    String argument, roomName, UserDataURL, body, auth1, Rold_id, companyFeatureid, authJson, senderfcmid, remoteMessageData, getUserData;
    AuthJson Authjson;
    LoginData Logindata;
    Boolean accept = false;
    ActivityJitsimeetviewBinding jitsimeetviewBinding = null;
    boolean isArSupportedDevice = true;
    ArrayList<Participate> participatedata = new ArrayList<>();
    ArrayList<String> participate = new ArrayList<>();
    ArrayList<String> participates = new ArrayList<>();
    ArrayList<String> newparticipates = new ArrayList<>();
    ArrayList<ParticipateId> UserpartcipateID = new ArrayList<>();
    ArrayList<String> participateFcmId = new ArrayList<>();
    ArrayList<ParticipateId> participatId = new ArrayList<>();
    ArrayList<String> FcmData = new ArrayList<>();
    ArrayList<String> FcmId;
    PaintViewNormal paintViewNormal;
    PaintView paintView;
    CustomNormalDrawing customNormalDrawing;
    ArrayList<String> UserName;
    AuthData authData;
    private JSONArray jsonArrayEvent = new JSONArray();


    Boolean screemshare = false;

    MultiSelectDialog multiSelectDialog;
    BroadcastReceiver receiver;

    @SuppressLint("LogNotTimber")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        jitsimeetviewBinding = ActivityJitsimeetviewBinding.inflate(getLayoutInflater());
        setContentView(jitsimeetviewBinding.getRoot());
        isArSupportedDevice = false;
        HelloSceneformActivity.isArSupportedDevice = false;
        ArDrawingUtils.isDrawingEnable = true;
        Intent intent = getIntent();
        getIntentData(intent);
        App.setContext(this);

        ProgressBar progressBar = findViewById(R.id.spin_kit);
        Sprite doubleBounce = new MultiplePulseRing();
        progressBar.setIndeterminateDrawable(doubleBounce);


        view = new JitsiMeetView(this);
        URL serverURL;
        try {
//            serverURL = new URL("https://video.easyform.in");
            serverURL = new URL("https://meet.jit.si");
        } catch (MalformedURLException e) {
            e.printStackTrace();
            throw new RuntimeException("Invalid server URL!");
        }
        JitsiMeetConferenceOptions options = new JitsiMeetConferenceOptions.Builder()
                .setServerURL(serverURL)
                .setRoom(token)
                .setAudioMuted(true)
                .setFeatureFlag("notifications.enabled", true)
                .setFeatureFlag("invite.enabled", false)
                .setFeatureFlag("video-share.enabled", true)
                .setVideoMuted(true)
                .build();

        //  view.join(options);
        JitsiMeetActivity.launch(this,options);
        jitsimeetviewBinding.rootlayout.addView(view);
        Log.d("AfterScreenSharejitsi", width + "::" + height);
        mainViewModel = new ViewModelProvider(this).get(MainViewModel.class);
        more(authJson, Logindata, argument, senderfcmid, Rold_id, companyFeatureid);
        screenshare();
        joinparticipant();
        leftuserparticipante();
        participantRetrive();
        sendBroadcastPaticipate();
//        view.setListener(this);
        jitsimeetviewBinding.stopShare.setOnClickListener(view -> {

            sendMessagetoBroadcast("StopScreen", "false");
            screesharestop();
        });

        jitsimeetviewBinding.drawMenu.setOnClickListener(view -> {
            showBottomSheet();
        });

    }


    private void sendBroadcastPaticipate() {

        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                String setparticipate;
                if (action.equalsIgnoreCase("com.jitsi.sendParticipateId")) {
                    Bundle b = intent.getExtras();
                    setparticipate = b.getString("participateId");
                    RemoteUtils.setParticipateId(setparticipate);

                }
            }
        };
    }
//jovo to have
    private void participantRetrive() {
        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(BroadcastEvent.Type.PARTICIPANTS_INFO_RETRIEVED.getAction());
        LocalBroadcastManager.getInstance(this).registerReceiver(broadcastReceiver, intentFilter);

    }


    @SuppressLint("LogNotTimber")
    private void initDrawing(JitsiMeetView jitsiMeetView) {
        FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(width, height);
        layoutParams.gravity = Gravity.CENTER;
        paintView = new PaintView(this);
        jitsiMeetView.addView(paintView, layoutParams);
        paintView.init(width, height, this, paintView);
        paintView.normal();
        DisplayMetrics metrics = new DisplayMetrics();
        getWindowManager().getDefaultDisplay().getMetrics(metrics);
        int normalHieght = metrics.heightPixels;
        Log.d("##HEIGHT_METR", String.valueOf(normalHieght));
        Log.d("##HEIGHT_REAL", String.valueOf(getRealSizeOfDisplay().getHeight()));

    }

    private void changeLayoutSize(int newWidth, int newHeight, Boolean share) {
        DisplayMetrics displayMetrics = new DisplayMetrics();
        WindowManager wm = (WindowManager) getSystemService(Context.WINDOW_SERVICE); // the results will be higher than using the activity context object or the getWindowManager() shortcut
        wm.getDefaultDisplay().getMetrics(displayMetrics);
        int screenWidth = displayMetrics.widthPixels;
        int screenHeight = displayMetrics.heightPixels;
        float aspect_ratio = (float) newHeight / (float) newWidth;
        int newHeight1 = (int) (aspect_ratio * screenWidth);
        if (newHeight1 < screenHeight) {
            newHeight1 = screenHeight;
        }
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(newWidth, newHeight1);
        params.gravity = Gravity.CENTER;
        view.setLayoutParams(params);
        RemoteUtils.newNormalHeight = newHeight1;
        initNormalDrawing(share);
    }

    private void initNormalDrawing(Boolean share) {


        if (share) {

            DisplayMetrics metrics = new DisplayMetrics();
            getWindowManager().getDefaultDisplay().getMetrics(metrics);
            Size size = new Size(RemoteUtils.getRealSizeWidth(), RemoteUtils.getRealSizeHeight());
            if (size.getHeight() == 0) {
                size = new Size(metrics.widthPixels, metrics.heightPixels);
            }
            paintViewNormal.init(size);
            paintViewNormal.normal();
        }


    }


    private void screenshare() {

        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(BroadcastEvent.Type.SCREEN_SHARE_TOGGLED.getAction());

        LocalBroadcastManager.getInstance(this).registerReceiver(broadcastReceiver, intentFilter);

    }

    private void joinparticipant() {
        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(BroadcastEvent.Type.PARTICIPANT_JOINED.getAction());
        LocalBroadcastManager.getInstance(this).registerReceiver(broadcastReceiver, intentFilter);
    }


    public Size getRealSizeOfDisplay() {
        Display display = getWindowManager().getDefaultDisplay();
        Point size = new Point();
        display.getRealSize(size);
        final int height = size.y;
        final int width = size.x;
        return new Size(width, height);
    }

    private void leftuserparticipante() {

        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(BroadcastEvent.Type.PARTICIPANT_LEFT.getAction());
        LocalBroadcastManager.getInstance(this).registerReceiver(broadcastReceiver, intentFilter);
    }

    @SuppressLint("LogNotTimber")
    private void more(String authJson, LoginData loginData, String argument, String senderfcmid, String rold_id, String companyFeatureid) {
        jitsimeetviewBinding.jitsiMore.setOnClickListener(view -> {
            PopupMenu dropDownMenu = new PopupMenu(getApplicationContext(), jitsimeetviewBinding.jitsiMore);
            dropDownMenu.getMenuInflater().inflate(R.menu.jitsimenu, dropDownMenu.getMenu());
            dropDownMenu.setOnMenuItemClickListener(menuItem -> {

                if (menuItem.getItemId() == R.id.adduser_menu) {

                    /**
                     * @WCF_Getuserdata_using_companyid call this api to Get UserData
                     */
                    JSONObject userdata = new JSONObject();
                    JSONObject auth1 = new JSONObject();
                    JSONArray autharray = new JSONArray();
                    JSONArray body = new JSONArray();
                    try {
                        auth1.put("username", loginData.getUsername());
                        auth1.put("u_c", loginData.getUc());
                        auth1.put("user_id", loginData.getUserId());
                        autharray.put(auth1);
                        userdata.put("company_id", loginData.getCompanyId());
                        userdata.put("task_id", loginData.getServertaskid());
                        userdata.put("auth1", autharray);
                        body.put(userdata);
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                    String Response = mainViewModel.UserGet(UserDataURL, body, auth1, Rold_id, loginData.getCompanyId());
                    DisplayData(Response, authJson, loginData, argument, senderfcmid, UserDataURL, body.toString(), new Gson().toJson(authData), Rold_id, loginData.getCompanyId());
//                    List<Auth1> auth1s = new ArrayList<>();
//                    auth1s.add(new Auth1(loginData.getUsername(), loginData.getUc(), loginData.getUserId()));
//                    List<FcmRequest> FcmList = new ArrayList<>();
//                    FcmList.add(new FcmRequest(loginData.getCompanyId(), loginData.getServertaskid(), auth1s));
//                    AuthData auth1 = new AuthData();
//                    auth1.setUsername(loginData.getUsername());
//                    auth1.setUserId(loginData.getUserId());
//                    auth1.setUc(loginData.getUc());
//
//                    Log.d("UserDataGet", new Gson().toJson(FcmList));
//                    Log.d("UserDataGet", new Gson().toJson(auth1));
//                    Log.d("UserDataGet", new Gson().toJson(auth1s));
//                    Log.d("UserDataGet", new Gson().toJson(UserDataURL));
//                    FcmList.add(new FcmRequest(loginData.getCompanyId(), loginData.getServertaskid(), auth1s));
////
//                    RetrofitClient.getUserApiServices().GetUserData(UserDataURL, new Gson().toJson(auth1), loginData.getCompanyId(), Rold_id, "0", "0", FcmList).enqueue(new Callback<List<UserGetResponse>>() {
//                        @Override
//                        public void onResponse(Call<List<UserGetResponse>> call, Response<List<UserGetResponse>> response) {
//                            if (response.isSuccessful()) {
//                                if (response.body() != null) {
//                                    List<UserGetResponse> getResponseList = response.body();
//                                    DisplayData(getResponseList.toString(), authJson, loginData, argument, senderfcmid, UserDataURL, body.toString(), new Gson().toJson(authData), Rold_id, loginData.getCompanyId());
//                                }
//                            }
//                        }
//
//                        @Override
//                        public void onFailure(Call<List<UserGetResponse>> call, Throwable t) {
//
//                        }
//                    });
                }

                if (menuItem.getItemId() == R.id.adduser_draw_menu) {


                    JSONObject userdata = new JSONObject();
                    JSONObject auth1 = new JSONObject();
                    JSONArray autharray = new JSONArray();
                    JSONArray body = new JSONArray();
                    try {
                        auth1.put("username", loginData.getUsername());
                        auth1.put("u_c", loginData.getUc());
                        auth1.put("user_id", loginData.getUserId());
                        autharray.put(auth1);
                        userdata.put("company_id", loginData.getCompanyId());
                        userdata.put("task_id", loginData.getServertaskid());
                        userdata.put("auth1", autharray);
                        body.put(userdata);
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                    String Response = mainViewModel.UserGet(UserDataURL, body, auth1, Rold_id, loginData.getCompanyId());
                    draw(Response, Logindata, argument, senderfcmid, UserDataURL, body.toString(), auth1.toString(), Rold_id, loginData.getCompanyId(), remoteMessageData);

                }
                return false;
            });
            dropDownMenu.show();
        });
    }


    private void screesharestop() {

        Intent ScreenOnIntent = BroadcastIntentHelper.buildToggleScreenShareIntent(false);
        LocalBroadcastManager.getInstance(this).sendBroadcast(ScreenOnIntent);
    }

    private void pickColor() {
        ColorPicker colorPicker = new ColorPicker(this);
        colorPicker.show();
        colorPicker.setOnChooseColorListener(new ColorPicker.OnChooseColorListener() {
            @Override
            public void onChooseColor(int position, int color) {
                try {
                    JSONObject colorobject = new JSONObject();
                    PaintViewNormal.currentColor = color;
                    PaintView.currentColor = color;
                    String selectedColor = "#" + Integer.toHexString(color).toUpperCase();
                    colorobject.put("Color", selectedColor);
                    sendMessagetoBroadcast("Color", colorobject.toString());

                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onCancel() {
            }
        });
    }


    public void showBottomSheet() {
        String Gestures = "Gestures";
        String Arrow = "Arrow";
        String Text_Fields = "Text Fields";
        String Arrow_Image = "Arrow Image";
        String Color = "selectColor";
        String[] items = new String[]{
                Gestures,
                Arrow,
                Text_Fields,
                Arrow_Image,
                Color,
        };

        int[] icons = new int[]{
                R.drawable.ic_draw_gesture_foreground,
                R.drawable.ic_draw_arrow_foreground,
                R.drawable.ic_draw_text_foreground,
                R.drawable.ic_draw_imagearrow_foreground,
                R.drawable.ic_colorpicker,
        };

        BottomSheet.Builder builder = new BottomSheet.Builder(this);
        builder.setTitle("Please select drawing option");
        builder.setItems(items, icons, (dialogInterface, i) ->

                onToolsButtonClicked(i));
        builder.setFullWidth(true);
        builder.setCallback(new BottomSheetCallback() {
            @Override
            public void onShown() {

            }

            @Override
            public void onDismissed() {

            }
        });
        builder.getGridView();
        builder.show();
    }

    private void onToolsButtonClicked(int i) {


        String item = "";

        if (i == 0) {

            item = "gesture";
        }
        if (i == 1) {

            item = "arrow";
        }

        if (i == 2) {

            item = "textlable";
        }
        if (i == 3) {

            item = "imagearrow";
        }
        if (i == 4) {
            item = "selectColor";
        }

        if (item.equalsIgnoreCase("gesture")) {

            ArDrawingUtils.setDrawingType("");


        } else if (item.equalsIgnoreCase("arrow")) {
            ArDrawingUtils.setDrawingType("arrow");

        } else if (item.equalsIgnoreCase("textlable")) {
            ArDrawingUtils.setDrawingType("text");


        } else if (item.equalsIgnoreCase("imagearrow")) {
            ArDrawingUtils.setDrawingType("imagearrow");
            showArrowAlertDialog();
        } else if (item.equalsIgnoreCase("selectColor")) {
            pickColor();

        }


    }

    @SuppressLint("LogNotTimber")
    private void draw(String response, LoginData loginData, String argument, String senderfcmid, String userDataURL, String body, String auth1, String rold_id, String companyFeatureid, String remoteMessageData) {

        try {
            JSONArray status = new JSONArray(response);
            JSONObject jsonObject = status.getJSONObject(0);
            String status1 = jsonObject.getString("status");
            if (status1.equals("1")) {
                String Data = jsonObject.getString("data");
                drawdropdown(Data, loginData, argument, senderfcmid, userDataURL, body, auth1, rold_id, companyFeatureid, remoteMessageData);
                Log.d("DATAUSER", Data);
            }
            Log.d("RESSPONSE", response);
        } catch (JSONException e) {
            Log.d("Catch", e.toString());
            e.printStackTrace();
        }


    }

    public static <T> ArrayList<T> removeDuplicates(ArrayList<T> list) {
        ArrayList<T> newList = new ArrayList<>();
        for (T element : list) {
            if (!newList.contains(element)) {
                newList.add(element);
            }
        }
        return newList;
    }

    JsonObject jsonObject;

    @SuppressLint("LogNotTimber")
    private void drawdropdown(String data, LoginData loginData, String argument, String senderfcmid, String userDataURL, String body, String auth1, String rold_id, String companyFeatureid, String remoteMessageData) {

//        if (participatId != null) {
//            for (int k = 0; k < UserpartcipateID.size(); k++) {
//                for (int p = 0; p < participatId.size(); p++) {
//
//                    if (UserpartcipateID.get(k).getParticipantId().matches(participatId.get(p).getParticipantId())) {
//                        for (int s = 0; s < newparticipates.size(); s++) {
//                            newparticipates.remove(s);
//                        }
//                    }
//                }
//            }
//        }

        ArrayList<Integer> langlist = new ArrayList<>();
        ArrayList<Integer> langlist1 = new ArrayList<>();

        ArrayList<String> participateusername = new ArrayList<>();
        ArrayList<String> participatefcmIds = new ArrayList<>();
        participateDatas(data, loginData, remoteMessageData);

        newparticipates = removeDuplicates(participates);

        for (int i = 0; i < newparticipates.size(); i++) {

            participateusername.add(newparticipates.get(i));
        }
        for (int i = 0; i < participateFcmId.size(); i++) {
            participatefcmIds.add(participateFcmId.get(i));
        }

        String[] userName = participateusername.toArray(new String[0]);

        String[] fcmId = participatefcmIds.toArray(new String[0]);
        jsonObject = new JsonObject();
        JsonArray jsonElements = new JsonArray();
        selectedParticipateUser = new boolean[fcmId.length];
        StringBuilder notifcmId = new StringBuilder();
        AlertDialog.Builder builder = new AlertDialog.Builder(JitsiMeetViewActivity.this);
        builder.setTitle("Select Participate");
        builder.setCancelable(false);
        builder.setMultiChoiceItems(userName, selectedParticipateUser, (dialogInterface, i, b) -> {

            if (b) {
                langlist.add(i);
                langlist1.add(i);
                Collections.sort(langlist);
                Collections.sort(langlist1);
            } else {
                langlist.remove(Integer.valueOf(i));
                langlist1.remove(String.valueOf(i));
            }
        });

        builder.setPositiveButton("Ok", (dialogInterface, i) -> {

            // Initialize
            for (int j = 0; j < langlist1.size(); j++) {
                // concat array value
                notifcmId.append(fcmId[langlist1.get(j)]);
                jsonElements.add(fcmId[langlist1.get(j)]);
                jsonObject.add("zoom_meeting", jsonElements);
                Log.d(TAGDATA + "244", jsonObject.toString());


                // check condition
                if (j != langlist1.size() - 1) {

                    notifcmId.append(",");

                }
            }
            SendScreenShareNotification(jsonObject, jsonElements, body, auth1, rold_id, companyFeatureid, participatId,loginData);

            for (int j = 0; j < selectedParticipateUser.length; j++) {
                // remove all selection
                selectedParticipateUser[j] = false;
                // clear language list
                langlist.clear();
                langlist1.clear();
            }

        });
        builder.setNegativeButton("Cancel", (dialogInterface, i) -> {
            // dismiss dialog
            dialogInterface.dismiss();
        });
        builder.show();


    }

    @SuppressLint("LogNotTimber")
    private void participateDatas(String response, LoginData logindata, String remoteMessageData) {
        Data remotedata = new Gson().fromJson(remoteMessageData, Data.class);

        try {
            JSONArray jsonArray = new JSONArray(response);


            JSONObject ZoomMeetingJson = new JSONObject();

            Datas datas = new Datas();
            for (int i = 0; i < jsonArray.length(); i++) {

                try {
                    JSONObject dataobj = jsonArray.getJSONObject(i);
                    datas.setUsername(dataobj.getString("username"));
                    datas.setFcmid(dataobj.getString("fcmid"));
                    datas.setDeviceType(dataobj.getString("DeviceType"));
                    participate.clear();
                    for (int f = 0; f < participate.size(); f++) {
                        if (participate.get(f).matches(datas.getUsername())) {

                            ZoomMeetingJson.put("usename", datas.getUsername());
                            ZoomMeetingJson.put("fcmid", datas.getFcmid());
                            ZoomMeetingJson.put("device_type", datas.getDeviceType());
                            ZoomMeetingJson.put("task_id", logindata.getServertaskid());
                            participateFcmId.add(ZoomMeetingJson.toString());
                            participates.add(datas.getUsername());
                            FcmData.add(datas.getFcmid());
                            Log.d("ParticipateFCM ", ZoomMeetingJson.toString());

                        }

                    }
                    if (participate.size() == 0 && remotedata == null) {
                        Args args = new Gson().fromJson(argument.substring(1, argument.length() - 1), Args.class);
                        for (int f = 0; f < args.getZoomMeeting().size(); f++) {
                            ZoomMeetingItem zoomMeetingItem = args.getZoomMeeting().get(f);
                            if (zoomMeetingItem.getUsername().equalsIgnoreCase(datas.getUsername())) {
                                ZoomMeetingJson.put("usename", datas.getUsername());
                                ZoomMeetingJson.put("fcmid", datas.getFcmid());
                                ZoomMeetingJson.put("device_type", datas.getDeviceType());
                                ZoomMeetingJson.put("task_id", logindata.getServertaskid());
                                participateFcmId.add(ZoomMeetingJson.toString());
                                participates.add(datas.getUsername());
                                FcmData.add(datas.getFcmid());
                                Log.d("ParticipateFCM ", ZoomMeetingJson.toString());
                            }

                        }
                    }
                    if (remotedata != null) {

                        if (remotedata.getCallfrom().matches(datas.getUsername())) {
                            ZoomMeetingJson.put("usename", datas.getUsername());
                            ZoomMeetingJson.put("fcmid", datas.getFcmid());
                            ZoomMeetingJson.put("device_type", datas.getDeviceType());
                            ZoomMeetingJson.put("task_id", logindata.getServertaskid());
                            participateFcmId.add(ZoomMeetingJson.toString());
                            participates.add(datas.getUsername());
                        }
                        Log.d(TAGDATA + "161", ZoomMeetingJson.toString());
                    }
                } catch (JSONException e) {
                    Log.d("ERROR", e.toString());
                    e.printStackTrace();
                }

            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @SuppressLint("LogNotTimber")
    private void SendScreenShareNotification(JsonObject jsonObject, JsonArray jsonElements, String body, String loginData, String argument, String senderfcmid, ArrayList<ParticipateId> participatId,LoginData loginData1) {
        Log.d("ScreenData", jsonObject.toString());
        Log.d("ScreenData", jsonElements.toString());

        String click_action = "click_action: https://development.easyform.in/WEB,";
        String link = "https://development.easyform.in/WEB";

        JSONArray jsonArray = new JSONArray();
        jsonArray.put(jsonObject);
        String ZoomMeeting = getJsonMeeting(jsonArray.toString());
//        LoginData loginData1 = new Gson().fromJson(loginData, LoginData.class);
        Log.d("TAGDATA", ZoomMeeting);
        String participated = null;

        if (UserpartcipateID.size() > 0) {
            participated = new Gson().toJson(UserpartcipateID);
        }


        if (UserpartcipateID.size() == 0 || participated == null && remoteMessageData != null) {
            Data data1 = new Gson().fromJson(remoteMessageData, Data.class);
            if(data1 == null)
            {
                try {
                    JSONArray participant = new JSONArray();
                    JSONObject jsonObject1 = new JSONObject();
                    jsonObject1.put("participantId", loginData1.getUc());
                    participant.put(jsonObject1);
                    participated = participant.toString();
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
            else {
                try {
                    JSONArray participant = new JSONArray();
                    JSONObject jsonObject1 = new JSONObject();
                    jsonObject1.put("participantId", data1.getUc());
                    participant.put(jsonObject1);
                    participated = participant.toString();
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        }


        for (int i = 0; i < FcmData.size(); i++) {

            String fcm = FcmData.get(i);
        }
        Size size = getRealSizeOfDisplay();
        JSONObject jsonObject2 = null;
        try {
            jsonObject2 = new JSONObject();
            jsonObject2.put("height", size.getHeight());
            jsonObject2.put("width", size.getWidth());
            jsonObject2.put("deviceType", "android");
        } catch (Exception e) {
            e.printStackTrace();
        }

        JSONObject webpushdata = WebKey(link);
        Intent shareScreenIntent = new Intent(JitsiMeetViewActivity.this, JitsiPluginBroadcast.class);
        shareScreenIntent.setAction("com.easyform.jitsi.JitsiScreenShareNoti");
        shareScreenIntent.putExtra("Args", ZoomMeeting);
        shareScreenIntent.putExtra("loginJson", loginData);
        shareScreenIntent.putExtra("click_action", click_action);
        shareScreenIntent.putExtra("webpush", webpushdata.toString());
        shareScreenIntent.putExtra("senderfcmid", senderfcmid);
        shareScreenIntent.putExtra("getUserData", body);
        shareScreenIntent.putExtra("Url", WCFURL);
        shareScreenIntent.putExtra("remoteHeight", height);
        shareScreenIntent.putExtra("remoteWidth", width);
        shareScreenIntent.putExtra("keyType", "screensize");
        shareScreenIntent.putExtra("jsonData", jsonObject2.toString());
        shareScreenIntent.putExtra("participatId", participated);
        sendBroadcast(shareScreenIntent);
        Log.d("particpateId", participatId.toString());
        Log.d("particpateId", new Gson().toJson(participatId));
//        Log.d("particpateId", participated);

    }

    @SuppressLint("LogNotTimber")
    private void getIntentData(Intent intent) {
        token = intent.getStringExtra("token");
        UserDataURL = intent.getStringExtra("UserDataURL");
        body = intent.getStringExtra("body");
        auth1 = intent.getStringExtra("auth1");
        Rold_id = intent.getStringExtra("Rold_id");
        width = intent.getIntExtra("width", 720);
        height = intent.getIntExtra("height", 1280);
        companyFeatureid = intent.getStringExtra("companyFeatureid");
        Authjson = (AuthJson) intent.getSerializableExtra("authJson");
        Log.d("AUTH", new Gson().toJson(Authjson));
        Logindata = (LoginData) intent.getSerializableExtra("loginData");
        Log.d("AUTH", new Gson().toJson(Logindata));
        argument = intent.getStringExtra("Args");
        senderfcmid = intent.getStringExtra("senderfcmid");
        remoteMessageData = intent.getStringExtra("remoteMessageData");
        getUserData = intent.getStringExtra("userGetData");
        roomName = intent.getStringExtra("roomName");
        accept = intent.getBooleanExtra("accept", false);
        authData = (AuthData) intent.getSerializableExtra("AuthData");
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        JitsiMeetActivityDelegate.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    @SuppressLint("LogNotTimber")
    private void DisplayData(String response, String authJson, LoginData loginData, String
            argument, String senderfcmid, String userDataURL, String body, String auth1, String
                                     rold_id, String companyFeatureid) {

        String data;
        JSONArray status;
        try {
            status = new JSONArray(response);
            JSONObject jsonObject = status.getJSONObject(0);
            String status1 = jsonObject.getString("status");
            if (status1.equals("1")) {
                String Data = jsonObject.getString("data");
                Adddropdown(Data, authJson, loginData, argument, senderfcmid, userDataURL, body, auth1, rold_id, companyFeatureid);
                Log.d("DATAUSER", Data);
            }
            Log.d("RESSPONSE", response);
        } catch (JSONException e) {
            Log.d("Catch", e.toString());
            e.printStackTrace();
        }
    }

    @SuppressLint("LogNotTimber")
    private void Adddropdown(String data, String authJson, LoginData loginData, String
            argument, String senderfcmid, String userDataURL, String body, String auth1, String
                                     rold_id, String companyFeatureid) {

        JSONArray jsonArray = null;
        try {
            jsonArray = new JSONArray(data);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        UserName = new ArrayList<>();
        FcmId = new ArrayList<>();

        JSONObject ZoomMeetingJson = new JSONObject();

        ArrayList<String> fcmIds = new ArrayList<>();
        Datas datas = new Datas();
        ArrayList<MultiSelectModel> multiSelectDialogs = new ArrayList<>();

        for (int i = 0; i < jsonArray.length(); i++) {

            try {
                JSONObject dataobj = jsonArray.getJSONObject(i);
                datas.setUsername(dataobj.getString("username"));
                datas.setFcmid(dataobj.getString("fcmid"));
                datas.setDeviceType(dataobj.getString("DeviceType"));
                ZoomMeetingJson.put("usename", datas.getUsername());
                ZoomMeetingJson.put("fcmid", datas.getFcmid());
                ZoomMeetingJson.put("device_type", datas.getDeviceType());
                ZoomMeetingJson.put("task_id", loginData.getServertaskid());
                FcmId.add(ZoomMeetingJson.toString());
                multiSelectDialogs.add(new MultiSelectModel(i, datas.getUsername()));
                Log.d(TAGDATA + "161", ZoomMeetingJson.toString());

            } catch (JSONException e) {
                Log.d("ERROR", e.toString());
                e.printStackTrace();
            }

        }
        /**
         * @FCMID List
         */
        for (int i = 0; i < FcmId.size(); i++) {
            fcmIds.add(FcmId.get(i));
        }

        String[] fcmId = fcmIds.toArray(new String[0]);
        JsonObject jsonObject = new JsonObject();
        JsonArray jsonElements = new JsonArray();
        /**
         * @MultipleDilaog for List User List
         */
        multiSelectDialog = new MultiSelectDialog()
                .title("Select User")
                .titleSize(25)
                .positiveText("Send")
                .negativeText("Cancel")
                .setMinSelectionLimit(1)
                .setMaxSelectionLimit(UserName.size())
                .multiSelectList(multiSelectDialogs)
                .onSubmit(new MultiSelectDialog.SubmitCallbackListener() {
                    @Override
                    public void onSelected(ArrayList<Integer> selectedIds, ArrayList<String> usertName, String s) {
                        for (int i = 0; i < selectedIds.size(); i++) {
                            jsonElements.add(fcmId[selectedIds.get(i)]);
                            jsonObject.add("zoom_meeting", jsonElements);
                            Log.d("FCMPUSH", jsonObject.toString());
                        }
                        SendNotiWhenJoinMeet(jsonObject, jsonElements, loginData, argument, senderfcmid, userDataURL, body, auth1, rold_id, companyFeatureid, roomName);
                    }

                    @Override
                    public void onCancel() {

                    }
                });
        multiSelectDialog.show(getSupportFragmentManager(), "multiSelectDialog");
    }


    @SuppressLint("LogNotTimber")
    private void SendNotiWhenJoinMeet(JsonObject Argss, JsonArray json, LoginData
            loginData, String Argsss, String senderfcmid, String userDataURL, String body, String
                                              auth1, String rold_id, String companyFeatureid, String roomName) {
        Log.d(TAGDATA + "line 297", Argss.toString());
        /**
         * @WebKey click_action and  link
         */
        String click_action = "click_action: https://development.easyform.in/WEB,";
        String link = "https://development.easyform.in/WEB";

        JSONArray jsonArray = new JSONArray();
        jsonArray.put(Argss);
        String ZoomMeeting = getJsonMeeting(jsonArray.toString());

        Log.d("TAGDATA", ZoomMeeting);
        JSONObject webpushdata = WebKey(link);

        /**
         * @Intent send Broadcast to AddUser
         */
        Intent jitsiCallBroadcast = new Intent(JitsiMeetViewActivity.this, JitsiPluginBroadcast.class);
        jitsiCallBroadcast.setAction("com.easyform.jitsi.JitsiMeetCall");
        jitsiCallBroadcast.putExtra("Args", ZoomMeeting);
        jitsiCallBroadcast.putExtra("Url", WCFURL);
        jitsiCallBroadcast.putExtra("loginJson", loginData);
        jitsiCallBroadcast.putExtra("click_action", click_action);
        jitsiCallBroadcast.putExtra("webpush", webpushdata.toString());
        jitsiCallBroadcast.putExtra("senderfcmid", senderfcmid);
        jitsiCallBroadcast.putExtra("getUserData", body);
        jitsiCallBroadcast.putExtra("Role_id", rold_id);
        jitsiCallBroadcast.putExtra("companyFeatureid", companyFeatureid);
        jitsiCallBroadcast.putExtra("body", body);
        jitsiCallBroadcast.putExtra("roomName", roomName);
        String jsons = new Gson().toJson(participatedata);
        jitsiCallBroadcast.putExtra("participatId", jsons);
        Log.d("GSONDATA", jsons);
        sendBroadcast(jitsiCallBroadcast);
    }


    private String getJsonMeeting(String jsonArray) {
        String zoom_args;
        String replaces = jsonArray.replaceAll("\"\\{", "{");
        String arays = replaces.replaceAll("\\\\", "");
        zoom_args = arays.replaceAll("\\}\"", "}");

        return zoom_args;
    }


    private JSONObject WebKey(String link) {

        JSONObject webpush = null;
        try {
            JSONObject object = new JSONObject();
            object.put("link", link);
            JSONObject jsonObject1 = new JSONObject();
            jsonObject1.put("fcm_options", object);
            webpush = new JSONObject();
            webpush.put("webpush", jsonObject1);

        } catch (JSONException e) {
            e.printStackTrace();
        }

        return webpush;
    }

    @Override
    public void requestPermissions(String[] strings, int i, PermissionListener permissionListener) {

    }


//    @SuppressLint({"TimberArgCount", "LogNotTimber"})
//    @Override
//    public void onConferenceJoined(Map<String, Object> map) {
//        Log.d(TAGDATA, map.toString());
//        Timber.d(TAGDATA, map);
//    }
//
//    @SuppressLint("TimberArgCount")
//    @Override
//    public void onConferenceTerminated(Map<String, Object> map) {
//        Timber.d(TAGDATA, map);
//        this.finish();
//
//
//    }
//
//
//    @SuppressLint("TimberArgCount")
//    @Override
//    public void onConferenceWillJoin(Map<String, Object> map) {
//        Timber.d(TAGDATA, map);
//    }


    @Override
    public boolean onMenuItemClick(MenuItem menuItem) {
        return false;
    }


    private final BroadcastReceiver broadcastReceiver =
            new BroadcastReceiver() {
                public void onReceive(Context context, Intent intent) {
                    JitsiMeetViewActivity.this.BroadcastReceiver(intent);
                }
            };

    BroadcastEvent event;

    @SuppressLint("TimberArgCount")
    private void BroadcastReceiver(Intent intent) {
        if (intent != null) {


            event = new BroadcastEvent(intent);
            switch (event.getType()) {
                case SCREEN_SHARE_TOGGLED:
                    Boolean share = mainViewModel.ScreenSharingData(event.getData());
//                    String setparticipatedData = null;
                    String participateArray = null;
                    if (share) {
                        jitsimeetviewBinding.stopShare.setVisibility(View.VISIBLE);
                        jitsimeetviewBinding.drawMenu.setVisibility(View.VISIBLE);
                        screemshare = true;
                        paintViewNormal = new PaintViewNormal(this);
                        FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(width, height);
                        layoutParams.gravity = Gravity.CENTER;
                        view.addView(paintViewNormal, layoutParams);
                        customNormalDrawing = new CustomNormalDrawing(this);
                        view.addView(customNormalDrawing, layoutParams);
                        changeLayoutSize(width, height, share);
                        initDrawing(view);
                        customNormalDrawing.init();
                        HelloSceneformActivity activity1 = new HelloSceneformActivity();
                        EventUtils eventUtils = new EventUtils(activity1, this);
                        participateArray = RemoteUtils.getParticipateId();
                    } else if (!share) {
                        jitsimeetviewBinding.stopShare.setVisibility(View.GONE);
                        jitsimeetviewBinding.drawMenu.setVisibility(View.GONE);
                        screemshare = false;
                        view.removeView(paintViewNormal);
                        view.removeView(paintView);
                        view.removeView(customNormalDrawing);

                    }

                    Timber.i("screenshare", event.getData());


                    mainViewModel.screen(event.getData(), this, participateArray);
                case CONFERENCE_JOINED:
//                    this.onConferenceJoined(event.getData());
                    break;
                case CONFERENCE_WILL_JOIN:
//                    this.onConferenceWillJoin(event.getData());
                    break;
                case CONFERENCE_TERMINATED:
//                    this.onConferenceTerminated(event.getData());
                    break;
                case PARTICIPANT_JOINED:
                    this.onParticipantJoined(event.getData());
                    break;
                case PARTICIPANT_LEFT:
                    this.onParticipantLeft(event.getData());
                case PARTICIPANTS_INFO_RETRIEVED:
                    this.Participants_info(event.getData());
            }


        }
    }

    @Override
    protected void onRestart() {
        if (receiver != null) {
            unregisterReceiver(receiver);
            receiver = null;
        }
        super.onRestart();
    }

    @Override
    public void finish() {
        leave();
        super.finish();
    }

    protected void leave() {
        Intent hangupBroadcastIntent = BroadcastIntentHelper.buildHangUpIntent();
        LocalBroadcastManager.getInstance(getApplicationContext()).sendBroadcast(hangupBroadcastIntent);
    }

    @SuppressLint("LogNotTimber")
    protected void onParticipantJoined(HashMap<String, Object> data) {
        JSONArray mJSONArray = new JSONArray(Arrays.asList(data));
        String Name = null;
        String participantIds = null;
        String role = null;
        for (int i = 0; i < mJSONArray.length(); i++) {
            try {
                JSONObject jsonObject = mJSONArray.getJSONObject(i);
                Name = jsonObject.getString("name");
                participantIds = jsonObject.getString("participantId");
                role = jsonObject.getString("role");
//                Log.d("Roles", role);
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        participatedata.add(new Participate(Name, participantIds, role));
        Log.d("participate", participatedata.toString());
        Log.d("participate", new Gson().toJson(participatedata));
        for (int i = 0; i < participatedata.size(); i++) {

            String name = participatedata.get(i).getName();
            String participantId = participatedata.get(i).getParticipantId();
            String roles = participatedata.get(i).getRole();
//            Log.d("ROLES ", roles);
            participate.add(name);

            UserpartcipateID.add(new ParticipateId(participantId));
        }
    }


    @SuppressLint("LogNotTimber")
    protected void onParticipantLeft(HashMap<String, Object> data) {
        String participantId = null;
        JSONArray mJSONArray = new JSONArray(Arrays.asList(data));

        for (int j = 0; j < mJSONArray.length(); j++) {
            try {
                JSONObject jsonObject = mJSONArray.getJSONObject(j);
                participantId = jsonObject.getString("participantId");
            } catch (JSONException e) {
                e.printStackTrace();
            }
            participatId.add(new ParticipateId(participantId));
        }

        Log.d("Participant Left Json: ", mJSONArray.toString());
    }


    @SuppressLint("LogNotTimber")
    private void Participants_info(HashMap<String, Object> data) {
        JSONArray mjson = new JSONArray(Arrays.asList(data));
        Log.d("participatedata", mjson.toString());

    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        JitsiMeetActivityDelegate.onNewIntent(intent);

    }

    @Override
    protected void onResume() {
        super.onResume();


        registerReceiver(receiver, new IntentFilter("com.jitsi.sendParticipateId"));
        JitsiMeetActivityDelegate.onHostResume(this);


    }


    @Override
    protected void onStop() {
        super.onStop();
        JitsiMeetActivityDelegate.onHostPause(this);
        if (receiver != null) {
            unregisterReceiver(receiver);
            receiver = null;
        }


    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        view.dispose();
        view = null;
        JitsiMeetActivityDelegate.onHostDestroy(this);
        LocalBroadcastManager.getInstance(this).unregisterReceiver(broadcastReceiver);
        if (receiver != null) {
            unregisterReceiver(receiver);
            receiver = null;
        }


    }


    @SuppressLint("MissingSuperCall")
    @Override
    public void onActivityResult(
            int requestCode,
            int resultCode,
            Intent data) {
        JitsiMeetActivityDelegate.onActivityResult(
                this, requestCode, resultCode, data);

    }

    @Override
    public void onBackPressed() {

        JitsiMeetActivityDelegate.onBackPressed();
//        unregisterReceiver(receiver);

    }


    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        view.enterPictureInPicture();
    }

    @Override
    protected void onPause() {
        super.onPause();
        JitsiMeetActivityDelegate.onHostResume(this);
        this.finish();
    }


    @SuppressLint("UseCompatLoadingForDrawables")
    private void showArrowAlertDialog() {


        final String[] selectedImage = {""};
        final String[] selectedColor = {""};

        // custom dialog
        final Dialog dialog = new Dialog(this);
        dialog.setContentView(R.layout.alert_arrow);
        Button dialogButton = dialog.findViewById(R.id.btn_arrowselect);

        ImageView imageDown = dialog.findViewById(R.id.img_down);
        ImageView imageUp = dialog.findViewById(R.id.img_up);
        ImageView imageLeft = dialog.findViewById(R.id.img_left);
        ImageView imageRight = dialog.findViewById(R.id.img_right);

        ImageView colorBlue = dialog.findViewById(R.id.color_blue);
        ImageView colorGreen = dialog.findViewById(R.id.color_green);
        ImageView colorOrange = dialog.findViewById(R.id.color_orange);
        ImageView colorYellow = dialog.findViewById(R.id.color_yellow);


        imageDown.setOnClickListener(view -> {
            selectedImage[0] = "down";
            imageDown.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_selected_foreground));
            imageDown.setBackground(getApplicationContext().getResources().getDrawable(R.drawable.backgound_alert_arrow));
            //
            imageUp.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_up_foreground));
            imageLeft.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_left_foreground));
            imageRight.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_right));

        });

        imageUp.setOnClickListener(view -> {
            selectedImage[0] = "up";
            imageUp.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_selected_foreground));
            imageUp.setBackground(getApplicationContext().getResources().getDrawable(R.drawable.backgound_alert_arrow));
            //
            imageLeft.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_left_foreground));
            imageRight.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_right));
            imageDown.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_down_foreground));
        });

        imageLeft.setOnClickListener(view -> {
            selectedImage[0] = "left";
//            setSelectedImage(imageDown);
            imageLeft.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_selected_foreground));
            imageLeft.setBackground(getApplicationContext().getResources().getDrawable(R.drawable.backgound_alert_arrow));

            //
            imageRight.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_right));
            imageDown.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_down_foreground));
            imageUp.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_up_foreground));
        });

        imageRight.setOnClickListener(view -> {
            selectedImage[0] = "right";
//            setSelectedImage(imageDown);

            imageRight.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_selected_foreground));
            imageRight.setBackground(getApplicationContext().getResources().getDrawable(R.drawable.backgound_alert_arrow));

            //
            imageDown.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_down_foreground));
            imageUp.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_up_foreground));
            imageLeft.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_left_foreground));
        });
        //For Color
        colorBlue.setOnClickListener(view -> {
            selectedColor[0] = "blue";
            Drawable arrow_selected_foreground = getResources().getDrawable(R.drawable.ic_arrow_selected_foreground);

//            colorBlue.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_selected_foreground));
            colorBlue.setImageDrawable(arrow_selected_foreground);
            colorBlue.setBackgroundColor(getApplicationContext().getResources().getColor(R.color.blue));

            //
            colorOrange.setImageResource(R.color.orange);
            colorYellow.setImageResource(R.color.yellow);
            colorGreen.setImageResource(R.color.green);
        });

        colorGreen.setOnClickListener(view -> {
            selectedColor[0] = "green";
            Drawable arrow_selected_foreground = getResources().getDrawable(R.drawable.ic_arrow_selected_foreground);

            colorGreen.setImageDrawable(arrow_selected_foreground);
            colorGreen.setBackgroundColor(getApplicationContext().getResources().getColor(R.color.green));

            //Color
            colorBlue.setImageResource(R.color.blue);
            colorOrange.setImageResource(R.color.orange);
            colorYellow.setImageResource(R.color.yellow);
        });

        colorOrange.setOnClickListener(view -> {

            selectedColor[0] = "orange";
            Drawable arrow_selected_foreground = getResources().getDrawable(R.drawable.ic_arrow_selected_foreground);

            colorOrange.setImageDrawable(arrow_selected_foreground);
            colorOrange.setBackgroundColor(getApplicationContext().getResources().getColor(R.color.orange));

            colorYellow.setImageResource(R.color.yellow);
            colorBlue.setImageResource(R.color.blue);
            colorGreen.setImageResource(R.color.green);

        });

        colorYellow.setOnClickListener(view -> {

            selectedColor[0] = "yellow";
            Drawable arrow_selected_foreground = getResources().getDrawable(R.drawable.ic_arrow_selected_foreground);

            colorYellow.setImageDrawable(arrow_selected_foreground);
            colorYellow.setBackgroundColor(getApplicationContext().getResources().getColor(R.color.yellow));

            colorBlue.setImageResource(R.color.blue);
            colorGreen.setImageResource(R.color.green);
            colorOrange.setImageResource(R.color.orange);
        });


        // if button is clicked, close the custom dialog
        dialogButton.setOnClickListener(v -> {
            dialog.dismiss();
            Toast.makeText(getApplicationContext(), selectedImage[0] + " " + selectedColor[0], Toast.LENGTH_SHORT).show();
            ImageArrowUtils.setArrowType(selectedImage[0]);
            ImageArrowUtils.setArrowColor(selectedColor[0]);
        });
        dialog.show();
    }


    @Override
    public void touchPaintView(MotionEvent event) {
        if (event.getAction() == MotionEvent.ACTION_DOWN) {

            sendTouchEventToscreenshare(event, false);
        }
        if (event.getAction() == MotionEvent.ACTION_MOVE) {
            sendTouchEventToscreenshare(event, false);
        }
        if (event.getAction() == MotionEvent.ACTION_UP) {
            sendTouchEventToscreenshare(event, true);
        }
        if (event.getAction() == MotionEvent.ACTION_MASK) {
            sendTouchEventToscreenshare(event, false);
        }
        if (event.getAction() == MotionEvent.ACTION_OUTSIDE) {
            sendTouchEventToscreenshare(event, false);
        }
    }

    @Override
    public void touchPaintView(MotionEvent event, String drawingText) {
        if (drawingText.equalsIgnoreCase("imagearrow")) {
            sendImageArrowToAR(event);
        } else {
            if (event.getAction() == MotionEvent.ACTION_DOWN) {
                JSONArray motionEventArray = makeJsonArrayText(event);
                showenterTextDialog(motionEventArray);
            }
        }
    }

    @Override
    public void showTouches(MotionEvent event, boolean isShowing) {

    }

    @SuppressLint("LogNotTimber")
    private void sendImageArrowToAR(MotionEvent event) {

        try {
            JSONArray motionevent = new JSONArray();
            int resX = newResolution().get("getX");
            int resY = RemoteUtils.calRatioHeight;
//            int resY = height;
            motionevent.put(resX);
            motionevent.put(resY);

            motionevent.put(event.getX());
            motionevent.put(changedScreenPointY(event.getY()));
//            motionevent.put(event.getY());
            motionevent.put(event.getAction());
            motionevent.put(event.getMetaState());
            motionevent.put(event.getEventTime());
            motionevent.put(event.getDownTime());
            motionevent.put(ImageArrowUtils.getArrowType());
            motionevent.put(ImageArrowUtils.getArrowColor());
            jsonArrayEvent.put(motionevent);

            Log.d("##REMOTEVIEW", jsonArrayEvent.toString());

            JSONObject jsonObject = new JSONObject();
            jsonObject.put("imagearrow", jsonArrayEvent);
            jsonArrayEvent = new JSONArray();
            sendMessagetoBroadcast("imagearrow", jsonObject.toString());

        } catch (Exception e) {

            Log.d("#IMAGEARROW", e.toString());
            e.printStackTrace();
        }
    }

    private JSONArray makeJsonArrayText(MotionEvent event) {

        JSONArray motionevent = null;
//        JSONArray motionevent = null;
        try {
            motionevent = new JSONArray();
            int resX = newResolution().get("getX");
//            int resY = newResolution().get("getY");
            int resY = RemoteUtils.calRatioHeight;

            motionevent.put(resX);
            motionevent.put(resY);
            motionevent.put(event.getX());
            motionevent.put(changedScreenPointY(event.getY()));
//            motionevent.put(event.getY());
            motionevent.put(event.getAction());
            motionevent.put(event.getMetaState());
            motionevent.put(event.getEventTime());
            motionevent.put(event.getDownTime());

        } catch (Exception e) {

            e.printStackTrace();
        }
        return motionevent;
    }

    private void showenterTextDialog(JSONArray motionEventArray) {

        AlertDialog.Builder alertDialog = new AlertDialog.Builder(this);
        alertDialog.setMessage("Enter text here");

        View view = LayoutInflater.from(this).inflate(R.layout.alertdialog_view, null, false);
        EditText input = view.findViewById(R.id.nameEdit);

        alertDialog.setView(view);

        alertDialog.setPositiveButton("OK",
                (dialog, which) -> {
                    String drawingText12 = input.getText().toString();
                    motionEventArray.put(drawingText12);
                    sendTextLableToAR(motionEventArray);
                });
        alertDialog.setNegativeButton("CANCEL",
                (dialog, which) -> dialog.cancel());
        alertDialog.show();

    }

    @SuppressLint("LogNotTimber")
    private void sendTextLableToAR(JSONArray motionevent) {

        try {
            jsonArrayEvent.put(motionevent);
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("textlable", jsonArrayEvent);
            jsonArrayEvent = new JSONArray();
            sendMessagetoBroadcast("textlable", jsonObject.toString());

        } catch (Exception e) {
            Log.d("#TEXTLABLE", e.toString());
            e.printStackTrace();
        }
    }


    @SuppressLint("LogNotTimber")
    private void sendTouchEventToscreenshare(MotionEvent event, boolean b) {


        try {
            JSONArray motionevent = new JSONArray();
            if (event.getAction() == 0) {
                int resX = newResolution().get("getX");
                int resY = RemoteUtils.calRatioHeight;
                motionevent.put(resX);
                motionevent.put(resY);
                motionevent.put(event.getDownTime());
                motionevent.put(event.getEventTime());
            }
            motionevent.put(event.getX());
            motionevent.put(changedScreenPointY(event.getY()));
            motionevent.put(event.getAction());
            jsonArrayEvent.put(motionevent);

            Log.d("##REMOTEVIEW", jsonArrayEvent.toString());
            if (b) {
                JSONObject motionObject = new JSONObject();
                motionObject.put("gestures", jsonArrayEvent);
                jsonArrayEvent = new JSONArray();
                sendMessagetoBroadcast("gestures", motionObject.toString());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @SuppressLint("LogNotTimber")
    private float changedScreenPointY(float getY) {

        Size screenSize = getRealSizeOfDisplay();

        if (screenSize.getHeight() == RemoteUtils.calRatioHeight) {
            Log.d("##Y_NORMAL", String.valueOf(RemoteUtils.calRatioHeight));
            return getY;
        } else {
            float newDifference = (screenSize.getHeight() - RemoteUtils.calRatioHeight);
            newDifference = newDifference / 2;

            Log.d("##Y_CAL", String.valueOf(newDifference));
            Log.d("##Y_CAL", String.valueOf(getY));
            Log.d("##Y_CAL", String.valueOf(RemoteUtils.calRatioHeight));
            return getY - newDifference;

        }

    }

    @SuppressLint("LogNotTimber")
    private HashMap<String, Integer> newResolution() {
        DisplayMetrics displayMetrics = new DisplayMetrics();
        WindowManager wm = (WindowManager) getApplicationContext().getSystemService(Context.WINDOW_SERVICE); // the results will be higher than using the activity context object or the getWindowManager() shortcut
        wm.getDefaultDisplay().getMetrics(displayMetrics);

        int screenWidth = paintView.getWidth();
        int screenHeight = paintView.getHeight();

        Size size = getRealSizeOfDisplay();
        Log.d("##BUG_SCREEN", "PHEIGHT :" + screenHeight + " PWIDTH :" + screenWidth + "RHEIGHT :" + size.getHeight() + "RWIDTH :" + screenWidth);

        HashMap<String, Integer> newResolution = new HashMap<>();
        newResolution.put("getX", screenWidth);
        newResolution.put("getY", screenHeight);
        return newResolution;

    }

    @SuppressLint("LogNotTimber")
    public void sendMessagetoBroadcast(String msgKey, String msgValue) {

        String zoomString = null;
        for (int i = 0; i < participateFcmId.size(); i++) {
            zoomString = participateFcmId.get(i);
        }
        JSONObject jsonObject;
        JSONArray jsonArray1 = new JSONArray();
        try {
            jsonObject = new JSONObject(zoomString);

            JSONArray jsonArray = new JSONArray();
            jsonArray.put(jsonObject);
            JSONObject object = new JSONObject();
            object.put("zoom_meeting", jsonArray);
            jsonArray1.put(object);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        String zoomMeeting = getJsonMeeting(jsonArray1.toString());

        Log.d("send", "Broadcast Send");
        Intent intent = new Intent(JitsiMeetViewActivity.this, JitsiPluginBroadcast.class);
        intent.setAction("com.easyform.jitsi.Jitsi-event_broadcast");
        intent.putExtra("keytype", msgKey);
        intent.putExtra("jsonData", msgValue);
        intent.putExtra("logindata", Logindata);
        intent.putExtra("Args", zoomMeeting);
        Log.d("drawingview", msgValue);
        sendBroadcast(intent);

    }


}