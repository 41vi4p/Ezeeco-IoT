/*
 * Ezeeco IoT — ESP8266 IR Control Firmware
 * =========================================
 * IR Blaster : D5 (GPIO 14)
 * IR Receiver: D6 (GPIO 12)
 *
 * Required libraries (install via Arduino Library Manager):
 *   - IRremoteESP8266  by crankyoldgit  (≥ 2.8.6)
 *   - Firebase ESP8266 by Mobizt       (≥ 4.4.x)
 *
 * Firebase RTDB paths used:
 *   ir_command/{USER_ID}  — app writes commands here
 *   ir_result/{USER_ID}   — this firmware writes results here
 *
 * Command node schema:
 *   { action: "send"|"learn"|"idle", irCode: "A90F", protocol: "NEC",
 *     bits: 32, buttonId: "abc123", remoteId: "xyz456", timestamp: 1700000000 }
 *
 * Result node schema:
 *   { action: "learned"|"timeout", buttonId: "abc123", irCode: "A90F",
 *     protocol: "NEC", bits: 32, timestamp: 1700000000 }
 */

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>
#include <IRremoteESP8266.h>
#include <IRsend.h>
#include <IRrecv.h>
#include <IRutils.h>

// ── User configuration ────────────────────────────────────────────────────────
#define WIFI_SSID        "YOUR_WIFI_SSID"
#define WIFI_PASSWORD    "YOUR_WIFI_PASSWORD"
#define FIREBASE_API_KEY "YOUR_FIREBASE_WEB_API_KEY"   // Project Settings → Web API Key
#define FIREBASE_DB_URL  "https://YOUR_PROJECT-default-rtdb.firebaseio.com"
#define USER_ID          "YOUR_FIREBASE_AUTH_UID"       // From Firebase Auth → Users
// ─────────────────────────────────────────────────────────────────────────────

#define IR_SEND_PIN  14  // D5
#define IR_RECV_PIN  12  // D6
#define LEARN_TIMEOUT_MS 12000

IRsend   irsend(IR_SEND_PIN);
IRrecv   irrecv(IR_RECV_PIN, 1024, 50, true);
decode_results irResults;

FirebaseData  fbData;
FirebaseData  fbStream;
FirebaseAuth  fbAuth;
FirebaseConfig fbConfig;

String commandPath;
String resultPath;
bool   tokenReady = false;

// ── Helpers ───────────────────────────────────────────────────────────────────

void tokenStatusCallback(TokenInfo info) {
  if (info.status == token_status_ready) {
    tokenReady = true;
    Serial.println("[Firebase] Token ready");
  }
}

bool getStr(const String& path, String& out) {
  if (Firebase.RTDB.getString(&fbData, path)) {
    out = fbData.stringData();
    return true;
  }
  return false;
}

bool getInt(const String& path, int& out) {
  if (Firebase.RTDB.getInt(&fbData, path)) {
    out = fbData.intData();
    return true;
  }
  return false;
}

void setIdle() {
  Firebase.RTDB.setString(&fbData, commandPath + "/action", "idle");
}

void writeResult(const String& action, const String& buttonId,
                 const String& irCode, const String& protocol, int bits) {
  FirebaseJson json;
  json.set("action",    action);
  json.set("buttonId",  buttonId);
  json.set("irCode",    irCode);
  json.set("protocol",  protocol);
  json.set("bits",      bits);
  json.set("timestamp", (int)millis());
  Firebase.RTDB.setJSON(&fbData, resultPath, &json);
}

// Send an IR code. Supports NEC, SAMSUNG, SONY, LG, PANASONIC, RC5, RC6, DISH.
void sendIR(const String& protocol, const String& hexCode, int bits) {
  uint64_t code = strtoull(hexCode.c_str(), nullptr, 16);
  Serial.printf("[IR SEND] protocol=%s code=0x%s bits=%d\n",
                protocol.c_str(), hexCode.c_str(), bits);

  if      (protocol == "NEC")       irsend.sendNEC(code, bits);
  else if (protocol == "SAMSUNG")   irsend.sendSAMSUNG(code, bits);
  else if (protocol == "SONY")      irsend.sendSony(code, bits, 3);
  else if (protocol == "LG")        irsend.sendLG(code, bits);
  else if (protocol == "LG2")       irsend.sendLG2(code, bits);
  else if (protocol == "PANASONIC") irsend.sendPanasonic64(code, bits);
  else if (protocol == "RC5")       irsend.sendRC5(code, bits);
  else if (protocol == "RC6")       irsend.sendRC6(code, bits);
  else if (protocol == "DISH")      irsend.sendDISH(code, bits);
  else {
    // Unknown protocol — fall back to NEC
    Serial.printf("[IR SEND] Unknown protocol '%s', falling back to NEC\n", protocol.c_str());
    irsend.sendNEC(code, bits);
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(200);

  commandPath = "/ir_command/" + String(USER_ID);
  resultPath  = "/ir_result/"  + String(USER_ID);

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\n[WiFi] Connected — IP: %s\n", WiFi.localIP().toString().c_str());

  // Firebase
  fbConfig.api_key           = FIREBASE_API_KEY;
  fbConfig.database_url      = FIREBASE_DB_URL;
  fbConfig.token_status_callback = tokenStatusCallback;

  // Anonymous sign-in (no email/password needed for device-level access)
  fbAuth.user.email    = "";
  fbAuth.user.password = "";

  Firebase.begin(&fbConfig, &fbAuth);
  Firebase.reconnectWiFi(true);

  // Wait up to 10 s for token
  unsigned long t0 = millis();
  while (!tokenReady && millis() - t0 < 10000) {
    Firebase.ready();
    delay(50);
  }

  irsend.begin();
  irrecv.enableIRIn();

  setIdle();
  Serial.println("[Ezeeco] IR firmware ready");
}

// ── Main loop ─────────────────────────────────────────────────────────────────

void loop() {
  if (!Firebase.ready()) { delay(500); return; }

  String action = "idle";
  getStr(commandPath + "/action", action);

  // ── SEND mode ───────────────────────────────────────────────────────────────
  if (action == "send") {
    String hexCode = "", protocol = "";
    int    bits    = 32;
    getStr(commandPath + "/irCode",   hexCode);
    getStr(commandPath + "/protocol", protocol);
    getInt(commandPath + "/bits",     bits);

    if (hexCode.length() > 0) {
      sendIR(protocol, hexCode, bits);
    }
    setIdle();
  }

  // ── LEARN mode ──────────────────────────────────────────────────────────────
  else if (action == "learn") {
    String buttonId = "";
    getStr(commandPath + "/buttonId", buttonId);
    Serial.printf("[IR LEARN] Listening for signal (buttonId=%s)…\n", buttonId.c_str());

    irrecv.enableIRIn();
    irrecv.resume();

    unsigned long startMs = millis();
    bool received = false;

    while (millis() - startMs < LEARN_TIMEOUT_MS) {
      if (irrecv.decode(&irResults)) {
        if (irResults.value == 0 || irResults.value == UINT64_MAX) {
          // Repeat code or noise — skip
          irrecv.resume();
          continue;
        }

        String hexCode  = uint64ToString(irResults.value, HEX);
        String protocol = typeToString(irResults.decode_type, false);
        int    bits     = irResults.bits;

        hexCode.toUpperCase();
        Serial.printf("[IR LEARN] Captured: protocol=%s code=0x%s bits=%d\n",
                      protocol.c_str(), hexCode.c_str(), bits);

        writeResult("learned", buttonId, hexCode, protocol, bits);
        irrecv.resume();
        received = true;
        break;
      }
      delay(20);
    }

    if (!received) {
      Serial.println("[IR LEARN] Timeout — no signal received");
      writeResult("timeout", buttonId, "", "", 0);
    }

    setIdle();
  }

  delay(400);
}
