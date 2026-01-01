package com.sky.atc.easyformse.datautils;

import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Random;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Login Utils for use of Auth
@StringFogIgnore
public class LoginUtils {

    public static String getRandomString(int n){
            // chose a Character random from this String
            String AlphaNumericString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                    + "0123456789"
                    + "abcdefghijklmnopqrstuvxyz";
            // create StringBuffer size of AlphaNumericString
            StringBuilder sb = new StringBuilder(n);
            for (int i = 0; i < n; i++) {
                // generate a random number between
                // 0 to AlphaNumericString variable length
                int index = (int)(AlphaNumericString.length() * Math.random());
                // add Character one by one in end of sb
                sb.append(AlphaNumericString
                        .charAt(index));
            }
            return sb.toString();
    }

    public static boolean isValidLogin( String responseUCT, String uc,String lastUCT){
        String newSHAString=lastUCT+uc;
        String myUCT=getSha256Hash(newSHAString);
        return responseUCT.equals(myUCT);
    }
    private static String getSha256Hash(String password) {
        try {
            MessageDigest digest = null;
            try {
                digest = MessageDigest.getInstance("SHA-256");
            } catch (NoSuchAlgorithmException e1) {
                e1.printStackTrace();
            }
            digest.reset();
            return bin2hex(digest.digest(password.getBytes()));
        } catch (Exception ignored) {
            return null;
        }
    }
    private static String bin2hex(byte[] data) {
        StringBuilder hex = new StringBuilder(data.length * 2);
        for (byte b : data)
            hex.append(String.format("%02x", b & 0xFF));
        return hex.toString();
    }
}
