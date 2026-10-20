package com.easyform.next.data.net

import android.util.Base64
import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

/**
 * The password as the login server expects it: AES-128-CBC, PKCS7, key from PBKDF2-SHA1 (1000 rounds),
 * the same scheme the old app's EncryptData() uses, so an account that works there works here.
 */
object PasswordCrypto {
    private const val PASSCODE = "sky123"
    private const val SALT = "536b7950726f64756374697669747943727974696f6e"   // used as text, as the old code does
    private const val IV_HEX = "a06d2b772feaaee60b85c97f51a03246"

    fun encrypt(plain: String): String {
        val key = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1")
            .generateSecret(PBEKeySpec(PASSCODE.toCharArray(), SALT.toByteArray(Charsets.UTF_8), 1000, 128)).encoded
        val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
        cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(key, "AES"), IvParameterSpec(hex(IV_HEX)))
        return Base64.encodeToString(cipher.doFinal(plain.toByteArray(Charsets.UTF_8)), Base64.NO_WRAP)
    }

    private fun hex(s: String) = ByteArray(s.length / 2) { s.substring(it * 2, it * 2 + 2).toInt(16).toByte() }
}
