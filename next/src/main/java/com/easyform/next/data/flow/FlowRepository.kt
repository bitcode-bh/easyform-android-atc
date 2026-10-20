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
    private val _version = MutableStateFlow(0)
    /** Changes whenever the stored modules change, so screens re-read. */
    val version: StateFlow<Int> = _version.asStateFlow()

    /**
     * What a level of the module tree shows, as the old app shows it: rows the user may use on a phone, in the
     * position order set on the server, each titled by its short code when it has one.
     */
    fun children(session: Session, parentId: Int): List<ModuleItem> =
        db.children(parentId, session.roleIds.split(",")).mapNotNull { row ->
            val info = try { JSONArray(row.data).getJSONObject(0) } catch (e: Exception) { JSONObject() }
            val access = info.optString("access_type", "")
            if (access != "" && access != "null" && access != "mobile" && access != "both") return@mapNotNull null
            val code = info.optString("udf_title", "").takeIf { it.isNotBlank() && it != "null" }
            val position = info.optString("position", "0").toDoubleOrNull() ?: 0.0
            position to ModuleItem(
                id = row.id, flowId = row.flowId, type = row.type, title = code ?: row.name, subtitle = if (code != null) row.name else "",
                iconBase64 = info.optString("icon_base64", "").takeIf { it.isNotBlank() && it != "null" }, roleId = row.roleId,
            )
        }.sortedBy { it.first }.map { it.second }

    /** Asks the server for anything newer than what the phone has, stores it, and tells screens to re-read. */
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
        _version.value = _version.value + 1
    }

    /** The checksheets (one row per step) and the flow-to-checksheet mapping: what a flow needs before it can open a form. */
    suspend fun refreshChecksheets(session: Session) {
        val auth = Auth(session.username, session.uniqueCode, session.appId, session.userId, session.roleId, session.companyFeatureId)
        fun base() = JSONObject()
            .put("user_name", session.username).put("u_c", session.uniqueCode).put("appid", session.appId)
            .put("User_Id", session.userId).put("Company_Id", session.companyId)
        fun url(method: String, body: JSONObject) = BuildConfig.TASK_DOWNLOAD_URL + method + "?Data=" + URLEncoder.encode(JSONArray().put(body).toString(), "UTF-8")

        // The server sends a batch at a time, from where the phone's newest row left off, and nothing (status 2) when it is done.
        var batches = 0
        while (batches++ < MAX_BATCHES) {
            val (sheetMilli, stepId) = db.newestChecksheet()
            var got = 0
            api.download(url("Offline_Download_Checksheet_Master", base().put("millisecond", sheetMilli).put("Step_Id", stepId)), auth) { status, message ->
                if (status == "1") {
                    val rows = JSONArray(message)
                    got += rows.length()
                    db.upsertChecksheets((0 until rows.length()).map { rows.getJSONObject(it) }.map {
                        ChecksheetRow(
                            it.optInt("checksheetid"), it.optString("c_name"), it.optInt("c_type"), it.optString("data"), it.optString("buttons"),
                            it.optString("stepno"), it.optString("subcategory"), it.optString("updateddate"), it.optString("millisecond"),
                            it.optString("moduleid"), it.optString("module_name"), it.optString("moduledef"), it.optString("step_short_name"),
                            it.optString("step_id"), it.optString("language"),
                        )
                    })
                }
            }
            _version.value = _version.value + 1
            if (got == 0) break
        }

        batches = 0
        while (batches++ < MAX_BATCHES) {
            val (flowMilli, flowId) = db.newestFlowMaster()
            var got = 0
            api.download(url("Offline_Download_Checksheet_Flow_Master_AppId", base().put("app_id", session.appId).put("millisecond", flowMilli).put("flow_id", flowId)), auth) { status, message ->
                if (status == "1") {
                    val rows = JSONArray(message)
                    got += rows.length()
                    db.upsertFlowMaster((0 until rows.length()).map { rows.getJSONObject(it) }.map {
                        FlowMasterRow(it.optInt("moduleid"), it.optString("module_name"), it.optString("millisecond"), it.optInt("company_id"), it.optInt("checksheet_id"), it.optString("data"))
                    })
                }
            }
            _version.value = _version.value + 1
            if (got == 0) break
        }
    }

    private companion object { const val MAX_BATCHES = 400 }

    private fun JSONObject.toRow() = FlowRow(
        id = optInt("id"), roleId = optInt("role_id"), name = optString("name"), code = optString("flowname"), type = optString("type"),
        flowId = optInt("flow_id"), parentId = optInt("p_id"), position = optInt("level_position"), data = optString("data"),
        millisecond = optString("millisecond"), companyId = optInt("company_id"), flag = optInt("flag"),
        deleted = if (has("is_delete")) optString("is_delete") else "0", language = optString("language"),
    )
}
