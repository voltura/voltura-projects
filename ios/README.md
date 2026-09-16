# Voltura Projects for iPhone and iPad

Native SwiftUI app, Swift 5.9+, iOS 17+. Open `VolturaProjects.xcodeproj` in Xcode 15 or later. No third-party Swift dependencies.

Features: real repository imagery with fallback, native instant multi-term search across name/title/description/language/topics, updated/name/stars/created sorting with alphabetical ties, result count/reset, metadata and archived labels, separate GitHub/product/YouTube/Pinterest links including multiple destinations, pull-to-refresh, local catalog persistence, refresh timing, Dynamic Type and VoiceOver labels. The app uses system browser links, not a web-view gallery.

## Backend choice

Convex and Vercel are installed and enabled in Codex. Vercel already hosts the working public catalog endpoint, so this app reuses `https://voltura-projects-drab.vercel.app/api/catalog`. That endpoint delegates to the existing Sites D1 importer. Convex is not required for this browsing-only app; no second database or credentials were provisioned.

Keep both the Vercel endpoint and Sites catalog service running. All clients share the same six-hour, visit-triggered GitHub refresh queue. The app polls every five seconds during a refresh, every five minutes otherwise, and retries after one minute on connection failure. Polling stops when the app leaves the foreground. Pull-to-refresh reads the latest catalog; it does not force GitHub refresh before the six-hour deadline. Times display in the device's time zone.

The last successful catalog is saved atomically in Application Support. A bundled public catalog makes first launch useful offline; images still require network access unless the OS happens to retain them. The app never replaces a saved catalog with the server's unavailable fallback. No GitHub, Vercel or Convex secrets belong in the app. Repository text is rendered as text; only HTTP(S) outbound links are accepted. Artwork loads over HTTPS; unsupported formats or failures fall through to another image or a text placeholder.

## Building from Windows

The `iOS build` GitHub Actions workflow runs the Swift catalog tests and compiles the full iPhone/iPad app on a hosted Mac. Its downloadable `.app` artifact is for a Mac's iOS Simulator, not for direct installation on an iPhone or Windows. You can review build status and download the artifact through GitHub without owning a Mac.

For a physical iPhone, TestFlight/App Store distribution requires an Apple Developer membership, signing configuration and App Store Connect access. These have not been configured. No claim of App Store readiness or device installation is made.

On a Mac:

```sh
cd ios
swift test
xcodebuild -project VolturaProjects.xcodeproj -scheme VolturaProjects -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

For local device builds, select your signing team and a unique bundle ID in Xcode. The default bundle ID is `se.voltura.projects`. Open the shared `VolturaProjects` scheme, choose an iPhone or iPad simulator, and Run.

## Verification

Unit tests cover metadata search, all sort orders, ties, timestamp formats, the six-hour interval, missing descriptions, archived originals, unsafe URLs, and multiple/deduplicated external destinations. The workflow additionally compiles all SwiftUI screens. Visual simulator checks (phone/tablet layouts, largest Dynamic Type, VoiceOver, artwork failures, foreground/background transitions, airplane-mode persistence) still need a Mac simulator or signed physical device.
