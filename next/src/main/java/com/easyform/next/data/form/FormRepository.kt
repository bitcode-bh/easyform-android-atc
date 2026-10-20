package com.easyform.next.data.form

import com.easyform.next.data.flow.FlowDb

/** The forms a flow offers and the answers typed into them, all on the phone (sending them comes with the uploader). */
class FormRepository(private val db: FlowDb) {
    /** The checksheet that creates the flow's task, and the checksheets inside the flow. */
    fun flow(flowId: Int): FlowForms {
        val mapping = db.flowMapping(flowId) ?: return FlowForms(null, emptyList())
        val create = mapping.first.takeIf { it != 0 }?.let { it to (db.checksheetName(it) ?: "New") }
        return FlowForms(create, FormParser.flowChecksheets(mapping.second))
    }

    fun steps(checksheetId: Int): List<FormStep> = db.steps(checksheetId).map(FormParser::step)

    fun title(checksheetId: Int): String = db.checksheetName(checksheetId).orEmpty()

    fun loadAnswers(scope: String): Map<Int, String> = db.loadDraft(scope)

    fun saveAnswers(scope: String, answers: Map<Int, String>) = db.saveDraft(scope, answers)
}

data class FlowForms(val create: Pair<Int, String>?, val checksheets: List<Pair<Int, String>>)
