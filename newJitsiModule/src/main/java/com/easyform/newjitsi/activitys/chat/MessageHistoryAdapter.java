package com.easyform.newjitsi.activitys.chat;

import static com.easyform.newjitsi.activitys.chat.ChatActivity.formatAMPM;

import android.content.Context;
import android.text.Html;
import android.text.Spanned;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.easyform.newjitsi.R;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;

/**
 * Created by NareshChocha on 10/13/2023.
 *
 * @author NareshChocha
 */
public class MessageHistoryAdapter extends RecyclerView.Adapter<MessageHistoryAdapter.MyViewHolder>{

    ArrayList<Chatmsglist> mArrayList;
    Context  mContext;
    public MessageHistoryAdapter(ChatActivity chatActivity, ArrayList<Chatmsglist> mListMessage) {
        this.mArrayList = mListMessage;
        this.mContext = chatActivity;
    }

    @NonNull
    @Override
    public MyViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.row_item_message, parent, false);
        return new MyViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull MyViewHolder holder, int position) {

        if(mArrayList.get(position).getActivity_type().equalsIgnoreCase("status_change"))
        {
            int n = mArrayList.get(position).getDate().indexOf("ago");
            String datetime_str;
            if (n > -1) {
                String time_str = mArrayList.get(position).getDate().replace(" ago", "");
                datetime_str = time_str + "<br> ago";
            } else {
                int t = getPosition(mArrayList.get(position).getDate(), " ", 2);
                String date_str = mArrayList.get(position).getDate().substring(0, t);
                String time_str = mArrayList.get(position).getDate().substring(t, mArrayList.get(position).getDate().length());
                datetime_str = date_str + "<br> <small>" + time_str + "</small>";
            }
            holder.mTextViewDateTime.setText(Html.fromHtml(datetime_str));


            String str;
            if (mArrayList.get(position).getPrev_Status_Name().equals("")) {
                str = "<b>" + mArrayList.get(position).getUsername() + "</b> added this task to " + mArrayList.get(position).getStatus_Name();

            } else {
                str = "<b" + mArrayList.get(position).getUsername() + "</b> moved this task from " + mArrayList.get(position).getPrev_Status_Name() + " to " + mArrayList.get(position).getStatus_Name();

            }
            holder.mTextViewEmailId.setText(Html.fromHtml(str));

        }

        else if(mArrayList.get(position).getActivity_type().equalsIgnoreCase("comment"))
        {
            Date d = null;
            String modified_date;
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                d = sdf.parse(mArrayList.get(position).getCreatedate());
                 modified_date = formatAMPM(d);
            } catch (ParseException e) {
                throw new RuntimeException(e);
            }

            int n = modified_date.indexOf("ago");
            String datetime_str;
            if (n > -1) {
                String time_str = modified_date.replace(" ago", "");
                 datetime_str =  time_str + "<br> <small>ago</small> ";
            } else {
                int t = getPosition(modified_date, " ", 2);
                String date_str = modified_date.substring(0, t);
                String time_str = modified_date.substring(t, modified_date.length());
                 datetime_str =  date_str + "<br> <small>" + time_str + "</small>";
            }

            boolean html = isStringHtml(mArrayList.get(position).getBody());
            String comment_html;
            if (html) {
                comment_html = mArrayList.get(position).getBody();
            } else {
                comment_html =Html.fromHtml(mArrayList.get(position).getBody(), Html.FROM_HTML_MODE_LEGACY).toString();
            }

            holder.mTextViewDateTime.setText(Html.fromHtml(datetime_str));
            holder.mTextViewEmailId.setText(mArrayList.get(position).getSubject());
            holder.mTextViewMsg.setVisibility(View.VISIBLE);
            holder.mTextViewMsg.setText(comment_html);
        }
        else if(mArrayList.get(position).getActivity_type().equalsIgnoreCase("email"))
        {

            Date d = new Date(mArrayList.get(position).getCreatedate());
            String modified_date = formatAMPM(d);

            int n = modified_date.indexOf("ago");
            String datetime_str;
            if (n > -1) {
                String time_str = modified_date.replace(" ago", "");
                datetime_str = time_str + "<br> <small>ago</small>";
            } else {
                int t = getPosition(modified_date, " ", 2);
                String date_str = modified_date.substring(0, t);
                String time_str = modified_date.substring(t, modified_date.length());
                datetime_str = date_str + "<br> <small>" + time_str + "</small>";
            }


            boolean html = isStringHtml(mArrayList.get(position).getBody());
            String comment_html;
            if (html) {
                comment_html = mArrayList.get(position).getBody();
            } else {
                comment_html =Html.fromHtml(mArrayList.get(position).getBody(), Html.FROM_HTML_MODE_LEGACY).toString();
            }


            String count = "";
            if (comment_html.indexOf("<p>", 1) > -1) {
                int end_index = comment_html.indexOf("<details", 1);
                comment_html = comment_html.substring(0, end_index);
                count = Integer.toString(mArrayList.get(position).getBody().split("<details").length - 1);
            }

            String short_username = "";
            String comment_username = mArrayList.get(position).getFrom();
            if (comment_username == null || comment_username.isEmpty()) { }
            else {
                String[] name_Array = comment_username.split("\\.");
                for (int s = 0; s < name_Array.length; s++) {
                    short_username += name_Array[s].charAt(0);
                }
            }
           // holder.mTextViewShortName.setText(short_username.toUpperCase());
            holder.mTextViewDateTime.setText(Html.fromHtml(datetime_str, Html.FROM_HTML_MODE_LEGACY).toString());
            holder.mTextViewMsg.setVisibility(View.VISIBLE);
            holder.mTextViewMsg.setText(comment_html);
            holder.mTextViewEmailId.setText(mArrayList.get(position).getFrom().toLowerCase());
            holder.mTextViewHeading.setVisibility(View.VISIBLE);
            holder.mTextViewHeading.setText(Html.fromHtml(mArrayList.get(position).getSubject() + "<b>" +count+"</b>",Html.FROM_HTML_MODE_LEGACY).toString());
        }

    }

    @Override
    public int getItemCount() {
        return mArrayList.size();
    }

    public static class MyViewHolder extends RecyclerView.ViewHolder {

        TextView mTextViewShortName;
        TextView mTextViewEmailId;
        TextView mTextViewMsg;
        TextView mTextViewHeading;
        TextView mTextViewDateTime;
        public MyViewHolder(View itemView) {
            super(itemView);

         //   mTextViewShortName = itemView.findViewById(R.id.tv_shortname);
            mTextViewEmailId = itemView.findViewById(R.id.tv_EmailId);
            mTextViewHeading = itemView.findViewById(R.id.tv_Heading);
            mTextViewMsg = itemView.findViewById(R.id.tv_CommentMsg);
            mTextViewDateTime = itemView.findViewById(R.id.tv_DateAndTime);
        }
    }

    public static int getPosition(String string, String subString, int index) {
        String[] parts = string.split(subString, index + 1);
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < index; i++) {
            result.append(parts[i]).append(subString);
        }
        return result.length();
    }

    private boolean isStringHtml(String content) {
        Spanned spanned = Html.fromHtml(content);
        String plainText = spanned.toString();
        return !plainText.equals(content);
    }
}
