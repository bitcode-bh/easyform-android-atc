package com.easyform.newjitsi.activitys.chat;

import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.app.Activity;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.StrictMode;
import android.view.View;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import com.easyform.newjitsi.R;
import com.easyform.newjitsi.network.Models.OtherData;
import com.easyform.newjitsi.network.Models.UserData;
import com.easyform.newjitsi.utils.Utils;
import com.google.android.material.textfield.TextInputEditText;
import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;

public class ChatActivity extends AppCompatActivity {

    ImageView mImageViewAddUSer;
    RecyclerView mRecyclerViewChatHistory;
    TextInputEditText mTextMsgWrite;
    ImageView imageViewSend;
    TextView mTextViewClose;
    ArrayList mListMessage;
    MessageHistoryAdapter messageHistoryAdapter;
//
    private static final String METHOD_NAME_SendMsg = "WCF_Mobile_Notification_Master";
    private static final String METHOD_NAME_GetTaskData = "Task/GetTaskBasicDataWithJson";
    private static final String METHOD_NAME_GetDataFromMobile = "WCF_Get_Data_From_Mobile_Notification_Master";
    private static final String METHOD_NAME_History = "Wcf_Get_task_history";
    private final Gson mGson = new Gson();
    Bundle extras;
    String loginUserDataString;
    String otherDataString;
    UserData mUserData;
    OtherData mOtherData;
    private ProgressBar progressBar;
    String flow_id;

    private SharedPreferences sharedPreferences;
    SharedPreferences.Editor mEditor;

    ArrayList<Chatmsglist> mArrayChatList = new ArrayList<Chatmsglist>();
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat);
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        mImageViewAddUSer = findViewById(R.id.Imageview_adduser);
        mRecyclerViewChatHistory = findViewById(R.id.recycler_view);
        mTextMsgWrite = findViewById(R.id.editext_msgbox);
        imageViewSend = findViewById(R.id.MsgSend);
        mTextViewClose = findViewById(R.id.close);
        progressBar = findViewById(R.id.progressBar);

        sharedPreferences = getSharedPreferences("Chat", Context.MODE_PRIVATE);
        mEditor = sharedPreferences.edit();
        extras = getIntent().getExtras();
         loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
         otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");

         mUserData = mGson.fromJson(loginUserDataString, UserData.class);
         mOtherData = mGson.fromJson(otherDataString, OtherData.class);
        init();
    }

    public void init()
    {
        GetTaskBasicDataWith();
        mTextViewClose.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                finish();
            }
        });

        mImageViewAddUSer.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                Intent mIntent = new Intent(ChatActivity.this,AddUSerActivity.class);
                startActivity(mIntent);
            }
        });

        imageViewSend.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                progressBar.setVisibility(View.VISIBLE);
                if(mTextMsgWrite.getText().toString().equalsIgnoreCase(""))
                {
                    Toast.makeText(ChatActivity.this, "Please write comment", Toast.LENGTH_SHORT).show();
                }
                else {

                    try{
                        JSONObject mJsonObject = new JSONObject();
                        mJsonObject.put("subject","");
                        mJsonObject.put("message",mTextMsgWrite.getText().toString());
                        mJsonObject.put("From","");
                        mJsonObject.put("email","[]");
                        mJsonObject.put("Cc","[]");
                        mJsonObject.put("Bcc","[]");
                        mJsonObject.put("contact","[]");
                        mJsonObject.put("server_task_id",mOtherData.getServer_task_id());
                        mJsonObject.put("checksheet_id","0");
                        mJsonObject.put("step_id","0");
                        mJsonObject.put("que_id","0");
                        mJsonObject.put("client_request_id",mUserData.getUserid()+"-"+System.currentTimeMillis());

                      String Responsetext =  WebApiCallJitsiMeet.ExecuteNetworkRequest(mJsonObject,mOtherData.getCommon_Wcf_Url(),METHOD_NAME_SendMsg,mUserData);
                        if(Responsetext != null)
                        {
                            String status = null;
                            String message = null;
                            JSONArray jsonArray1 = new JSONArray(Responsetext);
                            for (int k = 0; k < jsonArray1.length(); k++) {
                                JSONObject jsonObject = jsonArray1.getJSONObject(0);
                               status = jsonObject.getString("status");
                                message = jsonObject.getString("message");
                               
                            }
                            if(status.equalsIgnoreCase("1"))
                            {
                                progressBar.setVisibility(View.GONE);
                                mTextMsgWrite.setText("");
                                messageHistoryAdapter.notifyDataSetChanged();
                            }
                            else if (status.equalsIgnoreCase("3") || status.equalsIgnoreCase("5")){
                                Toast.makeText(ChatActivity.this, message, Toast.LENGTH_SHORT).show();
                            }
                        }
                        else {

                        }
                    }
                    catch (Exception e)
                    {

                    }

                }

            }
        });
    }

    private void GetTaskBasicDataWith()
    {
        try {
            String mFlow_id = sharedPreferences.getString("Flow_id","");
            String requestPayload = "{ \"key\": \"isdelete\", \"value\": 0 }, { \"key\": \"parenttaskid\", \"value\": \"" + mOtherData.getServer_task_id() + "\" }, { \"key\": \"flow_id\", \"value\": \"" + mFlow_id + "\" }";


            String Responsetext =  WebApiCallJitsiMeet.ExecuteNetworkStringRequest(requestPayload,mOtherData.getCommon_Wcf_Url(),METHOD_NAME_GetTaskData,mUserData);

            if(Responsetext != null)
            {
                String status = null;
                JSONArray jsonArray1 = new JSONArray(Responsetext);
                for (int k = 0; k < jsonArray1.length(); k++) {
                    JSONObject jsonObject = jsonArray1.getJSONObject(0);
                    status = jsonObject.getString("status");

                }
                if(status.equalsIgnoreCase("1"))
                {

                }


                GetDataFromMobile();
            }
            else {
                Toast.makeText(ChatActivity.this, "Response Getting null", Toast.LENGTH_SHORT).show();
            }
        }
        catch (Exception e)
        {

        }
    }

    public void callRecycleview()
    {

        progressBar.setVisibility(View.GONE);
        mRecyclerViewChatHistory.setVisibility(View.VISIBLE);
        messageHistoryAdapter = new MessageHistoryAdapter(ChatActivity.this,mArrayChatList);
        RecyclerView.LayoutManager layoutManager = new LinearLayoutManager(getApplicationContext());
        mRecyclerViewChatHistory.setLayoutManager(layoutManager);
        mRecyclerViewChatHistory.setAdapter(messageHistoryAdapter);

    }


    private void  GetDataFromMobile()
    {

        try {
            JSONObject mJsonObject = new JSONObject();
            mJsonObject.put("server_task_id", mOtherData.getServer_task_id());
            mJsonObject.put("step_id", "0");
            mJsonObject.put("checksheet_id", "0");
            mJsonObject.put("que_id", "0");

            String Responsetext =  WebApiCallJitsiMeet.ExecuteNetworkRequest(mJsonObject,mOtherData.getCommon_Wcf_Url(),METHOD_NAME_GetDataFromMobile,mUserData);

            if(Responsetext != null)
            {
                String status = null;
                JSONObject jsonObject =null;
                JSONArray jsonArray1 = new JSONArray(Responsetext);
                for (int k = 0; k < jsonArray1.length(); k++) {
                    jsonObject = jsonArray1.getJSONObject(0);
                    status = jsonObject.getString("status");

                }
                if(status.equalsIgnoreCase("1"))
                {

                    String Data = jsonObject.getString("data");
                    JSONArray mJsonArray = new JSONArray(Data);

                    for(int i=0; i < mJsonArray.length(); i++)
                    {
                        Chatmsglist mChatmsglist = new Chatmsglist();

                        JSONObject mObject = mJsonArray.getJSONObject(i);

                        mChatmsglist.setSubject(mObject.getString("subject"));
                        mChatmsglist.setFrom(mObject.getString("from"));
                        mChatmsglist.setBody(mObject.getString("body"));
                        mChatmsglist.setCreatedate(mObject.getString("createdate"));
                        mChatmsglist.setEmail_json(mObject.getString("email_json"));
                        mChatmsglist.setTo(mObject.getString("email_json"));
                        mChatmsglist.setCC(mObject.getString("json_cc"));
                        mChatmsglist.setBCC(mObject.getString("json_bcc"));


                        Date d = new Date(mObject.getString("createdate"));
                        String comment_ms = String.valueOf(d.getTime());

                        mChatmsglist.setStatus_millisecond(comment_ms);
                        String activity_type;
                        if (mObject.getString("email_json").equalsIgnoreCase(" ") || mObject.getString("email_json").equalsIgnoreCase("null")) {
                             activity_type = "comment";
                        }
                        else {
                            activity_type = "email";
                        }
                        mChatmsglist.setActivity_type(activity_type);


                        mArrayChatList.add(mChatmsglist);

                    }

                }
                GetHistory();
            }
            else {
                GetHistory();
                Toast.makeText(ChatActivity.this, "Response Getting null", Toast.LENGTH_SHORT).show();
            }
        }
        catch (Exception e)
        {

        }
    }



    private void GetHistory()
    {
        try {
            JSONObject mJsonObject = new JSONObject();
            mJsonObject.put("task_id", mOtherData.getServer_task_id());
            mJsonObject.put("millisecond","0");

            String Responsetext =  WebApiCallJitsiMeet.ExecuteNetworkRequest(mJsonObject,mOtherData.getCommon_Wcf_Url(),METHOD_NAME_History,mUserData);
            if(Responsetext != null)
            {
                progressBar.setVisibility(View.GONE);
                String status = null;
                JSONArray jsonArray1 = new JSONArray(Responsetext);
                JSONObject jsonObject = null;
                for (int k = 0; k < jsonArray1.length(); k++) {
                    jsonObject = jsonArray1.getJSONObject(0);
                    status = jsonObject.getString("status");

                }
                if(status.equalsIgnoreCase("1"))
                {

                    String Data = jsonObject.getString("data");
                    JSONArray mJsonArray = new JSONArray(Data);
                    String prev_status_name;
                    for(int i=0; i < mJsonArray.length(); i++) {
                        JSONObject mObject = mJsonArray.getJSONObject(i);
                        Chatmsglist mChatmsglist = new  Chatmsglist();
                        flow_id = mObject.getString("flow_id");
                        mChatmsglist.setUsername(mObject.getString("UserName"));
                        mChatmsglist.setStatus_Name(mObject.getString("Status_Name"));
                        mChatmsglist.setActivity_type("status_change");

                        Date d = new Date(mObject.getString("date"));
                        String Date =formatAMPM(d);
                        mChatmsglist.setDate(Date);

                        if (i == mJsonArray.length() - 1) {
                            prev_status_name = "";
                        }
                        else {
                            prev_status_name = mJsonArray.getJSONObject(i + 1).getString("Status_Name");
                        }

                        mChatmsglist.setPrev_Status_Name(prev_status_name);
                        mChatmsglist.setStatus_millisecond(String.valueOf(d.getTime()));

                        mArrayChatList.add(mChatmsglist);
                    }
                    mEditor.putString("Flow_id",flow_id);
                    mEditor.commit();

                }

                callRecycleview();
            }
            else {
                Toast.makeText(ChatActivity.this, "Response Getting null", Toast.LENGTH_SHORT).show();
            }
        }
        catch (Exception e)
        {

        }
    }



    public static String formatAMPM(Date date) {
        String[] monthArray = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};

        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);

        int hours = calendar.get(Calendar.HOUR_OF_DAY);
        int minutes = calendar.get(Calendar.MINUTE);
        String ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours != 0 ? hours : 12; // the hour '0' should be '12'
        String formattedMinutes = minutes < 10 ? "0" + minutes : String.valueOf(minutes);

        long ms = date.getTime();
        long todayMs = System.currentTimeMillis();
        long diffMs = todayMs - ms;
        if (diffMs > 86400000) {
            int day = calendar.get(Calendar.DAY_OF_MONTH);
            String month = monthArray[calendar.get(Calendar.MONTH)];

            return day + " " + month + " " + hours + ":" + formattedMinutes + " " + ampm;
        } else {
            int diffHours = (int) (diffMs / 3600000);
            if (diffHours > 1) {
                return diffHours + " hours ago";
            } else if (diffHours == 1) {
                return diffHours + " hour ago";
            } else {
                int diffMinutes = (int) (diffMs / 60000);
                if (diffMinutes > 1) {
                    return diffMinutes + " min ago";
                } else if (diffMinutes == 1) {
                    return "1 min ago";
                } else {
                    int seconds = (int) ((diffMs % 60000) / 1000);
                    if (seconds < 1) {
                        seconds = 1;
                    }
                    return seconds + " seconds ago";
                }
            }
        }
    }
}