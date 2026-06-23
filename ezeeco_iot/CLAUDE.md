@AGENTS.md

---

# Ezeeco IoT — Project Context for Claude

## What this project is
Ezeeco IoT is a React Native / Expo mobile (and web-compatible) app for managing smart home IoT devices. It was migrated from a Vite.js web app (`pcell_iot_app`) to Expo SDK 56. The Vite version is the design reference — when in doubt, match it visually and functionally.

## Tech stack
| Layer | Technology |
|---|---|
| Framework | Expo SDK 56, expo-router v4 (file-based routing) |
| Language | TypeScript |
| State | Zustand (`src/store/useStore.ts`) |
| Auth | Firebase Auth (email/password) via `expo-constants` |
| Database | Firebase Firestore (device/room/user docs) + Firebase RTDB (live IoT state) |
| UI | React Native core + `expo-linear-gradient`, `lucide-react-native` icons |
| Styling | `StyleSheet.create` (static) + inline computed styles for responsive values |
| Navigation | `expo-router` file-based — `src/app/` is the route root |

## Key architecture

### Route layout
```
src/app/
  (tabs)/           ← Tab group (bottom bar always visible)
    _layout.tsx     ← Defines 5 tabs: Home, Rooms, Add, Security, Settings
    index.tsx       ← Home screen
    rooms.tsx       ← Rooms list
    add.tsx         ← Re-exports /app/add-device.tsx (keeps bottom bar)
    security-tab.tsx← Re-exports /app/security.tsx (keeps bottom bar)
    settings.tsx    ← Settings
  device/[id].tsx   ← Device detail (stack screen)
  room/[id].tsx     ← Room detail (stack screen)
  room/[id]/members.tsx
  add-device.tsx    ← Full add-device form
  security.tsx      ← Security page (live ESP32 feed + activity)
  about.tsx
  ...
```

> **Important pattern**: Stack screens that need the bottom tab bar visible must be re-exported from the `(tabs)/` directory. E.g. `(tabs)/add.tsx` contains only `export { default } from '@/app/add-device'`.

### Data flow
- **Firestore** stores persistent data: `devices`, `rooms`, `users`, `activityLogs`
- **RTDB** stores live IoT state at `rooms/{roomId}/devices/{deviceId}/iotState` — `{ online: bool, state: 0|1, lastUpdated: timestamp }`
- Zustand store (`useStore`) holds `devices`, `rooms`, `pinnedIds` in memory; refreshed on mount and focus via `fetchDevices(userId)` / `fetchRooms(userId)`
- Device toggle: write to RTDB first (instant), then update Firestore `currentValue` (persistence)

### Responsive layout
Driven by `src/hooks/use-responsive.ts`. Call `useResponsive()` in any screen component:
```ts
const { hPad, contentW, itemWidth, gridGap, numCols, isTablet, isDesktop, tabBarSideM } = useResponsive();
```
- `hPad` — horizontal padding (16 / 24 / 40 px)
- `contentW` — `Math.min(screenWidth, 1100)` — cap content at 1100px
- `numCols` — device grid columns: 2 / 3 / 4
- `itemWidth` — exact pixel width for each grid card
- `tabBarSideM` — left/right margin for the floating tab bar

### Firebase config
All Firebase keys come from `.env` / `app.json` `extra` via `EXPO_PUBLIC_FIREBASE_*` environment variables. `src/lib/firebase.ts` initialises the app once using `getApps().length === 0` guard. `initializeAuth` is wrapped in try/catch to handle hot-reload double-init.

### IoT device creation checklist
When a device is created, THREE things must happen:
1. `deviceService.createDevice(data)` → Firestore document in `devices/`
2. `iotControlService.initializeDeviceState(deviceId, roomId, 0)` → RTDB node at `rooms/{roomId}/devices/{deviceId}/iotState`
3. `roomService.addDeviceToRoom(roomId, deviceId)` → updates `rooms/{roomId}.deviceIds` array

`deviceService.createDevice` already calls step 3 internally, but `add-device.tsx` calls it again — idempotent because Firestore uses `arrayUnion`.

## Version bumping — mandatory for every change
1. Open `app.json` and increment `version` using semver:
   - **Patch** `x.y.Z` → bug fixes, style tweaks, minor copy changes
   - **Minor** `x.Y.0` → new features, page rewrites, new screens
   - **Major** `X.0.0` → breaking changes, full redesigns
2. Add an entry to `docs/CHANGELOG.md` at the top (newest first) in this format:
   ```markdown
   ## [x.y.z] - YYYY-MM-DD
   ### What changed and why
   - Bullet points describing each change
   ```
3. Both files must be updated in the same commit as the code change.

## DeviceCard behaviour
| Gesture | Action |
|---|---|
| Tap | Toggle device on/off (RTDB write) |
| Long press (400ms) | Navigate to `/device/{id}` detail page |
| ⋮ button | Bottom sheet: "Open Details" + "Pin/Unpin from Quick Access" |

## Settings page sections
Appearance → Account → App → Logout. Notifications and Security rows have been **removed**. Version number is read from `app.json` via `Constants.expoConfig?.version`.

## Things to avoid
- Never add `href: null` hidden tab screens without a corresponding re-export file
- Never use `Modal` inline in a page for the "add device" flow — always navigate to `/add-device?roomId=xxx`
- Never read screen width from a static constant — always use `useWindowDimensions` or `useResponsive()`
- Never call `initializeApp` or `initializeAuth` unconditionally — both are guarded in `firebase.ts`
