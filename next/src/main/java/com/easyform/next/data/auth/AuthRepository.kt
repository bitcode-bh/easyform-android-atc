package com.easyform.next.data.auth

import android.content.Context
import com.easyform.next.BuildConfig
import com.easyform.next.data.net.Api
import com.easyform.next.data.net.Api.Companion.serverMessage
import com.easyform.next.data.net.Api.Companion.statusOk
import com.easyform.next.data.net.ApiException
import com.easyform.next.data.net.Auth
import com.easyform.next.data.net.DeviceInfo
import com.easyform.next.data.net.PasswordCrypto
import java.util.Calendar
import java.util.TimeZone
import org.json.JSONObject

sealed interface LoginResult {
    data class Signed(val session: Session) : LoginResult
    data class Failed(val message: String) : LoginResult
}

/** Sign-in against the login server, the way the old app does it (Device_Login_With_Multi_Role_Crypto). */
class AuthRepository(private val context: Context, private val api: Api, val sessions: SessionStore) {

    suspend fun login(username: String, password: String): LoginResult {
        val user = username.trim().lowercase()
        if (user.isEmpty() || password.isEmpty()) return LoginResult.Failed("Please enter username or password.")
        val deviceId = DeviceInfo.deviceId(context)
        val zone = Calendar.getInstance().let { it.get(Calendar.ZONE_OFFSET).toLong() }
        val body = JSONObject()
            .put("username_", user)
            .put("uniq_code", java.util.UUID.randomUUID().toString().replace("-", "").take(8))
            .put("imeino", deviceId)
            .put("version", BuildConfig.SERVER_APP_VERSION)
            .put("appid", 0)
            .put("servermilli", 0)
            .put("timezone", zone.toString())
            .put("utcmilliseconds", (0L - zone - Calendar.getInstance().get(Calendar.DST_OFFSET)).toString())
            .put("deviceinfo", DeviceInfo.describe(context))
            .put("uct", randomText(10))
            .put("otp", "")
            .put("log_flag", "login")
            .put("password_", PasswordCrypto.encrypt(password))
        return try {
            val reply = api.call(BuildConfig.LOGIN_URL, "Device_Login_With_Multi_Role_Crypto", body, Auth())
            if (!reply.statusOk()) {
                if (com.easyform.next.BuildConfig.DEBUG) android.util.Log.d("MwfmLogin", "refused: status=" + reply.optString("status", reply.optString("Status")) + " message=" + reply.serverMessage())
                return LoginResult.Failed(reply.serverMessage())
            }
            val roles = reply.optString("role_id_array", "").replace(Regex("[\\[\\]\"\\s]"), "").split(",").filter { it.isNotEmpty() }
            val session = Session(
                username = user,
                uniqueCode = reply.optString("Uniq_Code", ""),
                userId = reply.optString("user_id", "0"),
                companyId = reply.optString("Company_id", "0"),
                appId = reply.optString("appid", reply.optString("AppId", "0")),
                // The role the server's headers carry is the first of the user's roles (as the old app does).
                roleId = roles.firstOrNull() ?: reply.optString("role_id", "0"),
                roleIds = roles.joinToString(",").ifEmpty { "0" },
                companyFeatureId = reply.optString("company_feature_id", "0"),
                deviceId = deviceId,
                serverMillis = reply.optString("servermilli", reply.optString("ServerMilli", "0")),
            )
            sessions.save(session)
            lastReplyKeys = reply.keys().asSequence().toList()
            if (com.easyform.next.BuildConfig.DEBUG) android.util.Log.d("MwfmLogin", "signed in; reply fields: " + lastReplyKeys.joinToString(","))
            LoginResult.Signed(session)
        } catch (e: ApiException) {
            LoginResult.Failed(e.message ?: "Could not sign in.")
        }
    }

    fun signOut() = sessions.clear()

    /** The field names the server answered with (debug aid while the session fields are being confirmed). */
    var lastReplyKeys: List<String> = emptyList()
        private set

    private fun randomText(n: Int): String {
        val chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return (1..n).map { chars.random() }.joinToString("")
    }
}
