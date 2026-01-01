package com.easyform.newjitsi.activitys.chat;

import android.annotation.SuppressLint;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.easyform.newjitsi.R;

public class CommentFragment extends Fragment {


    private static final String ARG_ROLE_ID = "arg_role_id";
    private static final String ARG_TASK_ID = "arg_task_id";

    public static CommentFragment newInstance(String roleId, String taskId) {
        CommentFragment fragment = new CommentFragment();
        Bundle args = new Bundle();
        args.putString(ARG_ROLE_ID, roleId);
        args.putString(ARG_TASK_ID, taskId);
        fragment.setArguments(args);
        return fragment;
    }

    @Nullable
    @Override
    @SuppressLint("MissingInflatedId")
    public View onCreateView(@NonNull LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_chat, container, false);

      WebView webView = view.findViewById(R.id.webView_comment);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.setWebViewClient(new WebViewClient());

        Bundle args = getArguments();
        if (args != null) {
            String roleId = args.getString(ARG_ROLE_ID);
            String taskId = args.getString(ARG_TASK_ID);

            // Build the URL (be careful about encoding special characters)
            String url = "https://dev.easyform.in/web/pages/EF_Port_App_CommentUI.aspx"
                    + "?hdr=" + Uri.encode(roleId)
                    + "&menu=0"
                    + "&header=0"
                    + "&flow_id=0"
                    + "&task_id=" + Uri.encode(taskId);

            webView.loadUrl(url);
        }

        return view;
    }
}
