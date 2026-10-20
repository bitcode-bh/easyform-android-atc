package com.easyform.next.ui.modules

import android.graphics.BitmapFactory
import android.util.Base64
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import com.easyform.next.data.ModuleItem
import com.easyform.next.ui.components.AppCard
import com.easyform.next.ui.components.RowDivider
import com.easyform.next.ui.components.TitledRow
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** One card of module rows; used by Home and by every level under it, so they look and behave the same. */
@Composable
fun ModuleCard(modules: List<ModuleItem>, onOpen: (ModuleItem) -> Unit) {
    AppCard {
        Column {
            modules.forEachIndexed { index, module ->
                TitledRow(
                    title = module.title, subtitle = module.subtitle, onClick = { onOpen(module) },
                    leading = { ModuleIcon(module) },
                )
                if (index < modules.lastIndex) RowDivider()
            }
        }
    }
}

/** The module's own icon when the server sent one, else its first letters. */
@Composable
private fun ModuleIcon(module: ModuleItem) {
    val bitmap by produceState<ImageBitmap?>(null, module.iconBase64) {
        value = module.iconBase64?.let { text ->
            withContext(Dispatchers.Default) {
                try {
                    val bytes = Base64.decode(text.substringAfter("base64,"), Base64.DEFAULT)
                    BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.asImageBitmap()
                } catch (e: Exception) { null }
            }
        }
    }
    val image = bitmap
    if (image != null) {
        Image(image, contentDescription = null, contentScale = ContentScale.Fit, modifier = Modifier.size(40.dp).clip(MaterialTheme.shapes.small))
    } else {
        com.easyform.next.ui.components.Mark(module.title.take(2))
    }
}
