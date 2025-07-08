package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.StrictMode;
import android.provider.ContactsContract;
import android.view.Gravity;
import android.view.View;
import android.webkit.WebView;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.sky.atc.easyformse.datautils.MySharedPreferences;

import net.sqlcipher.database.SQLiteDatabase;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

import io.michaelrocks.paranoid.Obfuscate;


//To whatsapp activity
@Obfuscate
public class OpenWhatsappActivity extends Activity {

    Intent mIntent;
    static final int ACTIVATION_REQUEST_code = 101;
    String MobileNo;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.whatsapp_activity);

        mIntent = getIntent();
        MobileNo = mIntent.getStringExtra("MobileNo");
        checkpermission();
    }
    void checkpermission() {
        if (ContextCompat.checkSelfPermission(OpenWhatsappActivity.this, Manifest.permission.CALL_PHONE)
                + ContextCompat.checkSelfPermission(OpenWhatsappActivity.this, Manifest.permission.READ_CONTACTS)
                != PackageManager.PERMISSION_GRANTED) {

            if (ActivityCompat.shouldShowRequestPermissionRationale(OpenWhatsappActivity.this, Manifest.permission.CALL_PHONE) &&
                    ActivityCompat.shouldShowRequestPermissionRationale(OpenWhatsappActivity.this, Manifest.permission.READ_CONTACTS)

            ) {
            } else {

                ActivityCompat.requestPermissions(OpenWhatsappActivity.this,
                        new String[]{Manifest.permission.CALL_PHONE,
                                Manifest.permission.READ_CONTACTS,
                        },
                        ACTIVATION_REQUEST_code);
            }
        } else {

            startWhatsapp();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           String permissions[], int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == ACTIVATION_REQUEST_code) {// If request is cancelled, the result arrays are empty.
            if (grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED
                    && grantResults[1] == PackageManager.PERMISSION_GRANTED) {

                startWhatsapp();

            } else {

                final AlertDialog.Builder builder = new AlertDialog.Builder(this);
                builder.setMessage("Contact permission denied");
                builder.setPositiveButton("OK", null);
                builder.show();

                checkpermission();

            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == 101) {

            if (resultCode == RESULT_OK) {
                Bundle b = new Bundle();
                Intent intent = new Intent();
                intent.putExtras(b);
                setResult(RESULT_OK, intent);
                finish();

            } else {

                Bundle b = new Bundle();
                Intent intent = new Intent();
                intent.putExtras(b);
                setResult(RESULT_CANCELED, intent);
                finish();
            }

        }
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();
        finish();
    }

    @SuppressLint("Range")
    public void startWhatsapp()
    {
        try {


            Cursor cursor = context.getContentResolver ()
                    .query (
                            ContactsContract.Data.CONTENT_URI,
                            new String [] { ContactsContract.Data._ID },
                            ContactsContract.RawContacts.ACCOUNT_TYPE + " = 'com.whatsapp' " +
                                    "AND " + ContactsContract.Data.MIMETYPE + " = 'vnd.android.cursor.item/vnd.com.whatsapp.video.call' " +
                                    "AND " + ContactsContract.CommonDataKinds.Phone.NUMBER + " LIKE '%" + MobileNo + "%'",
                            null,
                            ContactsContract.Contacts.DISPLAY_NAME
                    );


            long id = 0;
            while (cursor.moveToNext()) {
                id = cursor.getLong(cursor.getColumnIndex(ContactsContract.Data._ID));
            }

            if (!cursor.isClosed ()) {
                cursor.close ();
            }
//            if id 0(0 means contact no not save) whatsapp chat window display otherwise send whatsapp video call
            if(id == 0)
            {
                Intent launchIntent = new Intent(Intent.ACTION_VIEW);
                launchIntent.setData(Uri.parse("whatsapp://send?phone=+91"+ MobileNo));
                startActivityForResult(launchIntent,101);
            }
            else {
                Intent intent = new Intent();
                intent.setAction(Intent.ACTION_VIEW);
                String uriString = "content://com.android.contacts/data/" + id;
                intent.setDataAndType(Uri.parse(uriString), "vnd.android.cursor.item/vnd.com.whatsapp.voip.call");
                intent.setPackage("com.whatsapp");
                startActivityForResult(intent,101);

            }

        } catch (Exception e) {
            e.printStackTrace();
//            Toast.makeText(context, "Whatsapp app not installed in your phone", Toast.LENGTH_SHORT).show();
        }
    }
}

