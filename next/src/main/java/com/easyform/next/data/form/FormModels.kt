package com.easyform.next.data.form

import org.json.JSONArray
import org.json.JSONObject

/** One question of a checksheet step, read from the server's JSON (the old app's ReadCheckSheet.js reads the same fields). */
data class Question(
    val queId: Int,
    val type: Int,
    /** What the person reads above the answer. */
    val label: String,
    /** The choices of a radio, dropdown or checkbox question; for text-like questions, empty. */
    val options: List<String>,
    val required: Boolean,
    val hidden: Boolean,
    val disabled: Boolean,
    /** text, number, email, phone ... for a text question; null otherwise. */
    val boxType: String?,
    val multiline: Boolean,
    val limit: Int?,
    val decimals: Int?,
    val horizontal: Boolean,
    val defaultValue: String,
)

data class FormStep(val stepNo: String, val title: String, val questions: List<Question>, val buttons: List<FormButton>)

data class FormButton(val name: String, val action: String)

object QuestionTypes {
    const val HEADING = 0; const val TEXT = 1; const val RADIO = 2; const val DROPDOWN = 3; const val NUMBER = 4; const val LABEL = 5
    const val CHECKBOX = 6; const val PHOTO = 7; const val DATE = 8; const val HIDDEN = 10; const val LABEL2 = 31

    /** The types drawn by the new form screen so far; the others are shown as "not available yet", never dropped. */
    val drawn = setOf(HEADING, TEXT, RADIO, DROPDOWN, NUMBER, LABEL, CHECKBOX, DATE, HIDDEN, LABEL2)

    fun name(type: Int) = when (type) {
        PHOTO -> "Photo"; 9 -> "Signature"; 12 -> "Range"; 13 -> "Location"; 16 -> "Distance"; 17 -> "Calculator"; 20, 21 -> "Search list"
        22 -> "Invoice"; 23, 25 -> "Scanner"; 26 -> "File upload"; 27 -> "PDF"; 28 -> "Video"; 30 -> "Dynamic list"; 39 -> "Weather"; 40 -> "Live link"
        else -> "Type $type"
    }
}

object FormParser {
    fun step(row: com.easyform.next.data.flow.ChecksheetRow): FormStep {
        val items = try { JSONArray(row.data) } catch (e: Exception) { JSONArray() }
        val buttons = try {
            JSONArray(row.buttons).let { a -> (0 until a.length()).map { a.getJSONObject(it) }.map { FormButton(it.optString("name"), it.optString("action")) } }
        } catch (e: Exception) { emptyList() }
        return FormStep(
            stepNo = row.step, title = row.stepShortName.ifBlank { row.subcategory.ifBlank { row.name } },
            questions = (0 until items.length()).mapNotNull { runCatching { question(items.getJSONObject(it)) }.getOrNull() }, buttons = buttons,
        )
    }

    private fun question(item: JSONObject): Question {
        val type = item.optString("type", "0").toIntOrNull() ?: 0
        val values = strings(item.opt("value"))
        val prop = item.optJSONArray("prop")?.optJSONObject(0) ?: JSONObject()
        val misc = prop.optJSONArray("misc_data")?.optJSONObject(0) ?: JSONObject()
        val settings = try { JSONArray(misc.optString("value", "[]")).optJSONObject(0) ?: JSONObject() } catch (e: Exception) { JSONObject() }
        val name = prop.optString("name", "")
        val optionsType = type == QuestionTypes.RADIO || type == QuestionTypes.DROPDOWN || type == QuestionTypes.CHECKBOX
        return Question(
            queId = item.optString("que_id", "0").toIntOrNull() ?: 0,
            type = type,
            label = if (optionsType) name else values.firstOrNull().orEmpty().ifBlank { name },
            options = if (optionsType) values else emptyList(),
            required = prop.optString("valid", "false") == "true",
            hidden = prop.optString("is_hide", "false") == "true",
            disabled = prop.optString("is_disabled", "false") == "true",
            boxType = settings.optString("box_type", "").takeIf { it.isNotBlank() },
            multiline = settings.optString("box_view", "") == "textarea",
            limit = misc.optString("limit", "").toIntOrNull(),
            decimals = settings.optString("decimal_point", "").toIntOrNull(),
            horizontal = misc.optString("view_type", "") == "horizontal",
            defaultValue = strings(misc.opt("default_value")).firstOrNull().orEmpty().takeUnless { it.startsWith("<#") }.orEmpty(),
        )
    }

    /** The server writes lists as real arrays, but a few as one text; read either. */
    private fun strings(any: Any?): List<String> = when (any) {
        is JSONArray -> (0 until any.length()).map { any.optString(it) }
        is String -> if (any.isBlank()) emptyList() else listOf(any)
        else -> emptyList()
    }

    /** The checksheets inside a flow, from the flow mapping JSON. */
    fun flowChecksheets(mappingJson: String): List<Pair<Int, String>> = try {
        val a = JSONArray(mappingJson)
        (0 until a.length()).map { a.getJSONObject(it) }
            .filter { it.optString("is_disabled", "0") != "1" }
            .map { (it.optString("checksheetid", "0").toIntOrNull() ?: 0) to it.optString("c_name") }
            .filter { it.first != 0 }
    } catch (e: Exception) { emptyList() }
}
