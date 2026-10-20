package com.easyform.next.ui.form

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.easyform.next.data.form.FormRepository
import com.easyform.next.data.form.FormStep
import com.easyform.next.data.form.Question
import com.easyform.next.data.form.QuestionTypes
import com.easyform.next.ui.components.AppCard
import java.time.Instant
import java.time.ZoneOffset

/** A checksheet, one step at a time. Answers are kept on the phone as the person goes, so leaving never loses them. */
@Composable
fun FormScreen(forms: FormRepository, checksheetId: Int, scope: String, title: String, onClose: () -> Unit, modifier: Modifier = Modifier) {
    val steps = remember(checksheetId) { forms.steps(checksheetId) }
    val answers = remember(scope) { mutableStateMapOf<Int, String>().apply { putAll(forms.loadAnswers(scope)) } }
    var stepIndex by rememberSaveable { mutableIntStateOf(0) }
    var missing by remember { mutableStateOf(emptySet<Int>()) }
    fun save() = forms.saveAnswers(scope, answers.toMap())

    Column(modifier.fillMaxSize()) {
        Row(Modifier.padding(horizontal = 4.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { save(); onClose() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Save and close", tint = MaterialTheme.colorScheme.onSurface) }
            Column {
                Text(title, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                if (steps.size > 1) Text("Step ${stepIndex + 1} of ${steps.size}", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        if (steps.isEmpty()) {
            AppCard(Modifier.padding(16.dp)) { Text("This checksheet has not been downloaded to the phone yet.", Modifier.padding(16.dp), color = MaterialTheme.colorScheme.onSurfaceVariant) }
            return@Column
        }
        if (steps.size > 1) LinearProgressIndicator(progress = { (stepIndex + 1f) / steps.size }, modifier = Modifier.fillMaxWidth())
        val step = steps[stepIndex.coerceIn(0, steps.lastIndex)]
        StepContent(step, answers, missing, Modifier.weight(1f))
        Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            if (stepIndex > 0) OutlinedButton(onClick = { save(); stepIndex-- }, Modifier.weight(1f)) { Text("Back") }
            OutlinedButton(onClick = { save(); onClose() }, Modifier.weight(1f)) { Text("Save & exit") }
            val last = stepIndex >= steps.lastIndex
            Button(
                onClick = {
                    val blank = step.questions.filter { it.required && !it.hidden && it.type in QuestionTypes.drawn && answers[it.queId].isNullOrBlank() && it.type != QuestionTypes.HEADING && it.type != QuestionTypes.LABEL && it.type != QuestionTypes.LABEL2 }
                    missing = blank.map { it.queId }.toSet()
                    if (blank.isEmpty()) { save(); if (last) onClose() else stepIndex++ }
                },
                Modifier.weight(1f),
            ) { Text(if (last) "Finish" else "Next") }
        }
    }
}

@Composable
private fun StepContent(step: FormStep, answers: MutableMap<Int, String>, missing: Set<Int>, modifier: Modifier) {
    LazyColumn(modifier, contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        items(step.questions.filter { !it.hidden && it.type != QuestionTypes.HIDDEN }) { q ->
            QuestionView(q, answers[q.queId] ?: q.defaultValue, { answers[q.queId] = it }, error = q.queId in missing)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun QuestionView(q: Question, value: String, onChange: (String) -> Unit, error: Boolean) {
    val required = if (q.required) " *" else ""
    when (q.type) {
        QuestionTypes.HEADING, QuestionTypes.LABEL, QuestionTypes.LABEL2 ->
            if (q.label.isNotBlank()) Text(q.label, style = if (q.type == QuestionTypes.HEADING) MaterialTheme.typography.titleMedium else MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurface)
        QuestionTypes.TEXT, QuestionTypes.NUMBER -> {
            val numeric = q.type == QuestionTypes.NUMBER || q.boxType == "number"
            OutlinedTextField(
                value = value, onValueChange = { text -> if (q.limit == null || text.length <= q.limit) onChange(text) },
                label = { Text(q.label + required) }, enabled = !q.disabled, isError = error,
                singleLine = !q.multiline, minLines = if (q.multiline) 3 else 1, modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = when {
                    numeric -> KeyboardType.Decimal; q.boxType == "email" -> KeyboardType.Email; q.boxType == "phone" || q.boxType == "tel" -> KeyboardType.Phone; else -> KeyboardType.Text
                }),
                supportingText = if (error) ({ Text("Required") }) else null,
            )
        }
        QuestionTypes.RADIO -> Column {
            Text(q.label + required, style = MaterialTheme.typography.bodyLarge, color = if (error) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface)
            val options: @Composable () -> Unit = {
                q.options.forEach { option ->
                    Row(Modifier.selectable(selected = value == option, enabled = !q.disabled, role = Role.RadioButton, onClick = { onChange(option) }).padding(vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(selected = value == option, onClick = null, enabled = !q.disabled)
                        Text(option, Modifier.padding(start = 8.dp, end = 16.dp), color = MaterialTheme.colorScheme.onSurface)
                    }
                }
            }
            if (q.horizontal) Row { options() } else Column { options() }
        }
        QuestionTypes.DROPDOWN -> {
            var open by remember { mutableStateOf(false) }
            ExposedDropdownMenuBox(expanded = open, onExpandedChange = { if (!q.disabled) open = it }) {
                OutlinedTextField(
                    value = value, onValueChange = {}, readOnly = true, label = { Text(q.label + required) }, isError = error, enabled = !q.disabled,
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(open) }, modifier = Modifier.fillMaxWidth().menuAnchor(),
                )
                ExposedDropdownMenu(expanded = open, onDismissRequest = { open = false }) {
                    q.options.forEach { option -> DropdownMenuItem(text = { Text(option) }, onClick = { onChange(option); open = false }) }
                }
            }
        }
        QuestionTypes.CHECKBOX -> Column {
            Text(q.label + required, style = MaterialTheme.typography.bodyLarge, color = if (error) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface)
            val chosen = value.split("|").filter { it.isNotEmpty() }.toSet()
            q.options.forEach { option ->
                Row(Modifier.selectable(selected = option in chosen, role = Role.Checkbox, onClick = {
                    onChange((if (option in chosen) chosen - option else chosen + option).joinToString("|"))
                }).padding(vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = option in chosen, onCheckedChange = null)
                    Text(option, Modifier.padding(start = 8.dp), color = MaterialTheme.colorScheme.onSurface)
                }
            }
        }
        QuestionTypes.DATE -> {
            var open by remember { mutableStateOf(false) }
            OutlinedTextField(value = value, onValueChange = {}, readOnly = true, label = { Text(q.label + required) }, isError = error, enabled = !q.disabled, modifier = Modifier.fillMaxWidth(),
                trailingIcon = { TextButton(onClick = { open = true }, enabled = !q.disabled) { Text("Pick") } })
            if (open) {
                val state = rememberDatePickerState()
                DatePickerDialog(
                    onDismissRequest = { open = false },
                    confirmButton = { TextButton(onClick = { state.selectedDateMillis?.let { onChange(Instant.ofEpochMilli(it).atZone(ZoneOffset.UTC).toLocalDate().toString()) }; open = false }) { Text("OK") } },
                    dismissButton = { TextButton(onClick = { open = false }) { Text("Cancel") } },
                ) { DatePicker(state) }
            }
        }
        else -> AppCard {
            Column(Modifier.padding(14.dp)) {
                Text(q.label.ifBlank { QuestionTypes.name(q.type) }, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurface)
                Text("${QuestionTypes.name(q.type)}: not available in the new app yet.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}
