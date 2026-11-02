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

            // Native TV Player Bridge for in-app ExoPlayer and VLC fallback
            webView.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void launchExoPlayer(final String url, final String title, final String fileId, final long positionMs) {
                    launchExoPlayer(url, title, fileId, positionMs, "");
                }

                @JavascriptInterface
                public void launchExoPlayer(final String url, final String title, final String fileId, final long positionMs, final String subtitleUrl) {
                    MainActivity.this.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                Intent intent = new Intent(MainActivity.this, PlayerActivity.class);
                                intent.putExtra("url", url);
                                intent.putExtra("title", title);
                                intent.putExtra("fileId", fileId);
                                intent.putExtra("position", positionMs);
                                if (subtitleUrl != null && !subtitleUrl.isEmpty()) {
                                    intent.putExtra("subtitleUrl", subtitleUrl);
                                }
                                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                startActivity(intent);
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        }
                    });
                }

                @JavascriptInterface
                public void launchExternalPlayer(final String url, final String title, final String subtitleUrl, final long positionMs) {
                    MainActivity.this.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
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
                    });
                }
            }, "TVPlayerBridge");
        }
    }
}
