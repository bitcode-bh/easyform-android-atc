package com.easyform.next.ui.modules

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.easyform.next.data.ModuleItem
import com.easyform.next.data.auth.Session
import com.easyform.next.data.flow.FlowRepository
import com.easyform.next.ui.components.AppCard

/** A level under Home: the rows of one module, with a way back. */
@Composable
fun ModuleLevelScreen(
    session: Session, flows: FlowRepository, parentId: Int, title: String,
    onOpen: (ModuleItem) -> Unit, onBack: () -> Unit, modifier: Modifier = Modifier,
) {
    val version by flows.version.collectAsStateWithLifecycle()
    val modules = remember(parentId, version) { flows.children(session, parentId) }
    Column(modifier.fillMaxSize()) {
        TopRow(title, onBack)
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            if (modules.isEmpty()) item { AppCard { Text("Nothing is set up here for this user.", Modifier.padding(16.dp), color = MaterialTheme.colorScheme.onSurfaceVariant) } }
            else item { ModuleCard(modules, onOpen) }
        }
    }
}

/** A flow (the end of the tree): the checksheet that starts a task and the checksheets inside the flow. */
@Composable
fun FlowScreen(
    forms: com.easyform.next.data.form.FormRepository, flowId: Int, title: String, type: String,
    onOpenForm: (checksheetId: Int, name: String) -> Unit, onBack: () -> Unit, modifier: Modifier = Modifier,
) {
    val flow = remember(flowId) { forms.flow(flowId) }
    Column(modifier.fillMaxSize()) {
        TopRow(title, onBack)
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            if (flow.create == null && flow.checksheets.isEmpty()) item {
                AppCard {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("Nothing to fill in here yet.", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                        Text(
                            if (type == "Flow" || type == "MultiFlow") "This flow has no checksheet on the phone. Open Home again to download."
                            else "$type opens its own screen, built in a later step.",
                            style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
            flow.create?.let { (id, name) ->
                item { com.easyform.next.ui.components.SectionTitle("START") }
                item { AppCard { com.easyform.next.ui.components.TitledRow("Create new", name, onClick = { onOpenForm(id, name) }) } }
            }
            if (flow.checksheets.isNotEmpty()) {
                item { com.easyform.next.ui.components.SectionTitle("CHECKSHEETS") }
                item {
                    AppCard {
                        Column {
                            flow.checksheets.forEachIndexed { index, (id, name) ->
                                com.easyform.next.ui.components.TitledRow(name, "", onClick = { onOpenForm(id, name) })
                                if (index < flow.checksheets.lastIndex) com.easyform.next.ui.components.RowDivider()
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TopRow(title: String, onBack: () -> Unit) {
    Row(Modifier.padding(horizontal = 4.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface) }
        Text(title, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
    }
}
