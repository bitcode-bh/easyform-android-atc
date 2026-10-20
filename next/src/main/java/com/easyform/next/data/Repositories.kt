package com.easyform.next.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * What the LMS screens read. They never know where it comes from: phase 9 of docs/NEXT-APP.md replaces the sample
 * implementation below with one over the LMS server API (LMS_API_SPEC.md). Home already reads the real database.
 */
interface LmsRepository {
    val summary: Flow<LmsSummary>
    val modules: Flow<List<LmsModule>>
}

/** Sample data in the shapes above, until the real source is connected. Not shipped. */
class SampleLmsRepository : LmsRepository {
    override val summary: Flow<LmsSummary> = MutableStateFlow(LmsSummary(12, 18, 56, 15, 22, 2, 1, 1)).asStateFlow()
    override val modules: Flow<List<LmsModule>> = MutableStateFlow(
        listOf(LmsModule("October 2026 (Hindi)", 9, 9, "7/9"), LmsModule("October 2026 (English)", 3, 9, "3/9")),
    ).asStateFlow()
}
