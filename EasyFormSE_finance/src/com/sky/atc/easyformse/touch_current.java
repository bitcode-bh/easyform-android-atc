package com.sky.atc.easyformse;


import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Its not calling
@StringFogIgnore
public class touch_current extends BroadcastReceiver {
	SQLiteDatabase database;

	@Override
	public void onReceive(Context context, Intent intent) {

		database = sqlitewraper.getDatabase();

		Cursor c = database
				.rawQuery(
						"SELECT lat,lon,address, c_accuracy,date_s  FROM  track_master WHERE   _id = (SELECT MAX(_id) FROM track_master);",
						null);
		c.moveToFirst();
		if (c.getCount() > 0) {
			String lat = c.getString(0);
			String lon = c.getString(1);
			String add = c.getString(2);
			String accuracy = c.getString(3);
			String date = c.getString(4);

			Intent i_ser = new Intent(sqlitewraper.context, touch_server.class);
			i_ser.putExtra("lat", lat);
			i_ser.putExtra("long", lon);
			i_ser.putExtra("address", add);
			i_ser.putExtra("accuracy",accuracy);
			i_ser.putExtra("Date", date);
			WakefulIntentService.sendWakefulWork(sqlitewraper.context, i_ser);

		}
	}
}