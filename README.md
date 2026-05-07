<div align="center">

<img src="resources/icon.png" alt="FlowMate" width="120" />

# FlowMate

**No-code Windows automation — built by Blackfyre**

*Build, schedule, and run desktop automations without writing a single line of code.*

[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)](https://github.com/blackfyr313/flowmate/releases/tag/v1.0.0)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078d4?style=flat-square&logo=windows)](https://github.com/blackfyr313/flowmate/releases)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](./resources/license.txt)
[![Made by](https://img.shields.io/badge/made%20by-Blackfyre-7c5ff7?style=flat-square)](https://github.com/blackfyr313)
[![Phase](https://img.shields.io/badge/phase-1%20of%206-green?style=flat-square)]()

</div>

---

## Download

<div align="center">

**[⬇ FlowMate Setup 1.0.0.exe](https://github.com/blackfyr313/flowmate/releases/download/v1.0.0/FlowMateSetup.exe)**

*Windows 10 / 11 · 64-bit · No dependencies required*

</div>

> **SmartScreen warning?** Click **More info → Run anyway**. This is expected for apps without a paid code-signing certificate.

---

## What is FlowMate?

FlowMate is a Windows desktop app that lets you automate repetitive tasks visually — no coding required.

Chain together steps like opening apps, navigating URLs, typing text, pressing keys, moving windows, and clicking elements. Then run them manually, on a schedule, via a hotkey, or automatically when an app launches.

**Who is it for?**
- Power users who repeat the same tasks every day
- Gamers who want to automate setup routines
- Professionals who launch the same set of tools each morning
- Anyone tired of clicking through the same steps over and over

---

## Features

| Feature | Description |
|---------|-------------|
| Visual builder | Drag-and-drop step ordering — no scripting |
| 9 built-in steps | Open App, Open URL, Wait, Type Text, Press Key, Move Window, Click Element, Wait for Window, Show Notification |
| Multiple triggers | Manual, schedule, hotkey, on startup, on app launch |
| Run history | Full log of every automation run with per-step results |
| System tray | Runs silently in the background, always ready |
| Admin elevation | One-time UAC prompt for full system access |
| Import / Export | Share automations as JSON files |
| Start on login | Launch FlowMate automatically with Windows |

---

## How It Works

1. **Create an automation** — give it a name and choose a trigger
2. **Add steps** — pick from the step library and configure each one
3. **Run it** — manually, on a schedule, or via hotkey
4. **Check history** — see exactly what ran and what didn't

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

**Tech stack:**
- **Frontend** — React 18, TypeScript, Tailwind CSS, Zustand, @dnd-kit
- **Backend** — Python 3.11, FastAPI, uvicorn, aiosqlite, pyautogui, pygetwindow
- **Shell** — Electron 32, electron-vite, electron-builder

---

## Roadmap

FlowMate is being built in 6 phases. Phase 1 is live — everything below is coming.

### ✅ Phase 1 — Core Automation (Live)
> The foundation: the steps you'll use every single day.

- Open App
- Open URL
- Wait (fixed delay)
- Type Text
- Press Key / Key Combo
- Move & Resize Window
- Click Element (by coordinates)
- Wait for Window
- Show Notification

---

### 🔧 Phase 2 — Advanced Input & Window Control *(Coming Soon)*
> More precise control over the mouse, keyboard, and open windows.

- Scroll (up / down / amount)
- Drag & Drop (coordinates)
- Hold Key (for gaming / shortcuts)
- Focus / Minimize / Close Window
- Kill Process

---

### 📋 Phase 3 — System Controls *(Planned)*
> Automate system-level settings and state.

- Clipboard read / write
- System Volume (set, mute, unmute)
- Lock Screen
- Night Light toggle
- Brightness control
- Power actions (sleep, shutdown, restart)

---

### 📋 Phase 4 — Logic & Flow Control *(Planned)*
> Turn linear automations into intelligent workflows.

- Condition (if / else)
- Loop (repeat N times or until condition)
- Variables (set, get, use in steps)
- Run Another Automation (subroutine)
- File operations (read, write, delete, move)

---

### 📋 Phase 5 — Smart Automation *(Planned)*
> See, hear, and interact with the web and the world.

- Image recognition (find image on screen and click it)
- OCR click (find text on screen and click it)
- HTTP requests (call an API, get data)
- File download
- Send Email
- Text-to-Speech

---

### 📋 Phase 6 — Power Features *(Planned)*
> For advanced users who want full control.

- Secrets vault (store passwords / tokens safely)
- Windows Registry read / write
- Environment variables
- Run Script (PowerShell, Python, batch)

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

Output: `dist/FlowMateSetup.exe`

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

## Contributing

FlowMate is a proprietary project — source is available for reference but not open for contributions at this time. If you'd like to report a bug or suggest a feature, please open an [issue](https://github.com/blackfyr313/flowmate/issues).

---

## License

© 2025 FlowMate by Blackfyre. All rights reserved.  
See [license.txt](./resources/license.txt) for full terms.

---

<div align="center">

Built with care by **Blackfyre** · [GitHub](https://github.com/blackfyr313)

</div>
