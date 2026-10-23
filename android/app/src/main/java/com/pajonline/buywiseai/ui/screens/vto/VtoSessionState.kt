package com.pajonline.buywiseai.ui.screens.vto

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

object VtoSessionState {
    var targetGarmentTitle by mutableStateOf<String?>(null)
    var targetGarmentImageUrl by mutableStateOf<String?>(null)
    var targetGarmentPrice by mutableStateOf<Int?>(null)
    var targetGarmentCategory by mutableStateOf<String?>("dresses")
    var targetCompetitionId by mutableStateOf<String?>(null)
    var targetRetailer by mutableStateOf<String?>(null)
    var targetSize by mutableStateOf<String?>(null)
    var lastGeneratedLookUri by mutableStateOf<String?>(null)

    fun setTarget(
        title: String,
        imageUrl: String?,
        price: Number,
        compId: String? = null,
        retailer: String? = null,
        category: String? = "dresses",
        size: String? = null
    ) {
        targetGarmentTitle = title
        targetGarmentImageUrl = imageUrl
        targetGarmentPrice = price.toInt()
        targetCompetitionId = compId
        targetRetailer = retailer
        targetGarmentCategory = category ?: "dresses"
        targetSize = size
    }

    fun clear() {
        targetGarmentTitle = null
        targetGarmentImageUrl = null
        targetGarmentPrice = null
        targetCompetitionId = null
        targetRetailer = null
        targetSize = null
    }
}
