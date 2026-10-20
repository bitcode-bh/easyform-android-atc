package com.easyform.next.data.flow

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/**
 * The modules the server gave this user (its User_Define_Flow_Master). The columns match the old app's table of the
 * same name, so after cutover this reads what the old app already stored.
 */
class FlowDb(context: Context) : SQLiteOpenHelper(context, "next.db", null, 1) {
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            "CREATE TABLE User_Define_Flow_Master(f_id INTEGER PRIMARY KEY AUTOINCREMENT, id INTEGER, rollid INTEGER, flow_name TEXT, " +
                "flow_name1 TEXT, type TEXT, flow_id INTEGER, p_id INTEGER, level_position INTEGER, data TEXT, millisecond TEXT, " +
                "company_id INTEGER, isflag INTEGER, is_delete TEXT, language TEXT)",
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit

    fun upsert(rows: List<FlowRow>) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            for (r in rows) {
                val values = ContentValues().apply {
                    put("id", r.id); put("rollid", r.roleId); put("flow_name", r.name); put("flow_name1", r.code); put("type", r.type)
                    put("flow_id", r.flowId); put("p_id", r.parentId); put("level_position", r.position); put("data", r.data)
                    put("millisecond", r.millisecond); put("company_id", r.companyId); put("isflag", r.flag); put("is_delete", r.deleted)
                    put("language", r.language)
                }
                if (db.update("User_Define_Flow_Master", values, "id = ?", arrayOf(r.id.toString())) == 0) db.insert("User_Define_Flow_Master", null, values)
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    /** The top-level modules for these roles, in the order the server gives them. */
    fun topLevel(roleIds: List<String>): List<FlowRow> {
        val roles = roleIds.ifEmpty { listOf("0") }
        val marks = roles.joinToString(",") { "?" }
        val out = ArrayList<FlowRow>()
        readableDatabase.rawQuery(
            "SELECT id, rollid, flow_name, flow_name1, type, flow_id, p_id, level_position, data, millisecond, company_id, isflag, is_delete, language " +
                "FROM User_Define_Flow_Master WHERE p_id = 0 AND rollid IN ($marks) AND (is_delete != '1' OR is_delete IS NULL) " +
                "ORDER BY level_position DESC, id",
            roles.toTypedArray(),
        ).use { c ->
            while (c.moveToNext()) out += FlowRow(
                c.getInt(0), c.getInt(1), c.getString(2).orEmpty(), c.getString(3).orEmpty(), c.getString(4).orEmpty(), c.getInt(5), c.getInt(6),
                c.getInt(7), c.getString(8).orEmpty(), c.getString(9).orEmpty(), c.getInt(10), c.getInt(11), c.getString(12) ?: "0", c.getString(13).orEmpty(),
            )
        }
        return out
    }

    fun newestMillisecond(): String =
        readableDatabase.rawQuery("SELECT MAX(CAST(millisecond AS INTEGER)) FROM User_Define_Flow_Master", null).use { if (it.moveToFirst() && !it.isNull(0)) it.getLong(0).toString() else "0" }
}

data class FlowRow(
    val id: Int, val roleId: Int, val name: String, val code: String, val type: String, val flowId: Int, val parentId: Int,
    val position: Int, val data: String, val millisecond: String, val companyId: Int, val flag: Int, val deleted: String, val language: String,
)
