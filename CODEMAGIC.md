# Codemagic iOS build

The repository now includes `codemagic.yaml` for producing a signed Kremityss Live IPA.

## One-time Codemagic setup

1. Connect this GitHub repository in Codemagic.
2. Add the Apple Developer integration and create/import an App Store distribution certificate and provisioning profile for `com.kremityss.godseye`.
3. Confirm the Codemagic workflow is named `kremityss-ios`.
4. If the website is deployed at a different URL, change `EXPO_PUBLIC_WEBSITE_URL` in the workflow or in Codemagic environment variables.
5. Start the workflow. The signed `.ipa` is published under Artifacts when the build completes.

The website in the repository root remains unchanged. The iOS app lives in `mobile/` and wraps that live website in a branded native WebView with reconnect and share controls.
