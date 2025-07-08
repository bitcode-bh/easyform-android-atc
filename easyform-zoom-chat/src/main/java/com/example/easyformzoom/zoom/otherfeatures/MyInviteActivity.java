package com.example.easyformzoom.zoom.otherfeatures;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.widget.EditText;
import android.widget.TextView;

import com.example.easyformzoom.R;

import us.zoom.androidlib.utils.ZmMimeTypeUtils;


public class MyInviteActivity extends Activity {
	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.invite_activity);
		
		TextView txtUrl = findViewById(R.id.txtUrl);
		TextView txtSubject = findViewById(R.id.txtSubject);
		TextView txtMeetingId = findViewById(R.id.txtMeetingId);
		TextView txtPassword = findViewById(R.id.txtPassword);
		TextView txtRawPassword = findViewById(R.id.txtRawPassword);
		EditText edtText = findViewById(R.id.edtText);
		
		Intent intent = getIntent();
		Uri uri = intent.getData();
		
		if(uri != null)
			txtUrl.setText("URL:" + uri.toString());
		
		String subject = intent.getStringExtra(ZmMimeTypeUtils.EXTRA_SUBJECT);
		if(subject != null)
			txtSubject.setText("Subject: " + subject);
		
		long meetingId = intent.getLongExtra(ZmMimeTypeUtils.EXTRA_MEETING_ID, 0);
		if(meetingId > 0)
			txtMeetingId.setText("Meeting ID: " + meetingId);
		Log.d("##MEETINGID", String.valueOf(meetingId));
		
		String meetingPassword = intent.getStringExtra(ZmMimeTypeUtils.EXTRA_MEETING_PSW);
		if(meetingPassword != null)
			txtPassword.setText("Password: " + meetingPassword);
		Log.d("##MEETING_RAWPASSWORD", String.valueOf(meetingPassword));
		
		String meetingRawPassword = intent.getStringExtra(ZmMimeTypeUtils.EXTRA_MEETING_RAW_PSW);
		if(meetingRawPassword != null)
			txtRawPassword.setText("Raw Password: " + meetingRawPassword);
		Log.d("##MEETING_RAWPASSWORD", String.valueOf(meetingRawPassword));

		
		String text = intent.getStringExtra(ZmMimeTypeUtils.EXTRA_TEXT);
		if(text != null)
			edtText.setText(text);
	}

}
