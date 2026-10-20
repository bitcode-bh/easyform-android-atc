package com.easyform.next.data

data class NearestSite(val name: String, val distanceKm: Double, val onSite: Boolean, val others: List<Pair<String, Double>>)

data class ModuleItem(val code: String, val name: String)

data class HomeState(val userName: String, val nearest: NearestSite?, val modules: List<ModuleItem>)

data class LmsSummary(
    val lessonsDone: Int, val lessonsTotal: Int, val avgScorePercent: Int,
    val watchMinutes: Int, val totalVideoMinutes: Int,
    val modules: Int, val assessments: Int, val microLearning: Int,
)

data class LmsModule(val title: String, val lessonsDone: Int, val lessonsTotal: Int, val score: String)
