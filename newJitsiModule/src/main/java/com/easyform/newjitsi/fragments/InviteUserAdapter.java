package com.easyform.newjitsi.fragments;

import static android.content.Context.MODE_PRIVATE;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;

import com.easyform.newjitsi.R;
import com.easyform.newjitsi.activitys.chat.WebApiCallJitsiMeet;
import com.easyform.newjitsi.network.Models.OtherData;
import com.easyform.newjitsi.network.Models.UserData;
import com.easyform.newjitsi.network.response.users.EasyFromUser;
import com.easyform.newjitsi.utils.Utils;
import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class InviteUserAdapter extends ArrayAdapter<InviteListItem> {

    private final List<InviteListItem> itemList;
    private final LayoutInflater inflater;
    private final InviteClickListener listener;
    private final Map<String, Long> inviteTimestamps = new HashMap<>();
    SharedPreferences sharedPreferences;
    SharedPreferences.Editor editor;

    private final Map<String, Runnable> pendingTimeoutTasks = new HashMap<>();
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final String METHOD_GETGID = "WCF_getGCMdataByUsername";
    Bundle extras;
    private final Gson mGson = new Gson();
    public interface InviteClickListener {
        void onInviteClicked(EasyFromUser user);
    }

    public InviteUserAdapter(Context context, List<InviteListItem> items, Bundle extras, InviteClickListener listener) {
        super(context, 0, items);
        this.itemList = items;
        this.inflater = LayoutInflater.from(context);
        this.listener = listener;
        this.extras = extras;
    }

    @Override
    public int getItemViewType(int position) {
        return itemList.get(position).getType();
    }

    @Override
    public int getViewTypeCount() {
        return 2; // Header and User
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        InviteListItem item = itemList.get(position);

        if (item.getType() == InviteListItem.TYPE_HEADER) {
            if (convertView == null) {
                convertView = inflater.inflate(R.layout.item_invite_header, parent, false);
            }
            TextView txtHeader = convertView.findViewById(R.id.txtHeader);
            txtHeader.setText(item.getHeaderTitle());
        } else {
            if (convertView == null) {
                convertView = inflater.inflate(R.layout.item_user_invite, parent, false);
            }

            EasyFromUser user = item.getUser();
            TextView txtUsername = convertView.findViewById(R.id.txtUsername);
            ImageView btnInvite = convertView.findViewById(R.id.btnInvite);
            TextView txtStatus = convertView.findViewById(R.id.txtStatus);

            txtUsername.setText(user.getUsername());

            txtStatus.setVisibility(View.GONE);
            txtStatus.setText("");
            btnInvite.setVisibility(View.VISIBLE);
            btnInvite.setOnClickListener(null);

            if (item.isAlreadyInvited()) {


                sharedPreferences = getContext().getSharedPreferences("Jitsiuser", MODE_PRIVATE);
                String rejectnoti = sharedPreferences.getString("rejectnoti", "");

                if (item.getUser().getUsername().equalsIgnoreCase(rejectnoti)) {
                    txtStatus.setText(" [ Rejected ] ");
                    txtStatus.setVisibility(View.VISIBLE);

                } else {
                    txtStatus.setText(" [ " + item.getStatus() + " ] ");
                }

                txtStatus.setVisibility(View.VISIBLE);

                if ("Joined".equalsIgnoreCase(item.getStatus())) {
                    btnInvite.setVisibility(View.GONE);
                }
                // Only hide button if Joined
                if ("Joined".equalsIgnoreCase(item.getStatus())) {
                    btnInvite.setVisibility(View.GONE);
                } else {
                    btnInvite.setVisibility(View.VISIBLE);

                    btnInvite.setOnClickListener(v -> {

                        try{
                            editor = sharedPreferences.edit();
                            editor.putString("rejectnoti", "");
                            editor.commit();

                            Toast.makeText(getContext(), "Re-invited " + user.getUsername(), Toast.LENGTH_SHORT).show();
                            String response = GetGIDByUserName(user.getUsername());
                            if(response != null)
                            {
                                JSONArray mjsonArray = new JSONArray(response);
                                JSONObject firstObject = mjsonArray.getJSONObject(0);
                               String gid = firstObject.getString("GID");
                               String  EmailId = firstObject.getString("EmailId");
                                user.setFcmid(gid);
                                user.setEmailId(EmailId);
                            }

                            listener.onInviteClicked(user);
                            item.setStatus("Request Sent");
                            notifyDataSetChanged();

                            cancelPreviousTimeout(user.getUsername());
                            scheduleTimeout(user.getUsername(), item);
                        }
                        catch ( Exception e)
                        {
                            Log.d("exception",e.toString());
                        }

                    });
                    cancelPreviousTimeout(user.getUsername());
                    scheduleTimeout(user.getUsername(), item);
                }
            } else {
                btnInvite.setVisibility(View.VISIBLE);
                btnInvite.setOnClickListener(v -> {

                    try{
                        Toast.makeText(getContext(), "Re-invited " + user.getUsername(), Toast.LENGTH_SHORT).show();
                        String response = GetGIDByUserName(user.getUsername());
                        if(response != null)
                        {
                            JSONArray mjsonArray = new JSONArray(response);
                            JSONObject firstObject = mjsonArray.getJSONObject(0);
                            String gid = firstObject.getString("GID");
                            String  EmailId = firstObject.getString("EmailId");
                            user.setFcmid(gid);
                            user.setEmailId(EmailId);
                        }

                        listener.onInviteClicked(user);
                        item.setAlreadyInvited(true);
                        item.setStatus("Request Sent");

                        itemList.remove(position);

                        int invitedHeaderIndex = -1;
                        for (int i = 0; i < itemList.size(); i++) {
                            InviteListItem it = itemList.get(i);
                            if (it.getType() == InviteListItem.TYPE_HEADER
                                    && "Invited Users".equals(it.getHeaderTitle())) {
                                invitedHeaderIndex = i;
                                break;
                            }
                        }


                        if (invitedHeaderIndex == -1) {
                            itemList.add(0, new InviteListItem(InviteListItem.TYPE_HEADER, "Invited Users", null, false, ""));
                            itemList.add(1, item);
                        } else {
                            itemList.add(invitedHeaderIndex + 1, item);
                        }


                        boolean hasOther = false;
                        for (InviteListItem it : itemList) {
                            if (it.getType() == InviteListItem.TYPE_USER && !it.isAlreadyInvited()) {
                                hasOther = true;
                                break;
                            }
                        }
                        if (!hasOther) {
                            for (int i = 0; i < itemList.size(); i++) {
                                InviteListItem it = itemList.get(i);
                                if (it.getType() == InviteListItem.TYPE_HEADER
                                        && "Other Users".equals(it.getHeaderTitle())) {
                                    itemList.remove(i);
                                    break;
                                }
                            }
                        }

                        notifyDataSetChanged();

                        cancelPreviousTimeout(user.getUsername());
                        scheduleTimeout(user.getUsername(), item);
                    }
                    catch (Exception e)
                    {

                    }



                });
            }
        }

        return convertView;
    }


    private void cancelPreviousTimeout(String username) {
        Runnable oldRunnable = pendingTimeoutTasks.remove(username);
        if (oldRunnable != null) {
            handler.removeCallbacks(oldRunnable);
        }
    }

    private void scheduleTimeout(String username, InviteListItem item) {
        Runnable timeoutRunnable = () -> {
            if (!"Joined".equalsIgnoreCase(item.getStatus())) {
                item.setStatus("Not Joined");
                notifyDataSetChanged();
            }
        };
        pendingTimeoutTasks.put(username, timeoutRunnable);
        handler.postDelayed(timeoutRunnable, 30000);
    }


    public String GetGIDByUserName(String Username)
    {
        try {

            String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");
            OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);
            UserData mUserData = mGson.fromJson(loginUserDataString, UserData.class);

            JSONObject data = new JSONObject();
            data.put("username", Username);
            data.put("company_id", mUserData.getCompanyId());

            String restext = WebApiCallJitsiMeet.ExecuteNetworkRequest(data, mOtherData.getCommon_Wcf_Url(), METHOD_GETGID, mUserData);


            JSONArray jsonArray = null;
            String Status = null;
            String message = null;

            String receivertoken = null;
            jsonArray = new JSONArray(restext);
            JSONObject jsonObject = jsonArray.getJSONObject(0);
            Status = jsonObject.getString("status");
            message = jsonObject.getString("message");

            if (Status.equalsIgnoreCase("1")) {

                receivertoken = jsonObject.getString("data");




            }
            else {
                if (Status.equalsIgnoreCase("3") || Status.equalsIgnoreCase("5")){
                    Toast.makeText(getContext(), "APi : " + METHOD_GETGID + "\n" + message, Toast.LENGTH_SHORT).show();
                    return null;
                }
            }
            return receivertoken;

        } catch (Exception e) {

        }
        return null;
    }

}


