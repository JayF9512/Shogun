# Shadows of the Shogun — Unity Client Build Instructions

This is the **presentation-only** Unity client for *Shadows of the Shogun*. All
game state is server-authoritative (spec §98); the client renders state and
relays input to the live backend. Follow the steps below to open the project,
build an Android APK (e.g. for BlueStacks), or build for iOS.

- **App name:** Shadows of the Shogun
- **Company:** ShogunStudios
- **Version:** 0.1.0
- **Android application id:** `com.shogunstudios.shadowsoftheshogun`
- **Live backend API:** `https://728065aeb.abacusai.cloud/api` (already configured — see [Backend](#connecting-to-the-live-backend))

---

## 1. Install Unity

1. Install **Unity Hub**: https://unity.com/download
2. From Unity Hub → **Installs → Install Editor**, install **Unity 2022.3 LTS**
   (the project is pinned to `2022.3.40f1` in `ProjectSettings/ProjectVersion.txt`;
   any recent 2022.3.x LTS or **Unity 6** will open it and offer to upgrade).
3. During installation, **add these modules**:
   - **Android Build Support** — and expand it to also tick:
     - **Android SDK & NDK Tools**
     - **OpenJDK**
   - **iOS Build Support** (only if you will build for iPhone/iPad; requires macOS).

> Ticking *Android SDK & NDK Tools* + *OpenJDK* lets Unity manage the SDK/NDK/JDK
> for you — no manual Android Studio setup required.

## 2. Open the project

1. Unity Hub → **Add → Add project from disk** → select the `unity/` folder
   (the folder containing `Assets/`, `Packages/`, `ProjectSettings/`).
2. Open it with the 2022.3 LTS (or Unity 6) editor. The first import resolves
   packages (TextMeshPro, Input System, Newtonsoft JSON, Test Framework) and
   generates `.meta`/`Library/` data — this can take a few minutes.
3. If prompted to install **TextMeshPro Essentials**, click **Import TMP Essentials**.
4. Open **File → Build Settings**. The six scenes are already registered in
   build order:

   | # | Scene | Purpose |
   |---|-------|---------|
   | 0 | `Bootstrap` | Entry point: init services, route by stored session |
   | 1 | `Login`     | Login / registration |
   | 2 | `Main`      | Settlement hub (resource HUD + nav) |
   | 3 | `Heroes`    | Hero roster |
   | 4 | `WorldMap`  | World map |
   | 5 | `Battle`    | Battle screen |

   Scene 0 (`Bootstrap`) must remain first so the app boots correctly.

## 3. Build an Android APK (for BlueStacks or a device)

1. **File → Build Settings → Platform: Android → Switch Platform.**
   (Wait for assets to re-import for Android.)
2. Confirm settings in **Edit → Project Settings → Player → Android**:
   - Company Name: `ShogunStudios`, Product Name: `Shadows of the Shogun`
   - **Other Settings → Identification → Package Name:** `com.shogunstudios.shadowsoftheshogun`
   - **Minimum API Level:** Android 7.0 (API 24)
   - **Target API Level:** Android 13 (API 33)
   - **Scripting Backend:** IL2CPP, **Target Architectures:** ARMv7 + ARM64
   - Default orientation: **Portrait**
3. If Unity reports a missing SDK/NDK/JDK, set them under
   **Edit → Preferences → External Tools → Android** (tick *Use Unity's* for each),
   or point them at your own installs.
4. Back in **Build Settings**, ensure **Build App Bundle (Google Play)** is
   **unchecked** for a plain APK, then click **Build** (or **Build And Run**).
   Choose an output path — Unity produces `ShadowsOfTheShogun.apk`.

### Installing the APK on BlueStacks
- **Drag & drop** the `.apk` onto the BlueStacks window, **or**
- BlueStacks → **Install APK** (side toolbar) → select the `.apk`.
- Launch from the BlueStacks home screen. BlueStacks emulates ARM/x86; a
  standard IL2CPP ARMv7+ARM64 build runs on recent BlueStacks 5 versions.

## 4. Build for iOS (macOS + Xcode required)

1. On a Mac with **Xcode** installed, open the project in Unity.
2. **File → Build Settings → Platform: iOS → Switch Platform.**
3. **Player → iOS Settings:** set the same bundle id
   `com.shogunstudios.shadowsoftheshogun`, portrait orientation, and your
   **Signing Team ID** (Apple Developer account) under *Signing*.
4. Click **Build** → choose an output folder → Unity generates an **Xcode project**.
5. Open the generated `Unity-iPhone.xcodeproj` in Xcode, select your device/
   signing team, and **Run** / **Archive** to deploy or submit.

## 5. Connecting to the live backend

The client is **already wired to the live backend** — no configuration needed:

- `Assets/Scripts/Core/Constants.cs` sets
  `ApiBaseUrl = "https://728065aeb.abacusai.cloud/api"`.
- `GameManager` builds an `ApiClient` against that URL and registers all network
  services (Auth, Player, Economy, Store, **Content**, **SeasonPass**,
  **Leaderboard**, …) in the `ServiceLocator` at boot.
- To point at a different environment (e.g. a local server), either edit
  `Constants.ApiBaseUrl`, or set the **Api Base Url** field on the `GameManager`
  component in the `Bootstrap` scene (it defaults to `Constants.ApiBaseUrl`).

> The backend uses standard HTTPS + bearer tokens. The client stores refresh
> tokens in `PlayerPrefs` and silently restores sessions on launch; on a 401 the
> `ApiClient` refreshes the token once and retries automatically.

## 6. Project layout

```
unity/
├── Assets/
│   ├── Scenes/            # Bootstrap, Login, Main, Heroes, WorldMap, Battle
│   ├── Scripts/           # C# gameplay/UI/network code (namespace ShadowsOfTheShogun.*)
│   ├── Textures/          # Artwork (splash, backgrounds, heroes, icons, …)
│   └── Resources/         # Localisation (en/ja) + Audio (drop clips here)
├── Packages/manifest.json # Package dependencies
└── ProjectSettings/       # Player, quality, input, graphics, etc.
```

## 7. Troubleshooting

- **"Scene not in Build Settings" warning at runtime** — open File → Build
  Settings and confirm all six scenes are listed and enabled (they ship
  pre-registered in `ProjectSettings/EditorBuildSettings.asset`).
- **Package resolution errors** — Window → Package Manager → **Resolve** /
  restart the editor so it can fetch the pinned package versions.
- **UI screens have no input** — the scenes ship minimal (Camera + Canvas +
  controller). Add an **EventSystem** (GameObject → UI → Event System) and wire
  the serialized fields on `LoginScreen` / `MainScreen` to your UI widgets in
  the Inspector; the scripts null-guard everything so scenes load cleanly first.
- **Android build fails on SDK/NDK** — reinstall the *Android SDK & NDK Tools*
  and *OpenJDK* modules via Unity Hub → *Add Modules*.
