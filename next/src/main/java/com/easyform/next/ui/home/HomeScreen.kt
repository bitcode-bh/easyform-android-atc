package com.easyform.next.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.easyform.next.data.HomeState
import com.easyform.next.data.ModuleItem
import com.easyform.next.data.NearestSite
import com.easyform.next.data.auth.Session
import com.easyform.next.data.flow.FlowRepository
import com.easyform.next.data.net.ApiException
import com.easyform.next.ui.components.AppCard
import com.easyform.next.ui.components.SectionTitle
import com.easyform.next.ui.modules.ModuleCard
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

private data class Fetch(val loading: Boolean = false, val error: String? = null)

/** Home: what the phone already has shows at once; the server refresh runs behind it and reports only if it fails. */
class HomeViewModel(private val session: Session, private val flows: FlowRepository) : ViewModel() {
    private val fetch = MutableStateFlow(Fetch())
    val state = combine(flows.version, fetch) { _, f ->
        HomeState(session.username, null, flows.children(session, 0), f.loading, f.error)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), HomeState(session.username, null, flows.children(session, 0), loading = true))

    init { refresh() }

    fun refresh() {
        viewModelScope.launch {
            fetch.value = Fetch(loading = true)
            fetch.value = try { flows.refresh(session); Fetch() } catch (e: ApiException) { Fetch(error = e.message) }
            // The checksheets are bigger; they come after the modules are on screen.
            try { flows.refreshChecksheets(session) } catch (e: ApiException) { /* shown when a flow needs one */ }
        }
    }
}

@Composable
fun HomeScreen(session: Session, flows: FlowRepository, onSignOut: () -> Unit, onOpen: (ModuleItem) -> Unit, modifier: Modifier = Modifier) {
    val vm: HomeViewModel = viewModel(factory = viewModelFactory { initializer { HomeViewModel(session, flows) } })
    val state by vm.state.collectAsStateWithLifecycle()
    HomeContent(state, onSignOut, vm::refresh, onOpen, modifier)
}

@Composable
fun HomeContent(state: HomeState, onSignOut: () -> Unit, onRetry: () -> Unit, onOpen: (ModuleItem) -> Unit, modifier: Modifier = Modifier) {
    LazyColumn(
        modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item { Greeting(state.userName, onSignOut) }
        state.nearest?.let { site -> item { NearestSiteCard(site) } }
        item { SectionTitle("MODULES") }
        when {
            state.modules.isNotEmpty() -> item { ModuleCard(state.modules, onOpen) }
            state.loading -> item { Notice { CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp); Text("Loading your modules…") } }
            state.error != null -> item {
                Notice {
                    Column {
                        Text(state.error, color = MaterialTheme.colorScheme.error)
                        TextButton(onClick = onRetry) { Text("Try again") }
                    }
                }
            }
            else -> item { Notice { Text("No modules are set up for this user.") } }
        }
        if (state.modules.isNotEmpty() && state.error != null) item {
            Text("Showing what is on the phone. ${state.error}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun Notice(content: @Composable () -> Unit) {
    AppCard { Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) { content() } }
}

@Composable
private fun Greeting(user: String, onSignOut: () -> Unit) {
    val hour = LocalTime.now().hour
    val part = when { hour < 12 -> "morning"; hour < 17 -> "afternoon"; else -> "evening" }
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text("Good $part, $user", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
            Text(
                LocalDate.now().format(DateTimeFormatter.ofPattern("d MMM yyyy", Locale.getDefault())),
                style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Icon(Icons.Filled.Notifications, contentDescription = "Notifications", tint = MaterialTheme.colorScheme.onSurface)
        IconButton(onClick = onSignOut) {
            Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = "Sign out", tint = MaterialTheme.colorScheme.onSurface)
        }
    }
}

@Composable
private fun NearestSiteCard(site: NearestSite) {
    AppCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("NEAREST SITE", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Icon(Icons.Filled.LocationOn, null, tint = MaterialTheme.colorScheme.primary)
                Column {
                    Text(site.name, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
                    Text(
                        String.format(Locale.getDefault(), "%.1f km away", site.distanceKm) + if (site.onSite) " · On site" else " · Off site",
                        style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}
