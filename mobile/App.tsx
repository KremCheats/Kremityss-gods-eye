import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";

type AppState = "loading" | "ready" | "error";

const DEFAULT_URL = "https://kremdevai.com";
const KREMCHEATS_LOGO = require("./assets/kremcheats-logo.jpg");
const PAGE_HANDSHAKE = `
  (function () {
    function report() {
      var title = document.getElementById('title-bar');
      var globe = document.getElementById('cesiumContainer');
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'kremityss-page-ready',
        title: !!title,
        globe: !!globe
      }));
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', report, { once: true });
    } else {
      report();
    }
    setTimeout(report, 1500);
  })();
  true;
`;

function getWebsiteUrl() {
  const configured = process.env.EXPO_PUBLIC_WEBSITE_URL;
  const extra = Constants.expoConfig?.extra?.websiteUrl;
  return configured || extra || DEFAULT_URL;
}

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [appState, setAppState] = useState<AppState>("loading");
  const [currentUrl, setCurrentUrl] = useState(getWebsiteUrl());
  const websiteUrl = useMemo(() => getWebsiteUrl(), []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAppState((state) => (state === "ready" ? state : "error"));
    }, 15000);
    return () => clearTimeout(timeout);
  }, []);

  const retry = () => {
    setAppState("loading");
    webViewRef.current?.reload();
  };

  const share = async () => {
    await Share.share({
      title: "Kremityss Live",
      message: `Open Kremityss Live: ${currentUrl}`,
      url: currentUrl,
    });
  };

  const onNavigationStateChange = (navigation: WebViewNavigation) => {
    setCurrentUrl(navigation.url || websiteUrl);
  };

  const onMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === "kremityss-page-ready" && message.title && message.globe) {
        setAppState("ready");
      }
    } catch {
      // Ignore non-JSON messages from the hosted page.
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.brandLockup}>
          <Image accessibilityLabel="KremCheats by Kremityss" source={KREMCHEATS_LOGO} style={styles.brandLogo} />
          <View>
            <Text style={styles.title}>KREMITYSS</Text>
            <Text style={styles.subtitle}>GOD&apos;S EYE // LIVE</Text>
          </View>
        </View>
        <Pressable
          accessibilityLabel="Share Kremityss Live"
          onPress={share}
          style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
        >
          <Text style={styles.shareText}>SHARE</Text>
        </Pressable>
      </View>

      <View style={styles.webViewFrame}>
        <WebView
          ref={webViewRef}
          source={{ uri: websiteUrl }}
          style={styles.webView}
          javaScriptEnabled
          domStorageEnabled
          allowsBackForwardNavigationGestures
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          originWhitelist={["https://*", "http://*"]}
          cacheEnabled
          incognito={false}
          injectedJavaScript={PAGE_HANDSHAKE}
          onLoadStart={() => setAppState("loading")}
          onLoadEnd={() => undefined}
          onError={() => setAppState("error")}
          onHttpError={() => setAppState("error")}
          onMessage={onMessage}
          onNavigationStateChange={onNavigationStateChange}
          startInLoadingState
          renderLoading={() => <LoadingOverlay />}
        />
        {appState === "error" && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorEyebrow}>SIGNAL LOST</Text>
            <Text style={styles.errorTitle}>Kremityss is offline</Text>
            <Text style={styles.errorCopy}>
              The live Kremityss feed did not load from kremdevai.com. Check your connection and reconnect.
            </Text>
            <Pressable
              accessibilityLabel="Reload Kremityss Live"
              onPress={retry}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            >
              <Text style={styles.retryText}>RECONNECT</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function LoadingOverlay() {
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator color="#b46cff" size="large" />
      <Text style={styles.loadingText}>ESTABLISHING LIVE LINK</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#07040f" },
  header: {
    alignItems: "center",
    backgroundColor: "#0b0717",
    borderBottomColor: "#261445",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 66,
    paddingHorizontal: 18,
  },
  brandLockup: { alignItems: "center", flexDirection: "row", gap: 10 },
  brandLogo: { borderColor: "#9b4dff", borderRadius: 15, borderWidth: 1, height: 30, width: 30 },
  title: { color: "#f6f0ff", fontSize: 15, fontWeight: "700", letterSpacing: 2.8 },
  subtitle: { color: "#9b4dff", fontSize: 9, fontWeight: "600", letterSpacing: 1.4, marginTop: 2 },
  shareButton: { borderColor: "#5e3389", borderRadius: 5, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  shareText: { color: "#d9b1ff", fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },
  pressed: { opacity: 0.65, transform: [{ scale: 0.97 }] },
  webViewFrame: { backgroundColor: "#07040f", flex: 1, position: "relative" },
  webView: { backgroundColor: "#07040f", flex: 1 },
  loadingOverlay: { alignItems: "center", backgroundColor: "#07040f", flex: 1, justifyContent: "center" },
  loadingText: { color: "#a77bcf", fontSize: 10, fontWeight: "600", letterSpacing: 1.6, marginTop: 16 },
  errorOverlay: { alignItems: "center", backgroundColor: "#07040f", bottom: 0, justifyContent: "center", left: 0, padding: 28, position: "absolute", right: 0, top: 0 },
  errorEyebrow: { color: "#f07aa9", fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  errorTitle: { color: "#f6f0ff", fontSize: 24, fontWeight: "700", marginTop: 10, textAlign: "center" },
  errorCopy: { color: "#b4a7c2", fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 280, textAlign: "center" },
  retryButton: { backgroundColor: "#9b4dff", borderRadius: 5, marginTop: 24, paddingHorizontal: 20, paddingVertical: 13 },
  retryText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
});
