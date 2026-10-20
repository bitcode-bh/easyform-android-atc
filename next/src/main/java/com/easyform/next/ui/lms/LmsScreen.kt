package com.easyform.next.ui.lms

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Movie
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.PrimaryScrollableTabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.easyform.next.data.LmsModule
import com.easyform.next.data.LmsRepository
import com.easyform.next.data.LmsSummary
import com.easyform.next.data.SampleLmsRepository
import com.easyform.next.ui.components.AppCard
import com.easyform.next.ui.components.RowDivider
import com.easyform.next.ui.components.SectionTitle
import com.easyform.next.ui.components.StatTile
import com.easyform.next.ui.components.TitledRow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn

class LmsViewModel(repository: LmsRepository) : ViewModel() {
    val summary = repository.summary.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)
    val modules = repository.modules.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
}

private val tabs = listOf("Dashboard", "Modules", "Assessments", "Micro Learning")

/** LMS is a normal tab of the same app: same theme, same cards, same navigation; no WebView, no second framework. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LmsScreen(modifier: Modifier = Modifier) {
    val vm: LmsViewModel = viewModel(factory = viewModelFactory { initializer { LmsViewModel(SampleLmsRepository()) } })
    val summary by vm.summary.collectAsStateWithLifecycle()
    val modules by vm.modules.collectAsStateWithLifecycle()
    var tab by rememberSaveable { mutableIntStateOf(0) }
    Column(modifier.fillMaxSize()) {
        PrimaryScrollableTabRow(selectedTabIndex = tab, edgePadding = 8.dp, containerColor = MaterialTheme.colorScheme.background) {
            tabs.forEachIndexed { index, title -> Tab(selected = tab == index, onClick = { tab = index }, text = { Text(title) }) }
        }
        LazyColumn(Modifier.fillMaxSize(), contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            when (tab) {
                0 -> item { summary?.let { Dashboard(it) } }
                1 -> {
                    item { SectionTitle("MODULES") }
                    item {
                        AppCard {
                            Column {
                                modules.forEachIndexed { index, m -> ModuleRow(m); if (index < modules.lastIndex) RowDivider() }
                            }
                        }
                    }
                }
                else -> item { AppCard { Text("Built in a later step.", Modifier.padding(16.dp), color = MaterialTheme.colorScheme.onSurfaceVariant) } }
            }
        }
    }
}

@Composable
private fun Dashboard(s: LmsSummary) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        AppCard {
            Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                StatTile("Lessons done", "${s.lessonsDone}/${s.lessonsTotal}", Modifier.weight(1f), Icons.Filled.CheckCircle)
                VerticalRule()
                StatTile("Avg score", "${s.avgScorePercent}%", Modifier.weight(1f), Icons.Filled.BarChart)
                VerticalRule()
                StatTile("Watch time", "${s.watchMinutes}m", Modifier.weight(1f), Icons.Filled.Schedule)
                VerticalRule()
                StatTile("Video time", "${s.totalVideoMinutes}m", Modifier.weight(1f), Icons.Filled.Movie)
            }
        }
        AppCard {
            Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                StatTile("Modules", "${s.modules}", Modifier.weight(1f))
                VerticalRule()
                StatTile("Assessments", "${s.assessments}", Modifier.weight(1f))
                VerticalRule()
                StatTile("Micro Learning", "${s.microLearning}", Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun VerticalRule() {
    androidx.compose.foundation.layout.Box(
        Modifier.fillMaxHeight().padding(vertical = 14.dp).width(1.dp)
            .background(MaterialTheme.colorScheme.outlineVariant),
    )
}

@Composable
private fun ModuleRow(m: LmsModule) {
    TitledRow(title = m.title, subtitle = "${m.lessonsDone}/${m.lessonsTotal} lessons · Score ${m.score}")
}
