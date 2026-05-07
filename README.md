<div align="center">

# FlowMate

**No-code Windows automation — built by Blackfyre**

*Build, schedule, and run desktop automations without writing a single line of code.*

[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)](https://github.com/blackfyr313/flowmate/releases)
[![Platform](https://img.shields.io/badge/platform-Windows-0078d4?style=flat-square&logo=windows)](https://github.com/blackfyr313/flowmate/releases)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](./resources/license.txt)
[![Made by](https://img.shields.io/badge/made%20by-Blackfyre-7c5ff7?style=flat-square)](https://github.com/blackfyr313)

</div>

---

## What is FlowMate?

FlowMate is a Windows desktop app that lets you automate repetitive tasks visually. Chain together steps — open apps, navigate URLs, type text, press keys, move windows, click elements — then run them manually, on a schedule, or via a hotkey.

No Python knowledge required. No scripting. Just drag, drop, and run.

---

## Download

Head to [Releases](https://github.com/blackfyr313/flowmate/releases) and download **FlowMate Setup 1.0.0.exe**.

> **Note:** Windows may show a SmartScreen warning on first launch ("Unknown publisher"). Click **More info → Run anyway**. This is expected for apps without a paid code-signing certificate.

---

## Features

- **Visual automation builder** — drag-and-drop step ordering
- **9 Phase 1 steps** — Open App, Open URL, Wait, Type Text, Press Key, Move Window, Click Element, Wait for Window, Show Notification
- **Run history** — see every automation run and its step results
- **Trigger types** — manual, schedule, hotkey, on startup, on app launch
- **System tray** — runs quietly in the background
- **Admin elevation** — optional UAC prompt for full system access
- **Settings** — start on login, minimize to tray, import/export automations

---

## Architecture

```
┌─────────────────────────────────┐
│   Electron (BrowserWindow)      │
│   ┌─────────────────────────┐   │
│   │  React 18 + TypeScript  │   │
│   │  Zustand · @dnd-kit     │   │
│   │  Tailwind CSS           │   │
│   └──────────┬──────────────┘   │
│              │ IPC (contextBridge)
│   ┌──────────▼──────────────┐   │
│   │  Electron Main Process  │   │
│   │  Spawns Python engine   │   │
│   └──────────┬──────────────┘   │
└──────────────┼──────────────────┘
               │ HTTP localhost:7823
   ┌───────────▼───────────────┐
   │  Python FastAPI Engine    │
   │  Executor · Steps         │
   │  SQLite (aiosqlite)       │
   └───────────────────────────┘
```

---

## Development Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ (LTS) |
| Python | 3.11+ |

### 1. Clone and install

```bash
git clone https://github.com/blackfyr313/flowmate.git
cd flowmate
npm install
```

### 2. Set up Python engine

```bash
cd engine
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 3. Run in development

```bash
npm run dev
```

### 4. Build installer

```bash
npm run package
```

Output: `dist/FlowMate Setup 1.0.0.exe`

---

## Project Structure

```
flowmate/
├── electron/
│   ├── main.ts              # Main process — window, tray, engine, elevation
│   ├── preload.ts           # contextBridge API
│   └── ipc-handlers.ts      # IPC ↔ engine HTTP proxy
├── src/                     # React renderer
│   ├── components/
│   │   ├── Layout/          # TitleBar, Sidebar, AppLayout
│   │   ├── Dashboard/       # Dashboard, AutomationCard
│   │   ├── AutomationEditor/# Editor, steps, config forms
│   │   ├── RunHistory/
│   │   └── Settings/
│   ├── store/automationStore.ts
│   ├── types/index.ts
│   └── utils/engineApi.ts
├── engine/                  # Python FastAPI backend
│   ├── main.py
│   ├── models.py
│   ├── executor.py
│   ├── database.py
│   └── steps/               # One file per step type
├── resources/
│   ├── icon.png
│   ├── icon.ico
│   └── license.txt
└── scripts/
    └── gen_icon.py          # Regenerate app icon
```

---

## Steps Roadmap

| Phase | Steps | Status |
|-------|-------|--------|
| **1** | Open App, Open URL, Wait, Type Text, Press Key, Move Window, Click Element, Wait for Window, Show Notification | ✅ Live |
| **2** | Scroll, Drag & Drop, Hold Key, Focus/Minimize/Close Window, Kill Process | 🔧 Backend done, UI coming |
| **3** | Clipboard, System Volume, Lock Screen, Night Light, Brightness, Power | 📋 Planned |
| **4** | Condition (if/else), Loop, Variables, Run Automation, File operations | 📋 Planned |
| **5** | Image recognition, OCR click, HTTP requests, Download, Email, TTS | 📋 Planned |
| **6** | Secrets vault, Registry, Environment variables, Run Script | 📋 Planned |

---

## License

© 2025 FlowMate by Blackfyre. All rights reserved.
See [license.txt](./resources/license.txt) for full terms.
