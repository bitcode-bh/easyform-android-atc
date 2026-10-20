package com.easyform.next.data.flow

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/**
 * The modules the server gave this user (its User_Define_Flow_Master). The columns match the old app's table of the
 * same name, so after cutover this reads what the old app already stored.
 */
class FlowDb(context: Context) : SQLiteOpenHelper(context, "next.db", null, 3) {
    override fun onCreate(db: SQLiteDatabase) {
        createFlows(db)
        createChecksheets(db)
        createDrafts(db)
    }

    private fun createFlows(db: SQLiteDatabase) {
        db.execSQL(
            "CREATE TABLE User_Define_Flow_Master(f_id INTEGER PRIMARY KEY AUTOINCREMENT, id INTEGER, rollid INTEGER, flow_name TEXT, " +
                "flow_name1 TEXT, type TEXT, flow_id INTEGER, p_id INTEGER, level_position INTEGER, data TEXT, millisecond TEXT, " +
                "company_id INTEGER, isflag INTEGER, is_delete TEXT, language TEXT)",
        )
    }

    private fun createChecksheets(db: SQLiteDatabase) {
        // Same columns as the old app's checksheet and flow_master tables (a checksheet is one row per step).
        db.execSQL(
            "CREATE TABLE IF NOT EXISTS checksheet(_id INTEGER PRIMARY KEY AUTOINCREMENT, checksheetid INTEGER, c_name TEXT, c_type INTEGER, " +
                "data TEXT, buttons TEXT, step TEXT, subcategory TEXT, date TEXT, millisecond TEXT, moduleid TEXT, module_name TEXT, " +
                "moduledef TEXT, step_short_name TEXT, stepid TEXT, language TEXT)",
        )
        db.execSQL("CREATE INDEX IF NOT EXISTS checksheet_by_id_step ON checksheet(checksheetid, step)")
        db.execSQL(
            "CREATE TABLE IF NOT EXISTS flow_master(_id INTEGER PRIMARY KEY AUTOINCREMENT, moduleid INTEGER, company_id INTEGER, " +
                "module_name TEXT, millisecond TEXT, checksheet_id INTEGER, data TEXT)",
        )
    }

    /** Answers typed into a form and not yet sent: one row per question, per draft (scope). */
    private fun createDrafts(db: SQLiteDatabase) {
        db.execSQL("CREATE TABLE IF NOT EXISTS form_draft(scope TEXT NOT NULL, que_id INTEGER NOT NULL, value TEXT, updated INTEGER, PRIMARY KEY(scope, que_id))")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        if (oldVersion < 2) createChecksheets(db)
        if (oldVersion < 3) createDrafts(db)
    }

    /** The checksheet a flow creates its task with, and the list of checksheets inside the flow (as the server's JSON). */
    fun flowMapping(moduleId: Int): Pair<Int, String>? =
        readableDatabase.rawQuery("SELECT checksheet_id, data FROM flow_master WHERE moduleid = ?", arrayOf(moduleId.toString())).use {
            if (it.moveToFirst()) it.getInt(0) to it.getString(1).orEmpty() else null
        }

    /** The steps of a checksheet in order. */
    fun steps(checksheetId: Int): List<ChecksheetRow> {
        val out = ArrayList<ChecksheetRow>()
        readableDatabase.rawQuery(
            "SELECT checksheetid, c_name, c_type, data, buttons, step, subcategory, date, millisecond, moduleid, module_name, moduledef, step_short_name, stepid, language " +
                "FROM checksheet WHERE checksheetid = ? ORDER BY CAST(step AS INTEGER)", arrayOf(checksheetId.toString()),
        ).use { c ->
            while (c.moveToNext()) out += ChecksheetRow(
                c.getInt(0), c.getString(1).orEmpty(), c.getInt(2), c.getString(3).orEmpty(), c.getString(4).orEmpty(), c.getString(5).orEmpty(),
                c.getString(6).orEmpty(), c.getString(7).orEmpty(), c.getString(8).orEmpty(), c.getString(9).orEmpty(), c.getString(10).orEmpty(),
                c.getString(11).orEmpty(), c.getString(12).orEmpty(), c.getString(13).orEmpty(), c.getString(14).orEmpty(),
            )
        }
        return out
    }

    fun checksheetName(checksheetId: Int): String? =
        readableDatabase.rawQuery("SELECT c_name FROM checksheet WHERE checksheetid = ? LIMIT 1", arrayOf(checksheetId.toString())).use { if (it.moveToFirst()) it.getString(0) else null }

    fun loadDraft(scope: String): Map<Int, String> {
        val out = HashMap<Int, String>()
        readableDatabase.rawQuery("SELECT que_id, value FROM form_draft WHERE scope = ?", arrayOf(scope)).use { while (it.moveToNext()) out[it.getInt(0)] = it.getString(1).orEmpty() }
        return out
    }

    fun saveDraft(scope: String, answers: Map<Int, String>) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            for ((queId, value) in answers) {
                if (value.isEmpty()) { db.delete("form_draft", "scope = ? AND que_id = ?", arrayOf(scope, queId.toString())); continue }
                val values = ContentValues().apply { put("scope", scope); put("que_id", queId); put("value", value); put("updated", System.currentTimeMillis()) }
                db.insertWithOnConflict("form_draft", null, values, SQLiteDatabase.CONFLICT_REPLACE)
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    fun upsertChecksheets(rows: List<ChecksheetRow>) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            for (r in rows) {
                val values = ContentValues().apply {
                    put("checksheetid", r.checksheetId); put("c_name", r.name); put("c_type", r.type); put("data", r.data); put("buttons", r.buttons)
                    put("step", r.step); put("subcategory", r.subcategory); put("date", r.date); put("millisecond", r.millisecond)
                    put("moduleid", r.moduleId); put("module_name", r.moduleName); put("moduledef", r.moduleDef)
                    put("step_short_name", r.stepShortName); put("stepid", r.stepId); put("language", r.language)
                }
                if (db.update("checksheet", values, "checksheetid = ? AND step = ?", arrayOf(r.checksheetId.toString(), r.step)) == 0) db.insert("checksheet", null, values)
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    fun upsertFlowMaster(rows: List<FlowMasterRow>) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            for (r in rows) {
                val values = ContentValues().apply {
                    put("moduleid", r.moduleId); put("module_name", r.moduleName); put("millisecond", r.millisecond)
                    put("company_id", r.companyId); put("checksheet_id", r.checksheetId); put("data", r.data)
                }
                if (db.update("flow_master", values, "moduleid = ?", arrayOf(r.moduleId.toString())) == 0) db.insert("flow_master", null, values)
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    fun newestChecksheet(): Pair<String, String> =
        readableDatabase.rawQuery("SELECT MAX(CAST(millisecond AS INTEGER)), MAX(CAST(stepid AS INTEGER)) FROM checksheet", null).use {
            if (it.moveToFirst()) (if (it.isNull(0)) "0" else it.getLong(0).toString()) to (if (it.isNull(1)) "0" else it.getLong(1).toString()) else "0" to "0"
        }

    fun newestFlowMaster(): Pair<String, String> =
        readableDatabase.rawQuery("SELECT MAX(CAST(millisecond AS INTEGER)), MAX(moduleid) FROM flow_master", null).use {
            if (it.moveToFirst()) (if (it.isNull(0)) "0" else it.getLong(0).toString()) to (if (it.isNull(1)) "0" else it.getLong(1).toString()) else "0" to "0"
        }

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

    /** The rows under a parent (0 = the home list) for these roles. */
    fun children(parentId: Int, roleIds: List<String>): List<FlowRow> {
        val roles = roleIds.ifEmpty { listOf("0") }
        val marks = roles.joinToString(",") { "?" }
        val out = ArrayList<FlowRow>()
        readableDatabase.rawQuery(
            "SELECT id, rollid, flow_name, flow_name1, type, flow_id, p_id, level_position, data, millisecond, company_id, isflag, is_delete, language " +
                "FROM User_Define_Flow_Master WHERE p_id = ? AND rollid IN ($marks) AND (is_delete != '1' OR is_delete IS NULL) " +
                "ORDER BY level_position DESC, id",
            (listOf(parentId.toString()) + roles).toTypedArray(),
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

data class ChecksheetRow(
    val checksheetId: Int, val name: String, val type: Int, val data: String, val buttons: String, val step: String, val subcategory: String,
    val date: String, val millisecond: String, val moduleId: String, val moduleName: String, val moduleDef: String,
    val stepShortName: String, val stepId: String, val language: String,
)

data class FlowMasterRow(val moduleId: Int, val moduleName: String, val millisecond: String, val companyId: Int, val checksheetId: Int, val data: String)
