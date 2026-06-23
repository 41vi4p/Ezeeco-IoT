# CHANGELOG

## [3.1.0] - 2026-06-23

### Updated — Responsive Layout (all screens)
- Added `src/hooks/use-responsive.ts` — single hook providing `hPad`, `contentW`, `numCols`, `itemWidth`, `gridGap`, `tabBarSideM`, `isTablet`, `isDesktop`
- **Tab bar**: centred and capped at 640px on large screens via computed `tabBarSideM`; icon+label alignment fixed with `tabBarItemStyle { flexDirection: column, justifyContent: center }`
- **Home page**: header and sections capped at 1100px max-width; device grid switches to 2/3/4 columns based on screen width with exact pixel `itemWidth`; rooms use 2-column wrap grid on tablet+
- **Rooms page**: header capped, room list switches to 2-column grid on tablet+
- **Settings page**: content capped at 1100px, centred

### Updated — DeviceCard (parity with Vite version)
- Layout now matches Vite: icon · `Name On/Off` · category · online dot · `⋮` in top row; STATUS label + `● Active/Inactive`; `Tap to toggle • Hold for details` hint at bottom
- Card border turns **green** (`#22C55E`) when device is active
- **Long press** (400ms) navigates directly to `/device/{id}` detail page
- **⋮ three-dots menu** opens bottom sheet with "Open Details" and "Pin/Unpin from Quick Access"

### Updated — Add Device from Room page
- Replaced the inline minimal modal (name + 4 type chips) with navigation to the full `/add-device?roomId={id}` screen
- `add-device.tsx` now reads `roomId` from `useLocalSearchParams` and pre-selects that room in the picker

### Fixed — Members page key prop warning
- `room/[id]/members.tsx`: member row key falls back through `userId → id → email → index`

### Fixed — Device deletion error surfacing
- `device/[id].tsx`: `confirmDelete` now shows the actual Firebase error message in the alert
- Added `fetchDevices(user.id)` after successful deletion so the store refreshes immediately
- `src/lib/firebase.ts`: `initializeAuth` wrapped in try/catch — falls back to `getAuth(app)` on hot-reload double-init

### Updated — CLAUDE.md
- Full project documentation added: architecture, routing patterns, data flow, responsive system, IoT creation checklist, version bumping rules, anti-patterns

---

## [3.0.0] - 2026-06-23

### Updated — Security Page (full rewrite, parity with Vite + ESP32 live feed)
- **Add tab icon** changed from `Plus` → `CirclePlus` to match Vite's ringed icon
- **Security System card**: armed/disarmed toggle with green/red shield icon
- **Live View**: full-width camera feed panel (220px tall) that polls `http://{ip}/capture?t={timestamp}` every 1 second using React Native `Image` — no WebView needed; works with any ESP32-CAM running the default firmware
  - Shows LIVE/OFFLINE status badge in top-left corner
  - Loading overlay while first frame loads
  - Error state with "Camera Not Connected" + retry button if IP is unreachable
  - Camera name + IP shown in footer
- **All Cameras grid**: 3-column thumbnail grid of all camera-type devices; tap any thumbnail to switch the Live View to that camera; selected camera shown with purple border ring
- **"No Cameras Configured"** empty state with "Add Camera" button linking to `/add-device`
- **Recent Activity**: queries Firestore `activityLogs` (last 5 entries for current user); event icon auto-selected based on action text (motion→Camera, door/lock→Lock, other→Shield)
- **Security Settings** section preserved: 2FA toggle, Session Timeout, Login Alerts, Device Control Alerts
- **ESP32 integration**: cameras must have `customProperties.ipAddress` set; the snapshot endpoint defaults to `/capture` — compatible with ESP32-CAM default CameraWebServer firmware
- Video Logs button in header navigates to `/video-logs`
- Header gradient updated to deep indigo-purple

---

## [2.9.0] - 2026-06-23

### Updated — Bottom Tab Bar (parity with Vite app)
Expanded from 3 tabs (Home, Rooms, Settings) to 5 tabs matching the Vite version (Home, Rooms, Add, Security, Settings):

- **Add tab** (centre): Purple gradient circle button elevated above the tab bar (`marginTop: -14`, `shadowColor: #6366F1`); `tabPress` intercepted to navigate to `/add-room-selection` without rendering a tab screen
- **Security tab**: Shield icon; `tabPress` intercepted to navigate to `/security` stack screen
- Placeholder files `(tabs)/add.tsx` and `(tabs)/security-tab.tsx` created so expo-router registers the routes (screens are never rendered — navigation always redirected)
- `overflow` changed to `'visible'` on tab bar to allow the Add button to extend above it
- Icon sizes reduced from 22px → 20px and label font from 11px → 10px to fit 5 items comfortably

---

## [2.8.0] - 2026-06-23

### Updated — Rooms Page (parity with Vite app)
- **Search bar** moved from inside the gradient header to the content area (below header, themed `#333333`/`#F3F4F6` background) to match the Vite layout
- **"Add New Room" card** added at the bottom of the room list — purple gradient icon circle, "Add New Room" title, "Set up a new room in your home" subtitle, navigates to `/add-room`; only shown when rooms exist (empty state already has Create Room button)
- Empty state now distinguishes between "no rooms yet" and "no search results"
- Header title changed from "Rooms" to "All Rooms" to match Vite version
- Header gradient updated to match home/login deep indigo-purple

---

## [2.7.0] - 2026-06-23

### Updated — Add Device (parity with Vite app)
Full rewrite of `add-device.tsx` to match the Vite version's feature set:

- **Device Icon picker**: Tappable row previews the current icon; tap opens a bottom-sheet modal with a 4-column grid of 33 curated icons (Lightbulb, Fan, TV, Speaker, Camera, Lock, Plug, Thermostat, Phone, Laptop, Wifi, Music, Flame, Water, Sun, Moon, Power, Coffee, Cooling, Mic, Audio, Alarm, Monitor, Radio, CPU, Energy, Bell, Home, AC, Satellite, Keyboard, Mouse, Security). Search bar filters the grid live. Selecting an icon closes the modal instantly. When device type is changed, icon auto-syncs — but the user can override it independently.
- **Brand field**: Optional text input, defaults to "Custom" if left blank
- **Control Type chips**: 4 toggle chips — Toggle (On/Off), Range Control, Multi-Button, Custom — replace the previous hardcoded "toggle"
- **IP Address field**: Optional, stored in `customProperties.ipAddress`
- **Control Endpoint field**: Optional, stored in `customProperties.controlEndpoint`
- **Description field**: Optional multiline textarea, stored in `customProperties.description`
- **IoT initialization**: Now calls `iotControlService.initializeDeviceState()` after creating the device (was missing before)
- **Room linking**: Now also calls `roomService.addDeviceToRoom()` to register device in the room's device list
- Header gradient updated to match home/login deep indigo-purple

---

## [2.6.0] - 2026-06-23

### Updated — Dark Theme Color Palette (match Vite app)
Full dark-mode color overhaul across all 31 screens + components to match the Vite app's matte gray palette instead of the previous deep navy/purple.

**Color mapping applied:**

| Old (navy/purple) | New (matte gray) | Usage |
|---|---|---|
| `#0F0F1A` | `#2D2D2D` | Page background |
| `#1A1A2E` | `#333333` | Card / sheet backgrounds |
| `#242438` | `#444444` | Input / element backgrounds |
| `#2D2D4A/4E` | `#444444` | Card borders |
| `#13132a` | `#282828` | Accordion inset bodies |
| `#1e1b3a` | `#3A3A3A` | Highlighted row backgrounds |
| `#1E1B38` | `#333333` | Card variant |
| `#9CA3AF` textSecondary | `#B3B3B3` | Secondary text |
| `#6B7280` tabIconDefault | `#888888` | Inactive tab icons |

- `theme.ts` dark section updated as the single source of truth
- Batch `sed` replacement applied across all `.tsx`/`.ts` files in `src/`
- Header gradients (purple) intentionally preserved — Vite app also uses purple headers
- Tab bar background updated to `#2D2D2D` in `_layout.tsx`

---

## [2.5.0] - 2026-06-23

### Updated — Help & Support (parity with Vite app)
- **Contact Support**: Email, GitHub, Website cards with proper `Linking.openURL`; email card highlighted with primary color background
- **Documentation & Guides**: 4 quick-link cards (ESP32 Setup, Firebase Config, API Docs, Troubleshooting) all linking to GitHub repo
- **Frequently Asked Topics**: 6 expandable accordions (Getting Started, Device Management, Automation, Energy Reports, Security & Privacy, Room Sharing) with bullet-point sub-items
- **Emergency Support**: Red-tinted card with Phone icon + emergency email contact button
- **Help us improve**: Centered feedback card with gradient Submit Feedback button linking to GitHub
- Replaced placeholder `support@ezeeco.com` with actual `projectcellcrce2024@gmail.com` contact
- Removed non-functional "Live Chat - Coming Soon" placeholder

---

## [2.4.0] - 2026-06-23

### Updated — Account Settings (parity with Vite app)
- **Profile Picture card**: Shows avatar (Google photo or gradient initials) + display name + email source + role badge
- **Account Information card**: Editable name field with validation, read-only email with "Cannot change" badge, Save Changes button with loading state
- **Account Details card**: Account type, Member Since (from `createdAt` timestamp), Devices count, Total Rooms + breakdown of Owned vs Joined
- **Joined Rooms card**: Lists rooms user is a member of (not owner) — each row shows room icon, name, device count, join date; with View (navigates to room) and Leave buttons (Alert confirmation)
- **Change Password**: Kept from previous version; moved below Joined Rooms
- **Danger Zone**: Now uses `userService.deleteUserAccount(userId, true)` for full cleanup (removes owned rooms, devices, membership records) instead of just `deleteUser()` on Firebase Auth

---

## [2.3.0] - 2026-06-22

### Updated — Login Page Animations
- Full visual rewrite of `(auth)/login.tsx` matching the welcome page aesthetic
- 4 pulsing background blobs (absolute-positioned, `useNativeDriver` opacity loops) — no layout impact
- 7 floating device-themed icons (Shield, Wifi, Key, Zap, Smartphone, UserCircle, BellRing) with staggered independent Y/X `Animated.loop` — `isInteraction: false` to avoid blocking JS interactions
- Theme toggle replaced with `Sun → Switch → Moon` pill identical to welcome page
- Card is now glassmorphic (`rgba` background + white border) matching welcome page style
- Inputs styled with `rgba` borders/backgrounds for glass look on gradient
- Gradient updated to deeper indigo-purple matching welcome/home gradient
- All animations use `useNativeDriver: true` for smooth 60fps performance

---

## [2.2.0] - 2026-06-22

### Fixed
- `activityLogger.ts`: Strip `undefined` field values (`userName`, `metadata`) before calling Firestore `addDoc()` — was causing "Unsupported field value: undefined" crash on logout and other actions that don't pass optional metadata

### Updated — Home Dashboard UI
- **Header gradient**: Deeper indigo-purple (`#4F46E5 → #7C3AED → #6D28D9`) for richer visual
- **Header pills**: Added inline device summary row showing total devices, online count, and room count
- **Stats section**: Replaced 2-card stats row with a 4-card 2×2 grid — Total Devices, Online, Lights, Rooms — each with icon, large number, and color-coded border
- **DeviceCard**: Full visual redesign — icon background tinted by on/off state, cleaner name + category + state pill layout, green/red pill instead of plain text, improved long-press bottom sheet with icon + name + state header

---

## [2.1.0] - 2026-06-22

### Fixed — GO_BACK Navigation Errors (Web)
- Replaced all bare `router.back()` calls across 15+ screens with `router.canGoBack() ? router.back() : router.replace('<fallback>')` to prevent "GO_BACK was not handled by any navigator" errors on web when screens are loaded without history
- Screens fixed: `notifications`, `account-settings`, `privacy-security`, `security`, `family-access`, `help-support`, `credits`, `automation`, `automation-logs`, `video-logs`, `logs`, `reports`, `add-room-selection`, `profile-edit`, `scenes/create`, `room/[id]`, `device/[id]`
- Room delete now navigates to `/(tabs)/rooms` instead of back (safe after deletion)
- Profile save now falls back to `/(tabs)/settings`

### Updated — About & Credits Pages
- `about.tsx`: Fully updated with PCeLL IoT Platform branding, version 3.2.1, app description, tech stack, Made by section with View Credits button, and contact email
- `credits.tsx`: Complete rewrite with full team members (David Porathur, Pranav Koradiya, Naimish Purohit, Mangalam Jaiswal, Yash Masaye, Deon Raj) with designations, roles, and social link buttons (GitHub, LinkedIn, Instagram, Portfolio), Institution section, Technologies Used chip list, Special Thanks, and Open Source note

---

## [2.0.0] - 2026-06-22

### Major — Full Migration from pcell_iot_app (Vite.js) to Expo React Native

Complete migration of the `pcell_iot_app` web application to `ezeeco_iot` Expo SDK 56 app. All 30+ pages, components, services and flows have been migrated with full dark/light theme support.

### Added

#### Core Infrastructure
- `src/lib/firebase.ts` — Firebase config for React Native; uses `initializeAuth` with `getReactNativePersistence(AsyncStorage)` on native, `getAuth` on web; prevents duplicate app initialization
- `src/types/notification.ts` — Notification types matching web app's notificationService
- `src/utils/activityLogger.ts` — Activity logger adapted from web; uses `Platform.OS` instead of `navigator.userAgent`
- `src/utils/validation.ts` — Validation utilities with in-memory rate limiting (no DOM)
- `src/services/firestoreService.ts` — Firestore service; Firebase modular SDK is cross-platform compatible
- `src/services/iotControlService.ts` — Realtime DB control service; works identically on React Native
- `src/services/notificationService.ts` — Rewritten with Firestore Timestamp `.toDate()` handling
- `src/store/useStore.ts` — Zustand store with `AsyncStorage` (replaces `localStorage`), `Appearance` API for initial theme
- `src/contexts/AuthContext.tsx` — Firebase Auth context for React Native; uses `Alert.alert` instead of toast
- `src/contexts/NotificationsContext.tsx` — Notifications context (same logic, RN compatible)
- `src/constants/theme.ts` — Extended with full IoT color scheme for dark/light themes
- `src/hooks/use-theme.ts` — Reads `darkMode` from Zustand store (not system `useColorScheme`)
- `src/data/scenesData.ts` — Scene data with RN-compatible gradient color pairs

#### Navigation / Layout
- `src/app/_layout.tsx` — Root Stack layout; all screens registered; wraps AuthProvider + NotificationsProvider + Toast
- `src/app/(auth)/_layout.tsx` — Auth stack layout
- `src/app/(tabs)/_layout.tsx` — Tab bar with Home/Rooms/Scenes/Settings, theme-aware styling

#### Components
- `src/components/SmartHomeIcon.tsx` — SVG icon using react-native-svg
- `src/components/BrandFooter.tsx` — "Powered by Project Cell CRCE" footer
- `src/components/DeviceCard.tsx` — Device card with toggle, device type icons, dark/light styling
- `src/components/RoomCard.tsx` — Room card with device count, color-coded indicator

#### Auth Screens
- `src/app/(auth)/welcome.tsx` — Welcome screen with LinearGradient, Animated effects, theme toggle
- `src/app/(auth)/login.tsx` — Login screen with email/password + Google sign-in
- `src/app/(auth)/register.tsx` — Register screen with full validation
- `src/app/(auth)/onboarding.tsx` — 3-slide onboarding with horizontal ScrollView pagination

#### Main Tab Screens
- `src/app/(tabs)/index.tsx` — Home/Dashboard: header, search, stats, Quick Access devices, Rooms list, Join Room modal, Firebase Realtime DB live state
- `src/app/(tabs)/rooms.tsx` — Rooms list with search and Join Room modal
- `src/app/(tabs)/scenes.tsx` — Scenes grid with activation, search
- `src/app/(tabs)/settings.tsx` — Settings with profile, dark mode toggle, all navigation links, logout

#### Detail Screens
- `src/app/device/[id].tsx` — Device detail: power toggle, real-time state via Firebase, info tab, logs tab
- `src/app/room/[id].tsx` — Room detail: device grid, add device, delete room, share join code, members/logs navigation
- `src/app/room/[id]/members.tsx` — Room members management with remove member
- `src/app/room/[id]/logs.tsx` — Room activity logs from Firestore

#### Feature Screens
- `src/app/notifications.tsx` — Notifications list with mark read, delete, type icons
- `src/app/add-room.tsx` — Create room with icon picker, type quick-select
- `src/app/add-room-selection.tsx` — Create or join room choice screen
- `src/app/add-device.tsx` — Add device with type grid, room assignment
- `src/app/automation.tsx` — Automation rules with toggle enable/disable
- `src/app/automation-logs.tsx` — Automation execution logs
- `src/app/video-logs.tsx` — Security camera event logs
- `src/app/profile-edit.tsx` — Edit display name, avatar initials
- `src/app/account-settings.tsx` — Change password, delete account (with re-auth)
- `src/app/logs.tsx` — User activity logs from Firestore
- `src/app/security.tsx` — Security settings with 2FA, session timeout, alert toggles
- `src/app/family-access.tsx` — Family members across all rooms
- `src/app/privacy-security.tsx` — Privacy settings, data management
- `src/app/reports.tsx` — Device/room statistics overview
- `src/app/help-support.tsx` — FAQ accordion, email support contact
- `src/app/about.tsx` — App info, tech stack, credits
- `src/app/credits.tsx` — Team and open source credits
- `src/app/scenes/create.tsx` — Create scene with color picker, device tags
- `src/app/+not-found.tsx` — 404 not-found screen

### Changed
- `app.json` version bumped from 1.0.0 to 2.0.0
- `src/constants/theme.ts` — Removed stale `import '@/global.css'`; added full IoT color palette

### Web → React Native API Replacements
| Web API | React Native Replacement |
|---|---|
| `react-router-dom` | `expo-router` |
| `framer-motion` | `React Native Animated API` |
| `localStorage` | `AsyncStorage` |
| `document.documentElement.classList` | `Appearance API + useStore` |
| CSS classes | `StyleSheet` |
| HTML elements | RN primitives (`View`, `Text`, `TouchableOpacity`) |
| `useNavigate` | `useRouter` |
| `shadcn/ui` | Custom RN components |
| `browserLocalPersistence` | `getReactNativePersistence(AsyncStorage)` |
| `navigator.userAgent` | `Platform.OS` |
| `Dialog/AlertDialog` | `Modal + Pressable` |
| `useToast` | `Alert.alert` |
| Canvas animations | `LinearGradient + Animated` |

### Packages Installed (via `npx expo install`)
- `@react-native-async-storage/async-storage`
- `react-native-reanimated`
- `expo-linear-gradient`
- `lucide-react-native`
- `react-native-svg`
- `zustand`
- `firebase`
- `react-native-toast-message`
- `expo-clipboard`
