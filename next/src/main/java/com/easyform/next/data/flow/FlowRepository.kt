package com.easyform.next.data.flow

import com.easyform.next.BuildConfig
import com.easyform.next.data.ModuleItem
import com.easyform.next.data.auth.Session
import com.easyform.next.data.net.Api
import com.easyform.next.data.net.Auth
import java.net.URLEncoder
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray
import org.json.JSONObject

/** The user's modules: kept on the phone, refreshed from the server (the same download the old app does at login). */
class FlowRepository(private val api: Api, private val db: FlowDb) {
    private val _modules = MutableStateFlow<List<ModuleItem>>(emptyList())
    val modules: StateFlow<List<ModuleItem>> = _modules.asStateFlow()

    fun loadLocal(session: Session) {
        _modules.value = db.topLevel(session.roleIds.split(",")).map { ModuleItem(code = it.code, name = it.name) }
    }

    /** Asks the server for anything newer than what the phone has, stores it, and updates what the screen shows. */
    suspend fun refresh(session: Session) {
        val auth = Auth(session.username, session.uniqueCode, session.appId, session.userId, session.roleId, session.companyFeatureId)
        val request = JSONObject()
            .put("user_name", session.username).put("u_c", session.uniqueCode).put("appid", session.appId)
            .put("User_Id", session.userId).put("Company_Id", session.companyId)
            .put("millisecond", db.newestMillisecond()).put("udf_id", 0).put("servermillisecond", session.serverMillis)
        val url = BuildConfig.TASK_DOWNLOAD_URL + "Wcf_offline_download_User_Define_Flow_Master_with_multi_role" +
            "?Data=" + URLEncoder.encode(JSONArray().put(request).toString(), "UTF-8")
        api.download(url, auth) { status, message ->
            if (status == "1") {
                val rows = JSONArray(message)
                db.upsert((0 until rows.length()).map { rows.getJSONObject(it).toRow() })
            }
        }
        loadLocal(session)
    }

    private fun JSONObject.toRow() = FlowRow(
        id = optInt("id"), roleId = optInt("role_id"), name = optString("name"), code = optString("flowname"), type = optString("type"),
        flowId = optInt("flow_id"), parentId = optInt("p_id"), position = optInt("level_position"), data = optString("data"),
        millisecond = optString("millisecond"), companyId = optInt("company_id"), flag = optInt("flag"),
        deleted = if (has("is_delete")) optString("is_delete") else "0", language = optString("language"),
    )
}
