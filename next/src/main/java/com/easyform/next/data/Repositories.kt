package com.easyform.next.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * What the screens read. The screens never know where it comes from: phase 3 of docs/NEXT-APP.md replaces the sample
 * implementations below with ones over the phone's database (User_Define_Flow_Master, track_master, ...), and phase 9 does
 * the same for LMS from the LMS server API (LMS_API_SPEC.md).
 */
interface HomeRepository { val home: Flow<HomeState> }
interface LmsRepository {
    val summary: Flow<LmsSummary>
    val modules: Flow<List<LmsModule>>
}

/** Sample data in the shapes above, until the real sources are connected. Not shipped. */
class SampleHomeRepository : HomeRepository {
    private val state = MutableStateFlow(
        HomeState(
            userName = "anup.vt",
            nearest = NearestSite("Site 83750", 128.4, false, listOf("80095" to 129.2, "65811" to 131.0, "64242" to 131.3, "65743" to 131.3)),
            modules = listOf(
                ModuleItem("RSA", "Remote Site Audit"), ModuleItem("PM", "PM"), ModuleItem("PTW", "Permit To Work"),
                ModuleItem("CM", "CM"), ModuleItem("ER", "Energy Reading"), ModuleItem("ERA", "Energy Reading (AP)"),
                ModuleItem("SSM", "Safety Survey Module"), ModuleItem("NP", "NextGen PM"), ModuleItem("HI", "Hygiene Inspection"),
                ModuleItem("IM", "Incident Management"),
            ),
        ),
    )
    override val home: Flow<HomeState> = state.asStateFlow()
}

class SampleLmsRepository : LmsRepository {
    override val summary: Flow<LmsSummary> = MutableStateFlow(LmsSummary(12, 18, 56, 15, 22, 2, 1, 1)).asStateFlow()
    override val modules: Flow<List<LmsModule>> = MutableStateFlow(
        listOf(LmsModule("October 2026 (Hindi)", 9, 9, "7/9"), LmsModule("October 2026 (English)", 3, 9, "3/9")),
    ).asStateFlow()
}
