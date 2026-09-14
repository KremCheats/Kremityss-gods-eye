# Kremityss Live iOS companion

This Expo app preserves the existing Kremityss website and presents it in an iOS-native shell with branded loading, offline/error recovery, reload, and share actions. The website itself remains in the repository root and is not replaced.

## Configure the website URL

The default URL is `https://kremityss-gods-eye.manus.space`. Override it for a deployment with:

```bash
EXPO_PUBLIC_WEBSITE_URL=https://your-live-domain.example npm run start
```

For a permanent release URL, update `extra.websiteUrl` in `app.json` or set the environment variable during the EAS build.

## Run locally

```bash
npm install
npm run start
```

Then scan the Expo QR code with Expo Go, or run `npm run ios` on a Mac with Xcode.

## Build an IPA

An iOS IPA requires Apple signing credentials and a macOS/Xcode or EAS cloud build. From this directory, after installing and logging into EAS:

```bash
npx eas login
npx eas build --platform ios --profile preview
```

Use `--profile production` for an App Store/TestFlight build. This Linux workspace can validate the Expo bundle, but it cannot sign a native iOS IPA locally because Xcode is macOS-only.
