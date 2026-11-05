package app.sonara.music;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    /** build.sh replaces this with the working app URL */
    private static final String APP_URL = "__APP_URL__";

    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        window.setStatusBarColor(Color.parseColor("#050508"));
        window.setNavigationBarColor(Color.parseColor("#050508"));

        // Foreground service: background me app kabhi band na ho
        try {
            Intent svc = new Intent(this, PlaybackService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(svc);
            } else {
                startService(svc);
            }
        } catch (Exception ignored) {
        }

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#050508"));

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setUserAgentString(s.getUserAgentString() + " SonaraAndroid/1.1");
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            s.setSafeBrowsingEnabled(true);
        }

        // Likes / playlists / Google session cookies must persist across app restarts,
        // and the embedded YouTube player needs third-party cookies.
        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        cm.setAcceptThirdPartyCookies(web, true);

        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme() == null ? "" : uri.getScheme();
                String host = uri.getHost() == null ? "" : uri.getHost();
                // Google blocks OAuth inside WebViews (disallowed_useragent):
                // finish the login in the real browser, then come back via sonara://auth
                if (host.equals("accounts.google.com") || host.endsWith(".accounts.google.com")) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    } catch (Exception ignored) {
                    }
                    return true;
                }
                if (scheme.equals("sonara")) {
                    handleAuthIntent(uri);
                    return true;
                }
                if (scheme.startsWith("http")) {
                    // Keep the SONARA app and its audio streams inside the app.
                    return false;
                }
                // External schemes (intent://, market:, …) leave the app.
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception ignored) {
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Edge-to-edge feel once loaded.
                View decor = getWindow().getDecorView();
                decor.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
            }
        });

        setContentView(web);

        // Android 13+: allow the playback notification to be shown.
        if (Build.VERSION.SDK_INT >= 33) {
            try {
                requestPermissions(new String[] {"android.permission.POST_NOTIFICATIONS"}, 7);
            } catch (Exception ignored) {
            }
        }

        Uri launch = getIntent() != null ? getIntent().getData() : null;
        if (launch != null && "sonara".equals(launch.getScheme())) {
            handleAuthIntent(launch);
        } else if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(APP_URL);
        }
    }

    /** sonara://auth?t=TOKEN → let the WebView claim the Google session. */
    private void handleAuthIntent(Uri uri) {
        if (web == null || uri == null) return;
        String token = uri.getQueryParameter("t");
        if (token != null && token.length() > 10) {
            web.loadUrl(APP_URL + "/api/auth/claim?t=" + Uri.encode(token));
        } else {
            web.loadUrl(APP_URL);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        Uri data = intent != null ? intent.getData() : null;
        if (data != null && "sonara".equals(data.getScheme())) {
            handleAuthIntent(data);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (web != null) web.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
        // Audio chalta rahe — sirf rendering rokein, media nahi.
        // (web.onPause() audio bhi rok deta hai, is liye call NAHI karte)
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
    }

    @Override
    protected void onStop() {
        super.onStop();
        // Kuch nahi — WebView zinda rehta hai taake music chalta rahe.
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
