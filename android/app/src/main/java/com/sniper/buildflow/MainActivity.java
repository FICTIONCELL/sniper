package com.sniper.buildflow;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.CookieManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configure WebView for proper authentication and login
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings webSettings = webView.getSettings();

            // Set initial zoom scale to 80%
            webSettings.setTextZoom(80);
            webSettings.setLoadWithOverviewMode(true);
            webSettings.setUseWideViewPort(true);

            // Enable DOM storage for localStorage and sessionStorage
            webSettings.setDomStorageEnabled(true);

            // Enable JavaScript (should be default but ensuring it)
            webSettings.setJavaScriptEnabled(true);

            // Enable database storage
            webSettings.setDatabaseEnabled(true);

            // Allow mixed content (HTTP and HTTPS)
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

            // Configure cookies for authentication - persist cookies
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);

            // Enable cache for better performance and offline support
            webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
           
        }
    }
}
