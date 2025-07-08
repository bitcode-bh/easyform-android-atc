package com.sky.atc.easyformse;
import java.io.*;
import java.net.URI;

import android.content.*;
import android.database.*;
import android.net.*;
import android.os.*;

import io.michaelrocks.paranoid.Obfuscate;

//Not in use anymore
@Obfuscate
public class LocalFileContentProvider extends ContentProvider {
   private static final String URI_PREFIX = "content://com.skyproductivity.android.emf_vodafone_survey";

   public static String constructUri(String url) {
       Uri uri = Uri.parse(url);
       return uri.isAbsolute() ? url : URI_PREFIX + url;
   }

   @Override
   public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
	   String p=Environment.getExternalStorageDirectory().getAbsolutePath();
	   String path="file://"+p+"/Pictures/EMF_survey"+uri.getPath();
	   URI file_uri =URI.create(path);
       File file = new File(file_uri);
      boolean b= file.exists();
       ParcelFileDescriptor parcel = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
       return parcel;
   }

   @Override
   public boolean onCreate() {
       return true;
   }

   @Override
   public int delete(Uri uri, String s, String[] as) {
       throw new UnsupportedOperationException("Not supported by this provider");
   }

   @Override
   public String getType(Uri uri) {
       throw new UnsupportedOperationException("Not supported by this provider");
   }

   @Override
   public Uri insert(Uri uri, ContentValues contentvalues) {
       throw new UnsupportedOperationException("Not supported by this provider");
   }

   @Override
   public Cursor query(Uri uri, String[] as, String s, String[] as1, String s1) {
       throw new UnsupportedOperationException("Not supported by this provider");
   }

   @Override
   public int update(Uri uri, ContentValues contentvalues, String s, String[] as) {
       throw new UnsupportedOperationException("Not supported by this provider");
   }

}
