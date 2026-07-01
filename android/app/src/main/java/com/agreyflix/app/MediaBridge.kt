package com.agreyflix.app

import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONArray
import org.json.JSONObject

class MediaBridge(
    private val activity: AppCompatActivity,
    private val mediaAccessManager: MediaAccessManager,
    private val permissionManager: PermissionManager
) {
    @JavascriptInterface
    fun checkPermissions(): String {
        val pending = permissionManager.getPendingPermissions()
        val isGranted = pending.none { it.contains("MEDIA") || it.contains("STORAGE") }
        return if (isGranted) "granted" else "prompt"
    }

    @JavascriptInterface
    fun requestPermissions() {
        activity.runOnUiThread {
            permissionManager.requestAppPermissions { result ->
                val pending = permissionManager.getPendingPermissions()
                val isGranted = pending.none { it.contains("MEDIA") || it.contains("STORAGE") }
                val webView = activity.findViewById<WebView>(R.id.webView)
                webView?.evaluateJavascript(
                    "if (window.onAndroidPermissionResult) { window.onAndroidPermissionResult('$isGranted'); }", null
                )
            }
        }
    }

    @JavascriptInterface
    fun getLocalVideos(): String {
        val list = mediaAccessManager.queryLocalVideos()
        val jsonArray = JSONArray()
        for (item in list) {
            val obj = JSONObject()
            obj.put("id", "vid_native_${item.id}")
            obj.put("name", item.displayName.replace(Regex("\\.[^/.]+$"), ""))
            obj.put("fullName", item.displayName)
            obj.put("size", formatBytes(item.size))
            obj.put("type", item.mimeType)
            obj.put("url", "https://local.agreyflix.app/media/video?id=${item.id}")
            obj.put("path", item.uri.toString())
            obj.put("duration", formatDuration(item.durationMs))
            obj.put("addedAt", System.currentTimeMillis())
            // Signal to UI that this is a native file and does not require manual file object re-selection
            obj.put("isNative", true)
            jsonArray.put(obj)
        }
        return jsonArray.toString()
    }

    @JavascriptInterface
    fun getLocalMusic(): String {
        val list = mediaAccessManager.queryLocalAudio()
        val jsonArray = JSONArray()
        for (item in list) {
            val obj = JSONObject()
            obj.put("id", "aud_native_${item.id}")
            obj.put("name", item.displayName.replace(Regex("\\.[^/.]+$"), ""))
            obj.put("fullName", item.displayName)
            obj.put("size", formatBytes(item.size))
            obj.put("type", item.mimeType)
            obj.put("url", "https://local.agreyflix.app/media/audio?id=${item.id}")
            obj.put("path", item.uri.toString())
            obj.put("artist", "Device Artist")
            obj.put("album", "Device Album")
            obj.put("duration", formatDuration(item.durationMs))
            obj.put("addedAt", System.currentTimeMillis())
            obj.put("isNative", true)
            jsonArray.put(obj)
        }
        return jsonArray.toString()
    }

    private fun formatBytes(bytes: Long): String {
        if (bytes <= 0) return "0 Bytes"
        val units = arrayOf("Bytes", "KB", "MB", "GB", "TB")
        val digitGroups = (Math.log10(bytes.toDouble()) / Math.log10(1024.0)).toInt()
        if (digitGroups >= units.size) return "$bytes Bytes"
        return String.format("%.2f %s", bytes / Math.pow(1024.0, digitGroups.toDouble()), units[digitGroups])
    }

    private fun formatDuration(ms: Long): String {
        if (ms <= 0) return "00:00"
        val totalSecs = ms / 1000
        val mins = totalSecs / 60
        val secs = totalSecs % 60
        return String.format("%02d:%02d", mins, secs)
    }
}
