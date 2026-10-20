package com.easyform.next.ui.login

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.easyform.next.data.auth.AuthRepository
import com.easyform.next.data.auth.LoginResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LoginUi(val busy: Boolean = false, val error: String? = null)

class LoginViewModel(private val auth: AuthRepository) : ViewModel() {
    private val _ui = MutableStateFlow(LoginUi())
    val ui: StateFlow<LoginUi> = _ui.asStateFlow()

    fun submit(username: String, password: String) {
        if (_ui.value.busy) return
        _ui.value = LoginUi(busy = true)
        viewModelScope.launch {
            _ui.value = when (val result = auth.login(username, password)) {
                is LoginResult.Signed -> LoginUi()          // the session store changes; the app moves to Home
                is LoginResult.Failed -> LoginUi(error = result.message)
            }
        }
    }
}

@Composable
fun LoginScreen(vm: LoginViewModel, modifier: Modifier = Modifier) {
    val ui by vm.ui.collectAsStateWithLifecycle()
    var user by rememberSaveable { mutableStateOf("") }
    var pass by rememberSaveable { mutableStateOf("") }
    var show by remember { mutableStateOf(false) }
    val focus = LocalFocusManager.current
    Column(
        modifier.fillMaxSize().safeDrawingPadding().imePadding().verticalScroll(rememberScrollState()).padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Text("MWFM", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary)
        Text("Sign in", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
        androidx.compose.foundation.layout.Spacer(Modifier.height(28.dp))
        OutlinedTextField(
            value = user, onValueChange = { user = it }, singleLine = true, label = { Text("Username") },
            leadingIcon = { Icon(Icons.Filled.Person, null) }, modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
            keyboardActions = KeyboardActions(onNext = { focus.moveFocus(FocusDirection.Down) }),
        )
        androidx.compose.foundation.layout.Spacer(Modifier.height(14.dp))
        OutlinedTextField(
            value = pass, onValueChange = { pass = it }, singleLine = true, label = { Text("Password") },
            leadingIcon = { Icon(Icons.Filled.Lock, null) },
            trailingIcon = { IconButton({ show = !show }) { Icon(if (show) Icons.Filled.VisibilityOff else Icons.Filled.Visibility, if (show) "Hide password" else "Show password") } },
            visualTransformation = if (show) VisualTransformation.None else PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
            keyboardActions = KeyboardActions(onDone = { focus.clearFocus(); vm.submit(user, pass) }),
        )
        ui.error?.let {
            androidx.compose.foundation.layout.Spacer(Modifier.height(12.dp))
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
        }
        androidx.compose.foundation.layout.Spacer(Modifier.height(22.dp))
        Button(onClick = { focus.clearFocus(); vm.submit(user, pass) }, enabled = !ui.busy, modifier = Modifier.fillMaxWidth().height(50.dp)) {
            if (ui.busy) CircularProgressIndicator(Modifier.size(22.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
            else Text("Login")
        }
    }
}
