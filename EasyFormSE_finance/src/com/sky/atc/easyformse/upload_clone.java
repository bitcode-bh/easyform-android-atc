package com.sky.atc.easyformse;

import java.util.ArrayList;
import java.util.HashMap;

import org.json.JSONArray;
import org.json.JSONObject;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import android.os.Build;

import androidx.annotation.RequiresApi;
import androidx.core.app.NotificationCompat;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.utils.Utils;

import io.michaelrocks.paranoid.Obfuscate;

import static androidx.core.app.NotificationCompat.PRIORITY_LOW;
import static androidx.core.app.NotificationCompat.PRIORITY_MIN;

//upload files
@Obfuscate
public class upload_clone extends WakefulIntentService {

	SQLiteDatabase database;
	String lat = null;
	String lng = null;
	String radius = null;
	String fileid = null;
	String d_url = null;
	String filename = null, nick;
	Cursor c;
	String time;
	int p_f, f_f;
	HashMap<String, String> m = new HashMap<>();
	ArrayList<JSONObject> list = new ArrayList<>();
	JSONArray jsonArray1 = new JSONArray();

	//WCF URL
	private static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL);
	private static final String METHOD_NAME_corner13 = "WCF_InsertApplicationUserLog";

	public upload_clone() {
		super("f_upload1");
		// TODO Auto-generated constructor stub
	}

	@Override
	protected void doWakefulWork(Intent arg0) {

		showNotificationstartForeground();

		if (sqlitewraper.internetflag == 1) {
			database = sqlitewraper.getDatabase();
			c = database
					.rawQuery(
							"Select uid,Siteid,chckid,servertaskid,stepid,ques_id,f_name,f_key,f_type,p_name,pid,ERROR,type,username,uid,SERVER_Error,status,time from upload_file_clone where flag='0' ",
							null);
			c.moveToFirst();
			int count = c.getCount();
			if (c.getCount() > 0) {
				for (int i = 0; i < c.getCount(); i++) {
					try {

						int tid = c.getInt(0);
						String siteid = c.getString(1);
						int checksheetid = c.getInt(2);
						int server_task_id = c.getInt(3);
						int step = c.getInt(4);
						int ques_id = c.getInt(5);
						String f_name = c.getString(6);
						String f_key = c.getString(7);
						String f_type = c.getString(8);
						String p_name = c.getString(9);
						int pid = c.getInt(10);
						String Error = c.getString(11);
						String Type = c.getString(12);
						String username = c.getString(13);
						int uid = c.getInt(14);
						String S_Message = c.getString(15);
						int status = c.getInt(16);
						time = c.getString(17);

						JSONObject data1 = new JSONObject();

						data1.put("tid", tid);
						data1.put("username", username);
						data1.put("Siteid", siteid);
						data1.put("checkid", checksheetid);
						data1.put("servertaskid", server_task_id);
						data1.put("stepid", step);
						data1.put("ques_id", ques_id);
						data1.put("f_name", f_name);
						data1.put("f_key", f_key);
						data1.put("f_type", f_type);
						data1.put("p_name", p_name);
						data1.put("pid", pid);
						data1.put("Error", Error);
						data1.put("Type", Type);
						data1.put("time", time);
						data1.put("CompanyId", status);

						data1.put("servermessage", S_Message);
						data1.put("status", status);

						String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestfile(data1, WCFURL, METHOD_NAME_corner13, data1);


						JSONArray jsonArray = new JSONArray(restext);
						String status1 = null;
						String message="";
						for (int k1 = 0; k1 < jsonArray.length(); k1++) {
							JSONObject jsonObject = jsonArray.getJSONObject(0);
							status1 = jsonObject.getString("status");
							if (jsonObject.has("message")) {
								message = jsonObject.getString("message");
							}
						}
						if (status1.equalsIgnoreCase("1")) {
							{
								String t;
								t = "uid='" + uid + "'";
								ContentValues t_i = new ContentValues();
								t_i.put("flag", 2);
								t_i.put("ERROR", "Success");
								long task = database.update(
										"upload_file_clone", t_i, t, null);

								c.moveToNext();
							}
						}else if (status1.equalsIgnoreCase("4")) {
							Utils.logoutUser(message);
						}
					} catch (Exception ignored) {

					}
				}
			}
			c.close();
		}
	}


	private void showNotificationstartForeground(){

		NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
		String channelId = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ? createNotificationChannel(notificationManager) : "";
		NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, channelId);
		Notification notification = notificationBuilder.setOngoing(true)
				.setSmallIcon(R.drawable.atc_logo)
				.setPriority(PRIORITY_MIN)
				.setContentTitle("Data Backup")
				.setCategory(NotificationCompat.CATEGORY_SERVICE)
				.build();
		startForeground(1037, notification);
	}


	@SuppressLint("WrongConstant")
	@RequiresApi(Build.VERSION_CODES.O)
	private String createNotificationChannel(NotificationManager notificationManager){
		String channelId = "my_channel_01";
		String channelName = "My_channle";
		NotificationChannel channel = new NotificationChannel(channelId, channelName, NotificationManager.IMPORTANCE_LOW);
		channel.setImportance(NotificationManager.IMPORTANCE_LOW);
		channel.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
		notificationManager.createNotificationChannel(channel);
		return channelId;
	}

}