package com.easyform.next.ui.nav

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Route
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.List
import androidx.compose.material.icons.outlined.Route
import androidx.compose.material.icons.outlined.School
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.easyform.next.ui.home.HomeScreen
import com.easyform.next.ui.lms.LmsScreen
import com.easyform.next.ui.placeholder.NotBuiltYet

private enum class Tab(val route: String, val label: String, val on: ImageVector, val off: ImageVector) {
    Home("home", "Home", Icons.Filled.Home, Icons.Outlined.Home),
    StartTrip("start", "Start Trip", Icons.Filled.Route, Icons.Outlined.Route),
    Trips("trips", "Trips", Icons.Filled.List, Icons.Outlined.List),
    Lms("lms", "LMS", Icons.Filled.School, Icons.Outlined.School),
}

/** One activity, one back stack. A tab keeps its state when you leave it and come back (no rebuild, no loader). */
@Composable
fun AppNav(session: com.easyform.next.data.auth.Session, flows: com.easyform.next.data.flow.FlowRepository, onSignOut: () -> Unit) {
    val nav = rememberNavController()
    val entry by nav.currentBackStackEntryAsState()
    Scaffold(
        bottomBar = {
            NavigationBar {
                Tab.entries.forEach { tab ->
                    val selected = entry?.destination?.hierarchy?.any { it.route == tab.route } == true
                    NavigationBarItem(
                        selected = selected,
                        onClick = {
                            nav.navigate(tab.route) {
                                popUpTo(nav.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(if (selected) tab.on else tab.off, contentDescription = tab.label) },
                        label = { Text(tab.label) },
                    )
                }
            }
        },
    ) { padding ->
        NavHost(nav, startDestination = Tab.Home.route, modifier = Modifier.padding(padding).statusBarsPadding()) {
            composable(Tab.Home.route) { HomeScreen(session, flows, onSignOut) }
            composable(Tab.StartTrip.route) { NotBuiltYet("Start Trip", "phase 8 (trip tracking)") }
            composable(Tab.Trips.route) { NotBuiltYet("Trips", "phase 3 (trip list)") }
            composable(Tab.Lms.route) { LmsScreen() }
        }
    }
}
