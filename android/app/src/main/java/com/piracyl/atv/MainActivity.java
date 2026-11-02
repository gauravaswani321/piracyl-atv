package com.piracyl.atv;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            // Allow media playback without requiring a user touch gesture on Android TV
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);

            // Native TV Player Bridge for zero-jitter, full-audio hardware playback (VLC, Just Player, Nova)
            webView.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void launchExternalPlayer(String url, String title, String subtitleUrl, long positionMs) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        intent.setDataAndType(Uri.parse(url), "video/*");
                        if (title != null && !title.isEmpty()) {
                            intent.putExtra("title", title);
                        }
                        if (positionMs > 0) {
                            intent.putExtra("position", positionMs);
                        }
                        if (subtitleUrl != null && !subtitleUrl.isEmpty()) {
                            intent.putExtra("subtitles_location", subtitleUrl);
                        }
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);

                        Intent chooser = Intent.createChooser(intent, "Play Video With");
                        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(chooser);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }, "TVPlayerBridge");
        }
    }
}
