package com.easyform.next.ui.nav

import androidx.compose.foundation.layout.padding
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
import android.net.Uri
import androidx.navigation.NavController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.navArgument
import androidx.navigation.navigation
import com.easyform.next.data.ModuleItem
import com.easyform.next.ui.form.FormScreen
import com.easyform.next.ui.modules.FlowScreen
import com.easyform.next.ui.modules.ModuleLevelScreen
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.easyform.next.ui.home.HomeScreen
import com.easyform.next.ui.lms.LmsScreen
import com.easyform.next.ui.placeholder.NotBuiltYet

private enum class Tab(val route: String, val label: String, val on: ImageVector, val off: ImageVector) {
    Home("homeTab", "Home", Icons.Filled.Home, Icons.Outlined.Home),
    StartTrip("start", "Start Trip", Icons.Filled.Route, Icons.Outlined.Route),
    Trips("trips", "Trips", Icons.Filled.List, Icons.Outlined.List),
    Lms("lms", "LMS", Icons.Filled.School, Icons.Outlined.School),
}

/** One activity, one back stack. A tab keeps its state when you leave it and come back (no rebuild, no loader). */
@Composable
fun AppNav(session: com.easyform.next.data.auth.Session, flows: com.easyform.next.data.flow.FlowRepository, forms: com.easyform.next.data.form.FormRepository, onSignOut: () -> Unit) {
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
        NavHost(nav, startDestination = Tab.Home.route, modifier = Modifier.padding(padding)) {
            navigation(startDestination = "home", route = Tab.Home.route) {
                composable("home") {
                    HomeScreen(session, flows, onSignOut, onOpen = { open(nav, it) })
                }
                composable(
                    "module/{id}/{title}",
                    arguments = listOf(navArgument("id") { type = NavType.IntType }, navArgument("title") { type = NavType.StringType }),
                ) { e ->
                    ModuleLevelScreen(
                        session, flows, parentId = e.arguments?.getInt("id") ?: 0, title = Uri.decode(e.arguments?.getString("title").orEmpty()),
                        onOpen = { open(nav, it) }, onBack = { nav.popBackStack() },
                    )
                }
                composable(
                    "flow/{flowId}/{title}/{type}",
                    arguments = listOf(navArgument("flowId") { type = NavType.IntType }),
                ) { e ->
                    val flowId = e.arguments?.getInt("flowId") ?: 0
                    FlowScreen(
                        forms, flowId, Uri.decode(e.arguments?.getString("title").orEmpty()), e.arguments?.getString("type").orEmpty(),
                        onOpenForm = { checksheetId, name -> nav.navigate("form/$checksheetId/$flowId/${Uri.encode(name)}") },
                        onBack = { nav.popBackStack() },
                    )
                }
                composable(
                    "form/{checksheetId}/{flowId}/{title}",
                    arguments = listOf(navArgument("checksheetId") { type = NavType.IntType }, navArgument("flowId") { type = NavType.IntType }),
                ) { e ->
                    val checksheetId = e.arguments?.getInt("checksheetId") ?: 0
                    val flowId = e.arguments?.getInt("flowId") ?: 0
                    FormScreen(forms, checksheetId, scope = "${session.username}:$flowId:$checksheetId", title = Uri.decode(e.arguments?.getString("title").orEmpty()), onClose = { nav.popBackStack() })
                }
            }
            composable(Tab.StartTrip.route) { NotBuiltYet("Start Trip", "phase 8 (trip tracking)") }
            composable(Tab.Trips.route) { NotBuiltYet("Trips", "phase 3 (trip list)") }
            composable(Tab.Lms.route) { LmsScreen() }
        }
    }
}

/** A tap on a module: a Module opens the level under it; anything else is a flow (or a report) at the end of the tree. */
private fun open(nav: NavController, module: ModuleItem) {
    if (module.opensChildren) nav.navigate("module/${module.id}/${Uri.encode(module.title)}")
    else nav.navigate("flow/${module.flowId}/${Uri.encode(module.title)}/${Uri.encode(module.type)}")
}
