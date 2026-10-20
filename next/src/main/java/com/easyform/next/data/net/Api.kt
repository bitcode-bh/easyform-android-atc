package com.easyform.next.data.net

import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject

/** What the server (or the phone's connection) said when a call did not work; the message is safe to show. */
class ApiException(val kind: Kind, message: String) : Exception(message) {
    enum class Kind { Offline, Http, Rejected, BadResponse }
}

/** Who is asking: the "auth1" header every call after login carries (the old app builds it from Login_Master). */
data class Auth(
    val username: String = "0", val uniqueCode: String = "NA", val appId: String = "0", val userId: String = "0",
    val roleId: String = "0", val companyFeatureId: String = "0",
) {
    fun header(): String = JSONObject()
        .put("username", username).put("u_c", uniqueCode).put("appid", appId).put("user_id", userId)
        .put("Role_Id", roleId).put("Company_Feature_Id", companyFeatureId).put("matchId", "0").toString()
}

/**
 * The server's call shape, as the old app makes it: POST base + method, body a JSON array holding one object,
 * the auth in headers, an array of objects back whose first one has a status (1 = ok).
 */
class Api(private val http: OkHttpClient = defaultClient()) {

    suspend fun call(base: String, method: String, body: JSONObject, auth: Auth): JSONObject = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url(base + method)
            .header("Accept", "application/json")
            .header("auth1", auth.header())
            .header("Role_Id", auth.roleId)
            .header("Company_Feature_Id", auth.companyFeatureId)
            .header("matchId", "0")
            .post(JSONArray().put(body).toString().toRequestBody("application/json; charset=utf-8".toMediaType()))
            .build()
        val text = try {
            http.newCall(request).execute().use { response ->
                if (response.code != 200) throw ApiException(ApiException.Kind.Http, "The server could not complete the request (HTTP ${response.code}). Please try again shortly.")
                response.body?.string().orEmpty()
            }
        } catch (e: ApiException) {
            throw e
        } catch (e: java.io.IOException) {
            throw ApiException(ApiException.Kind.Offline, "No connection to the server. Check the network and try again.")
        }
        val first = try {
            JSONArray(text.replace("\r\n", "").replace("\n", "")).getJSONObject(0)
        } catch (e: Exception) {
            throw ApiException(ApiException.Kind.BadResponse, "The server sent a reply the app could not read.")
        }
        first
    }

    /**
     * The download calls: GET with the request in the Data parameter, the user in headers, and a reply that is a run of
     * {"status":..,"message":..} objects. Returns each object's status and its message text.
     */
    suspend fun download(url: String, auth: Auth, handle: (status: String, message: String) -> Unit) = withContext(Dispatchers.IO) {
        val request = Request.Builder().url(url).get()
            .header("auth1", JSONObject().put("username", auth.username).put("u_c", auth.uniqueCode).put("appid", auth.appId).put("user_id", auth.userId).toString())
            .header("uname", auth.username).header("u_c", auth.uniqueCode)
            .header("Role_Id", auth.roleId).header("Company_Feature_Id", auth.companyFeatureId)
            .build()
        try {
            http.newCall(request).execute().use { response ->
                if (response.code != 200) throw ApiException(ApiException.Kind.Http, "The server could not complete the request (HTTP ${response.code}). Please try again shortly.")
                val body = response.body ?: throw ApiException(ApiException.Kind.BadResponse, "The server sent an empty reply.")
                android.util.JsonReader(body.charStream()).use { reader ->
                    reader.isLenient = true
                    while (reader.peek() != android.util.JsonToken.END_DOCUMENT) {
                        var status = ""; var message = ""
                        reader.beginObject()
                        while (reader.hasNext()) when (reader.nextName()) {
                            "status", "Status" -> status = reader.nextString()
                            "message", "Message" -> message = reader.nextString()
                            else -> reader.skipValue()
                        }
                        reader.endObject()
                        handle(status, message)
                    }
                }
            }
        } catch (e: java.io.IOException) {
            throw ApiException(ApiException.Kind.Offline, "No connection to the server. Check the network and try again.")
        }
    }

    companion object {
        fun defaultClient(): OkHttpClient = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS).readTimeout(120, TimeUnit.SECONDS).writeTimeout(60, TimeUnit.SECONDS).build()

        /** status 1 is success; anything else carries the server's own message. */
        fun JSONObject.statusOk(): Boolean = (optString("status", optString("Status", ""))) == "1"
        fun JSONObject.serverMessage(): String = optString("message", optString("Message", "")).ifBlank { "The server did not accept the request." }
    }
}
