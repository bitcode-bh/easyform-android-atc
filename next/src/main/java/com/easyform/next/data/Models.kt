package com.easyform.next.data

data class NearestSite(val name: String, val distanceKm: Double, val onSite: Boolean, val others: List<Pair<String, Double>>)

/** A module or flow the server set up for the user. type is Module (has children), Flow, MultiFlow, Chart, ... */
data class ModuleItem(
    val id: Int, val flowId: Int, val type: String, val title: String, val subtitle: String,
    val iconBase64: String? = null, val roleId: Int = 0,
) { val opensChildren: Boolean get() = type == "Module" }

data class HomeState(
    val userName: String, val nearest: NearestSite?, val modules: List<ModuleItem>,
    val loading: Boolean = false, val error: String? = null,
)

data class LmsSummary(
    val lessonsDone: Int, val lessonsTotal: Int, val avgScorePercent: Int,
    val watchMinutes: Int, val totalVideoMinutes: Int,
    val modules: Int, val assessments: Int, val microLearning: Int,
)

data class LmsModule(val title: String, val lessonsDone: Int, val lessonsTotal: Int, val score: String)
