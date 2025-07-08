package com.sky.atc.easyformse;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;

import io.michaelrocks.paranoid.Obfuscate;

/**
 * Created by fabiomsr on 3/7/16.
 */

//SSL OKHTTPCLIENT UTILS
@Obfuscate
public class PeerCertificateExtractor {

    /**
     * Get peer certificate(Public key to sha256 to base64)
     * @param certificate Crt or der or pem file with a valid certificate
     * @return
     */
    public static String extract(InputStream certificate){

        FileInputStream inputStream = null;

        try{
//            inputStream = new FileInputStream(certificate);
            X509Certificate x509Certificate = (X509Certificate) CertificateFactory.getInstance("X509")
                    .generateCertificate(certificate);

            byte[] publicKeyEncoded = x509Certificate.getPublicKey().getEncoded();
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] publicKeySha256 = messageDigest.digest(publicKeyEncoded);
            String publicKeyShaBase64 = Base64.encodeBytes(publicKeySha256);

           return "sha256/" + new String(publicKeyShaBase64);
        }catch (Exception e){
            e.printStackTrace();
        } finally {
            try {
                if (inputStream != null) {
                    inputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        return "";
    }

}
