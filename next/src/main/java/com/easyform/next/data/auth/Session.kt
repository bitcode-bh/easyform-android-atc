package com.easyform.next.data.auth

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class Session(
    val username: String, val uniqueCode: String, val userId: String, val companyId: String, val appId: String,
    val roleId: String, val companyFeatureId: String, val deviceId: String, val serverMillis: String,
)

/** The signed-in user, kept in app-private storage. Nothing here is a password. */
class SessionStore(context: Context) {
    private val prefs = context.getSharedPreferences("session", Context.MODE_PRIVATE)
    private val state = MutableStateFlow(read())
    val current: StateFlow<Session?> = state.asStateFlow()

    private fun read(): Session? {
        val user = prefs.getString("username", null) ?: return null
        return Session(
            user, prefs.getString("u_c", "") ?: "", prefs.getString("user_id", "0") ?: "0", prefs.getString("company_id", "0") ?: "0",
            prefs.getString("appid", "0") ?: "0", prefs.getString("role_id", "0") ?: "0", prefs.getString("company_feature_id", "0") ?: "0",
            prefs.getString("device_id", "") ?: "", prefs.getString("server_millis", "0") ?: "0",
        )
    }

    fun save(s: Session) {
        prefs.edit().putString("username", s.username).putString("u_c", s.uniqueCode).putString("user_id", s.userId)
            .putString("company_id", s.companyId).putString("appid", s.appId).putString("role_id", s.roleId)
            .putString("company_feature_id", s.companyFeatureId).putString("device_id", s.deviceId)
            .putString("server_millis", s.serverMillis).apply()
        state.value = s
    }

    fun clear() { prefs.edit().clear().apply(); state.value = null }
}
