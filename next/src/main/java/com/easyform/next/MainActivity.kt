package com.easyform.next

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.easyform.next.ui.login.LoginScreen
import com.easyform.next.ui.login.LoginViewModel
import com.easyform.next.ui.nav.AppNav
import com.easyform.next.ui.theme.MwfmTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val container = (application as MwfmApp).container
        setContent {
            MwfmTheme {
                androidx.compose.material3.Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                val session by container.sessions.current.collectAsStateWithLifecycle()
                val current = session
                if (current == null) {
                    val vm: LoginViewModel = viewModel(factory = viewModelFactory { initializer { LoginViewModel(container.auth) } })
                    LoginScreen(vm)
                } else {
                    AppNav(session = current, flows = container.flows, forms = container.forms, onSignOut = container.auth::signOut)
                }
                }
            }
        }
    }
}
