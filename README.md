<div align="center">

# 🔆 TalkLed

**Control Arduino LEDs with natural language — powered by Gemini AI & MQTT**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Powered by Gemini](https://img.shields.io/badge/Gemini-Flash-4285F4?logo=google)](https://ai.google.dev)
[![MQTT via HiveMQ](https://img.shields.io/badge/MQTT-HiveMQ-FF6600)](https://www.hivemq.com)
[![Wokwi Simulation](https://img.shields.io/badge/Simulator-Wokwi-green)](https://wokwi.com)

[Live Demo](https://talkled-ficilabs.vercel.app) · [Wokwi Project](https://wokwi.com/projects/457692404333644801)

</div>

---

## 📖 Overview

**TalkLed** is a real-time IoT chat interface that lets you control Arduino LEDs using plain English. Type commands like *"turn on the red LED"* or *"turn off all lights"* — the AI interprets your intent, updates a live Wokwi simulation, and publishes the state to an MQTT broker for real hardware integration.

Built as a showcase of **AI + IoT convergence**, TalkLed bridges natural language processing and embedded systems without writing a single line of Arduino code manually.

---

## ✨ Features

- 🤖 **Natural Language LED Control** — Chat with a Gemini-powered assistant to control LEDs conversationally
- 💡 **Individual & Bulk Control** — Turn on/off Red, Yellow, or Green LEDs — or all at once
- 📡 **Live MQTT Publishing** — Commands are published to HiveMQ broker in real time (`arduino/simulator/leds/{color}`)
- 🖥️ **Embedded Wokwi Simulation** — Visualize the Arduino hardware directly in the browser
- 🔁 **Chat History Context** — Gemini maintains conversation context for multi-turn interactions
- 📶 **MQTT Status Indicator** — Real-time connection badge (connected / connecting / disconnected)
- 🧭 **Onboarding Tutorial** — Guided popup for first-time users
- ⚡ **Instant UI Updates** — LED states update locally before MQTT acknowledgment for snappy UX

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4 |
| **AI / LLM** | Google Gemini (`gemini-3-flash-preview`) via `@google/genai` |
| **IoT Protocol** | MQTT over WebSocket (`mqtt` npm package) |
| **MQTT Broker** | HiveMQ Public Cloud (`broker.hivemq.com:8884`) |
| **Hardware Sim** | Wokwi Arduino Simulator (iframe embed) |
| **Animation** | Framer Motion (`motion/react`) |
| **Icons** | Lucide React |
| **Build Tool** | Vite 6 |
| **Deployment** | Vercel |

---

## 🏗️ Architecture

```
User types message
       │
       ▼
  Gemini AI (Function Calling)
       │
  ┌────┴────────────────────┐
  │                         │
  ▼                         ▼
set_led_state         set_all_leds_state
  │                         │
  └────────┬────────────────┘
           │
           ▼
    React State Update  ──►  UI re-renders (LED indicators)
           │
           ▼
    MQTT Publish  ──►  HiveMQ Broker  ──►  Wokwi / Real Arduino
                       topic: arduino/simulator/leds/{color}
                       payload: "ON" | "OFF"
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>= 20.x`
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ficilabs/talkled.git
cd talkled

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
```

Edit `.env.local`:

```env
GEMINI_API_KEY="your_gemini_api_key_here"
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎮 How to Use

1. **Start the Wokwi simulation** — Click the green ▶ Play button inside the embedded simulator
2. **Wait for MQTT** — The status badge in the chat header will show `MQTT: connected`
3. **Send a command** — Type natural language in the chat input:

| Example Command | Effect |
|---|---|
| `"Turn on the red LED"` | Turns red LED on, publishes to MQTT |
| `"Switch off yellow"` | Turns yellow LED off |
| `"Turn on all LEDs"` | Turns all three LEDs on |
| `"Turn everything off"` | Turns all LEDs off |
| `"What LEDs are on?"` | AI responds with current context |

---

## 📡 MQTT Topics

The app publishes to the following topics on `broker.hivemq.com`:

| Topic | Payload | Description |
|---|---|---|
| `arduino/simulator/leds/red` | `ON` / `OFF` | Controls the red LED |
| `arduino/simulator/leds/green` | `ON` / `OFF` | Controls the green LED |
| `arduino/simulator/leds/yellow` | `ON` / `OFF` | Controls the yellow LED |

You can subscribe to these topics from any MQTT client or real Arduino with an ESP8266/ESP32.

---

## 📁 Project Structure

```
talkled/
├── src/
│   ├── App.tsx              # Main UI: chat panel + Wokwi embed
│   ├── main.tsx             # React entry point
│   ├── index.css            # Tailwind CSS import
│   ├── types.ts             # TypeScript types (LedState, Message, etc.)
│   └── services/
│       └── gemini.ts        # Gemini AI client + function declarations
├── index.html
├── vite.config.ts
├── package.json
└── .env.example
```

---

## 🔧 Gemini Function Calling

TalkLed uses Gemini's **Function Calling** feature to extract structured LED commands from free-form user input:

```typescript
// Controls a single LED
set_led_state({ led: "red" | "green" | "yellow", state: "ON" | "OFF" })

// Controls all LEDs at once
set_all_leds_state({ state: "ON" | "OFF" })
```

The model decides which function to call based on intent — no regex or keyword matching needed.

---

## 🌐 Deployment

This project is deployed on **Vercel**. To deploy your own:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set `GEMINI_API_KEY` as an environment variable in your Vercel project settings.

---

## 🔮 Future Improvements

- [ ] **LED brightness control** — PWM dimming via natural language (`"dim the red LED to 50%"`)
- [ ] **Blink patterns** — Timed sequences (`"blink green 3 times"`)
- [ ] **Real Arduino support** — Full MQTT subscriber sketch for ESP32/ESP8266
- [ ] **Voice input** — Web Speech API integration
- [ ] **LED history log** — Timeline of all state changes
- [ ] **Multi-device support** — Control multiple Arduino boards via topic namespacing
- [ ] **Mobile app** — React Native port with the same MQTT backend

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
# Open a Pull Request
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👨‍💻 Author

<div align="center">

**Ficilabs**

[![GitHub](https://img.shields.io/badge/GitHub-ficilabs-181717?logo=github)](https://github.com/ficilabs)
[![Website](https://img.shields.io/badge/Website-ficilabs.vercel.app-0A66C2)](https://talkled-ficilabs.vercel.app)

*Building the bridge between AI and the physical world.*

</div>
