# Shadows of the Shogun — Unity Client (Phase 3)

The Unity client is **presentation-only**. All authoritative game state and rule
resolution live in the `backend/` NestJS API (spec §98: *client predicts, server
validates*). The client renders state, handles input, predicts outcomes for a
snappy feel, and always reconciles against the server.

- **Engine:** Unity 6 (6000.0 LTS) or Unity 2022.3 LTS+
- **UI:** Unity UI (uGUI) + TextMeshPro
- **Language:** C# 9 / .NET Standard 2.1
- **Networking:** `UnityWebRequest` wrapped by `Network/ApiClient.cs`

---

## Importing into Unity

1. Open Unity Hub → **Add project from disk** → select this `unity/` folder.
2. Open with **Unity 6** (or 2022.3 LTS+). Unity will import assets and generate
   `.meta` files on first open (they are intentionally not committed here since
   no Unity editor produced them).
3. Ensure **TextMeshPro** is installed (Window → TextMeshPro → Import TMP
   Essentials). The runtime assembly references `Unity.TextMeshPro`.
4. Open the Test Runner (Window → General → Test Runner) to run EditMode tests.

> If you add art/audio, place loadable audio under `Assets/Resources/Audio/<key>`
> and locale tables under `Assets/Resources/Localisation/<locale>.json`.

---

## Folder conventions

```
Assets/Scripts/
├── Core/          Bootstrap, service locator, event bus, constants
├── Data/
│   ├── Models/        Serializable DTOs matching backend responses
│   └── Definitions/   ScriptableObjects for data-driven balance config
├── Network/       ApiClient + one service class per backend domain
├── Settlement/    Home base view, buildings, construction, resource HUD
├── WorldMap/      Camera, tiles, march animation, scouting
├── Combat/        Client-side battle prediction + battle UI
├── Heroes/        Roster, detail, skill tree, relationships
├── Troops/        Training, hospital, counts
├── Economy/       Resource cache, currencies, collection & offline UI
├── Store/         Catalog UI + server-validated IAP flow
├── Clan/          Clan home, members, territory, diplomacy
├── Seasons/       Season HUD, season pass, seasonal visuals
├── Events/        LiveOps event browser + banners
├── Mail/          Inbox + reward claiming
├── UI/            Screen stack, HUD, dialogs, toasts, accessibility
├── Audio/         BGM/SFX manager + volume settings
├── Localisation/  Locale loader + auto-translating text component
├── Analytics/     Funnel + telemetry event tracking
├── DevTools/      In-game console + gated dev cheats
└── Tests/         EditMode unit tests
```

### Namespaces
Every folder maps to a namespace under `ShadowsOfTheShogun.*`
(e.g. `ShadowsOfTheShogun.Combat`). The runtime assembly is defined by
`Assets/Scripts/ShadowsOfTheShogun.asmdef`; tests by
`Assets/Scripts/Tests/ShadowsOfTheShogun.Tests.asmdef`.

---

## Coding standards

- **Server authority.** Never grant resources, currency, entitlements, or timer
  completion on the client. Predict optimistically, then confirm with the server
  and roll back on rejection (`Economy/ResourceManager.cs`).
- **Data-driven balance.** Tunable values live in `Data/Definitions/*SO`
  ScriptableObjects and in `Core/Constants.cs`; the server owns the canonical copy.
- **Decoupling.** Cross-system communication goes through `Core/EventBus`; shared
  services are resolved via `Core/ServiceLocator`.
- **Async I/O.** All HTTP goes through `Network/ApiClient` (coroutine + callback).
  A single automatic token refresh + retry is handled on `401`.
- **Accessibility first (spec §108).** Honour `UI/AccessibilityManager` for text
  scale, colour-blind mode, reduced motion, vibration, flash reduction, battle
  speed and auto-battle.
- **Localisation (spec §109).** Never hard-code user-facing strings; use
  `Localisation/LocalisedText` or `LocalisationManager.Get/GetPlural`.

---

## Client ↔ server parity (must stay in sync)

| Client                              | Backend                         |
|-------------------------------------|---------------------------------|
| `Combat/BattleResolver`             | `combat/combat.service.ts`      |
| `Economy/ResourceManager`           | `economy/economy.service.ts`    |
| `WorldMap/MarchAnimator` (ETA)      | `march/march.service.ts`        |
| `Settlement/IndustrialUI`           | `progression/progression.service.ts` |
| `Store/PurchaseHandler`             | `purchase/purchase.service.ts`  |

The `BattleResolverTests` lock the counter table and power math to the server
rules so client prediction and server resolution never diverge.

---

## Running tests

Open **Window → General → Test Runner → EditMode → Run All**, or from CLI:

```bash
Unity -runTests -batchmode -projectPath unity \
      -testPlatform EditMode -testResults results.xml
```

Covered:
- `BattleResolverTests` — counter table, power/hero bonuses, resolution & losses.
- `ResourceManagerTests` — optimistic spend, rollback, commit, snapshot load.
