# Ezeeco IoT

<div align="center">

![Version](https://img.shields.io/badge/version-3.2.2-blue?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS%20%7C%20Web-lightgrey?style=flat-square)
![Expo SDK](https://img.shields.io/badge/Expo%20SDK-56-000020?style=flat-square&logo=expo)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![License](https://img.shields.io/badge/license-GPL--v3-green?style=flat-square)
![Made by](https://img.shields.io/badge/made%20by-Project%20Cell%20CRCE-purple?style=flat-square)

**Open-source React Native app to control IoT devices connected to ESP32 via Firebase.**  
Control lights, relay modules, monitor your ESP32-CAM feed, and manage your smart home — all from one app.

</div>

---

## Table of Contents

- [What is Ezeeco IoT?](#what-is-ezeeco-iot)
- [Features](#features)
- [Upcoming Features](#upcoming-features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [App Setup](#app-setup)
  - [Firebase Setup](#firebase-setup)
  - [ESP32 Setup (Relay / Lights)](#esp32-setup-relay--lights)
  - [ESP32-CAM Setup](#esp32-cam-setup)
  - [IR Blaster Setup (ESP8266)](#ir-blaster-setup-esp8266)
- [Firebase Data Structure](#firebase-data-structure)
- [Activity Logs](#activity-logs)
- [IR Remote Control (Coming Soon)](#ir-remote-control-coming-soon)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

---

## What is Ezeeco IoT?

Ezeeco IoT is a **free and open-source** mobile application built for anyone who wants to build a DIY smart home using affordable hardware. Connect an **ESP32** to your lights, fans, relay modules, or any switchable appliance, link it to **Firebase Realtime Database**, and control everything from your phone in real time.

The app handles:
- **Real-time device control** — toggle devices, set values, see live status
- **Room management** — group devices by room, share access with family
- **Security camera** — live snapshot from an ESP32-CAM linked to your account
- **Full activity logging** — every action (login, toggle, add/remove device) is persisted in Firestore
- **Shared rooms** — invite others via a 6-digit join code

---

## Features

| Feature | Status |
|---|---|
| Toggle relay / lights via app | ✅ Live |
| Live online/offline device status | ✅ Live |
| Room grouping & shared access (join code) | ✅ Live |
| ESP32-CAM image capture & viewer | 🔜 Coming Soon |
| Full activity log (all user actions) | ✅ Live |
| Dark mode | ✅ Live |
| Responsive layout (phone / tablet / web) | ✅ Live |
| Firebase Auth (email + Google) | ✅ Live |
| IR Remote Control (ESP8266) | 🔜 Coming Soon |
| Automation / Scenes | 🚧 Partial |

---

## Upcoming Features

### IR Remote Control
Control **any IR-based appliance** (TV, AC, fan, set-top box) using an **ESP8266** fitted with:
- IR Blaster on **pin D5 (GPIO 14)**
- IR Receiver on **pin D6 (GPIO 12)**

From within the app you will be able to:
- Create multiple named remotes (e.g. "Living Room TV", "Bedroom AC")
- **Learn** IR codes by pointing the original remote at the ESP8266 receiver
- **Send** commands by tapping buttons on the app, which blasts them via the ESP8266
- Fully **customise button layouts** — add, rename, delete, and drag to reorder buttons
- The ESP8266 firmware is included in `firmware/esp8266_ir_control/`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/) + expo-router v4 |
| Language | TypeScript |
| State management | Zustand |
| Auth | Firebase Auth (email/password, Google) |
| Database | Firebase Firestore (persistent data) + Firebase RTDB (live IoT state) |
| UI | React Native core + `expo-linear-gradient` + `lucide-react-native` |
| Microcontroller | ESP32 (devices), ESP32-CAM (camera), ESP8266 (IR blaster) |
| IR Library | [IRremoteESP8266](https://github.com/crankyoldgit/IRremoteESP8266) |

---

## Screenshots

> Screenshots will be added here once the first stable build is released.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/more/expo-cli/): `npm install -g expo-cli`
- [Expo Go](https://expo.dev/client) app on your phone (for development)
- A [Firebase](https://firebase.google.com/) project (free Spark plan is enough)
- Arduino IDE with ESP32 / ESP8266 board support

---

### App Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/Ezeeco-IoT.git
cd Ezeeco-IoT/ezeeco_iot

# 2. Install dependencies
npm install

# 3. Copy the environment template and fill in your Firebase keys
cp .env.example .env
# Edit .env with your Firebase config values

# 4. Start the development server
expo start
```

Scan the QR code with Expo Go to open the app on your device.

---

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Add project**
2. Enable **Authentication** → Sign-in methods → Email/Password (and Google if desired)
3. Create a **Firestore Database** (start in test mode, then apply the security rules below)
4. Create a **Realtime Database** (start in locked mode, then apply the rules below)
5. In **Project Settings → Your apps**, add a Web app and copy the config

#### Environment Variables (`.env`)

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /devices/{deviceId} {
      allow read, write: if request.auth != null;
    }
    match /rooms/{roomId} {
      allow read, write: if request.auth != null;
    }
    match /activityLogs/{logId} {
      allow read, write: if request.auth != null;
    }
    match /irRemotes/{remoteId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

#### Realtime Database Rules

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "ir_command": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "ir_result": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "true"
      }
    }
  }
}
```

> **Note:** The `ir_result` node needs write access from the unauthenticated ESP8266. In production, use a Firebase service account or a dedicated device token instead of open write rules.

---

### ESP32 Setup (Relay / Lights)

The ESP32 firmware reads its state from Firebase RTDB at `rooms/{roomId}/devices/{deviceId}/iotState` and toggles the GPIO pin accordingly.

**RTDB node structure for each device:**
```json
{
  "online": true,
  "state": 0,
  "lastUpdated": 1700000000000
}
```

- `state: 0` → relay OFF
- `state: 1` → relay ON

**Minimal ESP32 Arduino sketch:**

```cpp
#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>

#define RELAY_PIN     26
#define WIFI_SSID     "YOUR_WIFI"
#define WIFI_PASSWORD "YOUR_PASSWORD"
#define FIREBASE_HOST "YOUR_PROJECT.firebaseio.com"
#define FIREBASE_AUTH "YOUR_DATABASE_SECRET"
#define DEVICE_PATH   "/rooms/YOUR_ROOM_ID/devices/YOUR_DEVICE_ID/iotState"

FirebaseData fbData;
FirebaseAuth auth;
FirebaseConfig config;

void setup() {
  pinMode(RELAY_PIN, OUTPUT);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Mark device online
  Firebase.setBool(fbData, String(DEVICE_PATH) + "/online", true);
}

void loop() {
  int state = 0;
  if (Firebase.getInt(fbData, String(DEVICE_PATH) + "/state"))
    state = fbData.intData();
  digitalWrite(RELAY_PIN, state == 1 ? HIGH : LOW);
  delay(500);
}
```

Install **FirebaseESP32** by Mobizt via Arduino Library Manager.

---

### ESP32-CAM Setup

The ESP32-CAM captures images on demand and uploads them to Firebase Storage. The app reads the latest image URL from RTDB at `security/{userId}/latestImage`.

**Required libraries:** `esp_camera.h`, `WiFi.h`, `Firebase_ESP_Client.h`

The full ESP32-CAM sketch is located in `firmware/esp32_cam/` (to be added in a future release).

---

### IR Blaster Setup (ESP8266)

> **Coming Soon** — full implementation in progress.

**Hardware:**
| Component | ESP8266 Pin |
|---|---|
| IR Blaster (LED) | D5 (GPIO 14) |
| IR Receiver (TSOP) | D6 (GPIO 12) |

**Required Arduino libraries:**
- [IRremoteESP8266](https://github.com/crankyoldgit/IRremoteESP8266) — install via Library Manager
- [Firebase ESP8266 Client](https://github.com/mobizt/Firebase-ESP8266) — by Mobizt

The firmware is located at `firmware/esp8266_ir_control/esp8266_ir_control.ino`.  
See [IR Remote Control](#ir-remote-control-coming-soon) for full details.

---

## Firebase Data Structure

```
Firestore
├── users/{userId}
├── devices/{deviceId}
├── rooms/{roomId}
├── activityLogs/{logId}
└── irRemotes/{remoteId}

Realtime Database
├── rooms/{roomId}/devices/{deviceId}/iotState
│     ├── online: bool
│     ├── state:  0 | 1
│     └── lastUpdated: timestamp
├── ir_command/{userId}
│     ├── action:   "send" | "learn" | "idle"
│     ├── irCode:   "A90" (hex)
│     ├── protocol: "NEC"
│     ├── bits:     32
│     └── buttonId: string
└── ir_result/{userId}
      ├── action:   "learned" | "timeout"
      ├── irCode:   string
      ├── protocol: string
      ├── bits:     number
      └── timestamp: number
```

---

## Activity Logs

Every user action in the app is written to the `activityLogs` Firestore collection:

| Category | Examples |
|---|---|
| `USER` | Login, logout, profile update, password change |
| `DEVICE` | Toggle, create, update, delete |
| `ROOM` | Create, join, leave, delete |
| `SECURITY` | Failed login, suspicious activity |
| `SYSTEM` | App open, errors |

Logs are viewable inside the app at **Settings → Activity Logs** and are filterable by category.

---

## IR Remote Control (Coming Soon)

Once the IR feature is live, here is how it will work:

1. **Flash the ESP8266** with the firmware in `firmware/esp8266_ir_control/`
2. Set your Wi-Fi credentials and Firebase config in the sketch
3. In the app, open **Home → IR Remote Control**
4. Tap **+ New Remote**, give it a name and an icon (e.g. "Living Room TV 📺")
5. Tap **+ Add Button**, give the button a name (e.g. "Power")
6. Tap **Learn** on the button — the ESP8266 receiver activates for 10 seconds
7. Point your original remote at the ESP8266 and press the button
8. The IR code is captured and saved automatically
9. From now on, tapping that button in the app sends the command via the ESP8266 blaster

---

## Contributing

Contributions are welcome! Please open an issue first for major changes.

```bash
# Fork and clone
git clone https://github.com/your-org/Ezeeco-IoT.git

# Create a feature branch
git checkout -b feature/your-feature

# Commit and open a Pull Request
```

Please follow the versioning convention in `app.json` and document changes in `docs/CHANGELOG.md`.

---

## License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.

You are free to use, modify, and distribute this software under the terms of the GPL-3.0.  
Any modified versions must also be released under the same license.

See the [LICENSE](./LICENSE) file for the full license text, or visit [gnu.org/licenses/gpl-3.0](https://www.gnu.org/licenses/gpl-3.0.html).

© 2025 Project Cell CRCE

---

## Credits

Built and maintained by **Project Cell CRCE**  
Fr. Conceição Rodrigues College of Engineering, Bandra, Mumbai — University of Mumbai

### Development Team

| Name | Role | Links |
|---|---|---|
| **David Porathur** | Full Stack Developer | [GitHub](https://github.com/41vi4p) · [LinkedIn](https://www.linkedin.com/in/david-porathur-33780228a) · [Portfolio](https://davidporathur.vercel.app) · [Instagram](https://www.instagram.com/davidp2529.sh) |
| **Pranav Koradiya** | Full Stack Developer | [GitHub](https://github.com/08pranav) · [LinkedIn](https://linkedin.com/in/pranavkoradiya) · [Portfolio](https://pranavkoradiya.com) · [Instagram](https://www.instagram.com/pranav85_) |
| **Deon Raj** | Full Stack Developer | — |
| **Yash Masaye** | Full Stack Developer | [Instagram](https://www.instagram.com/yash.masaye) |
| **Naimish Purohit** | Full Stack Developer | [Instagram](https://www.instagram.com/naimish.purohit) |
| **Mangalam Jaiswal** | Full Stack Developer | [Instagram](https://www.instagram.com/__manxglam__) |

---

<div align="center">
  Made with ❤️ for the future of open-source IoT
</div>
