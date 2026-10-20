package com.easyform.next.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.easyform.next.data.HomeRepository
import com.easyform.next.data.HomeState
import com.easyform.next.data.SampleHomeRepository
import com.easyform.next.ui.components.AppCard
import com.easyform.next.ui.components.RowDivider
import com.easyform.next.ui.components.SectionTitle
import com.easyform.next.ui.components.TitledRow
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import androidx.lifecycle.viewModelScope

class HomeViewModel(repository: HomeRepository) : ViewModel() {
    val state = repository.home.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)
}

@Composable
fun HomeScreen(userName: String, onSignOut: () -> Unit, modifier: Modifier = Modifier) {
    val vm: HomeViewModel = viewModel(factory = viewModelFactory { initializer { HomeViewModel(SampleHomeRepository(userName)) } })
    val state by vm.state.collectAsStateWithLifecycle()
    state?.let { HomeContent(it, onSignOut, modifier) }
}

@Composable
fun HomeContent(state: HomeState, onSignOut: () -> Unit, modifier: Modifier = Modifier) {
    LazyColumn(
        modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item { Greeting(state.userName, onSignOut) }
        state.nearest?.let { site -> item { NearestSiteCard(site) } }
        item { SectionTitle("MODULES") }
        item {
            AppCard {
                Column {
                    state.modules.forEachIndexed { index, module ->
                        TitledRow(title = module.code, subtitle = module.name, mark = module.code.take(2))
                        if (index < state.modules.lastIndex) RowDivider()
                    }
                }
            }
        }
    }
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
        androidx.compose.material3.IconButton(onClick = onSignOut) {
            Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = "Sign out", tint = MaterialTheme.colorScheme.onSurface)
        }
    }
}

@Composable
private fun NearestSiteCard(site: com.easyform.next.data.NearestSite) {
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
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                site.others.take(3).forEach { (name, km) ->
                    AppCardMini(name, String.format(Locale.getDefault(), "%.1f km", km), Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun AppCardMini(title: String, detail: String, modifier: Modifier = Modifier) {
    Column(
        modifier.padding(0.dp),
    ) {
        Text(title, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurface)
        Text(detail, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
