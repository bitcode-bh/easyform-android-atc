package com.sky.atc.easyformse.datautils;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.util.Base64;

import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.sqlitewraper;

import java.io.UnsupportedEncodingException;
import java.security.GeneralSecurityException;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Secure Sharedprences common class
@StringFogIgnore
public class MySharedPreferences {

    public static class SecurePreferencesException extends RuntimeException {

        SecurePreferencesException(Throwable e) {
            super(e);
        }

    }

    private static final String TRANSFORMATION = "AES/CBC/PKCS5Padding";
    private static final String KEY_TRANSFORMATION = "AES/ECB/PKCS5Padding";
    private static final String SECRET_KEY_HASH_TRANSFORMATION = "SHA-256";
    private static final String CHARSET = "UTF-8";

    private boolean encryptKeys;
    private Cipher writer;
    private Cipher reader;
    private Cipher keyWriter;
    private SharedPreferences preferences;
    private static String isSecure = sqlitewraper.context.getResources().getString(R.string.SECURESHARED);

    public MySharedPreferences(Context context, String preferenceName,
                               String secureKey, boolean encryptKeys, boolean b)
            throws SecurePreferencesException {
        try {

            if (b){

                this.writer = Cipher.getInstance(TRANSFORMATION);
                this.reader = Cipher.getInstance(TRANSFORMATION);
                this.keyWriter = Cipher.getInstance(KEY_TRANSFORMATION);
                initCiphers(secureKey);
                this.encryptKeys = encryptKeys;

                this.preferences = context.getSharedPreferences(preferenceName,
                        Context.MODE_PRIVATE);

            }else {

                this.preferences = context.getSharedPreferences(preferenceName,
                        Context.MODE_PRIVATE);
            }
        } catch (GeneralSecurityException | UnsupportedEncodingException e) {
            throw new SecurePreferencesException(e);
        }
    }

    public static MySharedPreferences getInstance(Context contxt, String prefName) {

        MySharedPreferences instance = null;
        if (isSecure.equalsIgnoreCase("true")) {

            instance = new MySharedPreferences(contxt, prefName,
                    prefName + "Key", false,true);
        }else {
            instance = new MySharedPreferences(contxt, prefName,
                    prefName, false,false);
        }
        return instance;
    }

    private void initCiphers(String secureKey)
            throws UnsupportedEncodingException, NoSuchAlgorithmException,
            InvalidKeyException, InvalidAlgorithmParameterException {
        IvParameterSpec ivSpec = getIv();
        SecretKeySpec secretKey = getSecretKey(secureKey);

        writer.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec);
        reader.init(Cipher.DECRYPT_MODE, secretKey, ivSpec);
        keyWriter.init(Cipher.ENCRYPT_MODE, secretKey);
    }

    private IvParameterSpec getIv() {
        byte[] iv = new byte[writer.getBlockSize()];
        System.arraycopy("fldsjfodasjifudslfjdsaofshaufihadsf".getBytes(), 0,
                iv, 0, writer.getBlockSize());
        return new IvParameterSpec(iv);
    }

    private SecretKeySpec getSecretKey(String key)
            throws UnsupportedEncodingException, NoSuchAlgorithmException {
        byte[] keyBytes = createKeyBytes(key);
        return new SecretKeySpec(keyBytes, TRANSFORMATION);
    }

    private byte[] createKeyBytes(String key)
            throws UnsupportedEncodingException, NoSuchAlgorithmException {
        MessageDigest md = MessageDigest
                .getInstance(SECRET_KEY_HASH_TRANSFORMATION);
        md.reset();
        byte[] keyBytes = md.digest(key.getBytes(CHARSET));
        return keyBytes;
    }
    public void putString(String key, String value) {


        if (isSecure.equalsIgnoreCase("true")){
            if (value == null) {
                preferences.edit().remove(toKey(key)).apply();
            } else {
                putValue(toKey(key), value);
            }
        }else {
            putValue(key, value);
        }
    }

    public void putBoolean(String key, Boolean value) {
        if (value == null) {
            preferences.edit().remove(toKey(key)).apply();
        } else {
            if (isSecure.equalsIgnoreCase("true")){
                putValue(toKey(key), Boolean.toString(value));
            }else {
                putValue(key, Boolean.toString(value));
            }
        }
    }

    public void putLong(String key, long value) {

        if (isSecure.equalsIgnoreCase("true")){
            putValue(toKey(key), Long.toString(value));
        }else {
            putValue(key, Long.toString(value));
        }
    }

    public void putInt(String key, int value) {
        if (isSecure.equalsIgnoreCase("true")){
            putValue(toKey(key), Integer.toString(value));
        }else {
            putValue(key, Integer.toString(value));
        }
    }

    public boolean containsKey(String key) {
        return preferences.contains(toKey(key));
    }

    public void removeValue(String key) {
        preferences.edit().remove(toKey(key)).apply();
    }

    public String getString(String key, String value)
            throws SecurePreferencesException {

        if (isSecure.equalsIgnoreCase("true")){

            if (preferences.contains(toKey(key))) {
                String securedEncodedValue = preferences.getString(toKey(key), "");
                return decrypt(securedEncodedValue);
            }
        }else {
            if (preferences.contains(key)) {
                String securedEncodedValue = preferences.getString(key, "");
                return securedEncodedValue;
            }
        }
        return value;
    }

    public long getLong(String key, long value)
            throws SecurePreferencesException {

        if (isSecure.equalsIgnoreCase("true")){
            if (preferences.contains(toKey(key))) {
                String securedEncodedValue = preferences.getString(toKey(key), "");
                return Long.parseLong(decrypt(securedEncodedValue));
            }
        }else {
            if (preferences.contains(key)) {
                String securedEncodedValue = preferences.getString(key, "");
                return Long.parseLong(securedEncodedValue);
            }
        }


        return value;
    }

    public boolean getBoolean(String key, boolean value)
            throws SecurePreferencesException {
        if (preferences.contains(toKey(key))) {
            String securedEncodedValue = preferences.getString(toKey(key), "");
            return Boolean.parseBoolean(decrypt(securedEncodedValue));
        }
        if (isSecure.equalsIgnoreCase("true")){
            if (preferences.contains(toKey(key))) {
                String securedEncodedValue = preferences.getString(toKey(key), "");
                return Boolean.parseBoolean(decrypt(securedEncodedValue));
            }
        }else {

            if (preferences.contains(key)) {
                String securedEncodedValue = preferences.getString(key, "");
                return Boolean.parseBoolean(securedEncodedValue);
            }
        }
        return value;
    }

    public int getInt(String key, int value) throws SecurePreferencesException {

        if (isSecure.equalsIgnoreCase("true")){
            if (preferences.contains(toKey(key))) {
                String securedEncodedValue = preferences.getString(toKey(key), "");
                return Integer.parseInt(decrypt(securedEncodedValue));
            }

        }else {

            if (preferences.contains(key)) {
                String securedEncodedValue = preferences.getString(key, "");
                return Integer.parseInt(securedEncodedValue);
            }
        }
        return value;
    }

    public void commit() {
        preferences.edit().apply();
    }

    public void clear() {
        preferences.edit().clear().apply();
    }

    private String toKey(String key) {
        if (encryptKeys)
            return encrypt(key, keyWriter);
        else
            return key;
    }

    private void putValue(String key, String value)
            throws SecurePreferencesException {
        String secureValueEncoded=value;
        if (isSecure.equalsIgnoreCase("true")) {
            secureValueEncoded = encrypt(value, writer);
        }

        preferences.edit().putString(key, secureValueEncoded).apply();
    }

    protected String encrypt(String value, Cipher writer)
            throws SecurePreferencesException {
        byte[] secureValue;
        try {
            secureValue = convert(writer, value.getBytes(CHARSET));
        } catch (UnsupportedEncodingException e) {
            throw new SecurePreferencesException(e);
        }
        String secureValueEncoded = Base64.encodeToString(secureValue,
                Base64.NO_WRAP);
        return secureValueEncoded;
    }

    protected String decrypt(String securedEncodedValue) {

        try{
            byte[] securedValue = Base64
                    .decode(securedEncodedValue, Base64.NO_WRAP);
            byte[] value = convert(reader, securedValue);
            try {
                return new String(value, CHARSET);
            } catch (UnsupportedEncodingException e) {
                throw new SecurePreferencesException(e);
            }

        }catch (Exception e){
            return securedEncodedValue;
        }
    }

    private static byte[] convert(Cipher cipher, byte[] bs)
            throws SecurePreferencesException {
        try {
            return cipher.doFinal(bs);
        } catch (Exception e) {
            throw new SecurePreferencesException(e);
        }
    }
}
