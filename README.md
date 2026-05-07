# FlowMate

**No-code Windows automation — built with Electron + React + Python FastAPI**

FlowMate lets you build, schedule, and run desktop automations without writing code. Chain together steps like opening apps, navigating URLs, typing text, and pressing keys — then run them on demand or on a schedule.

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

The React frontend communicates with the Electron main process via `contextBridge` IPC. The main process proxies all API calls to the Python engine running on `localhost:7823`. This separation keeps the UI snappy and the automation logic isolated and restartable.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | LTS recommended |
| Python | 3.11+ | 3.12 recommended |
| Tesseract OCR | 5.x | Optional — needed for Wait › Element mode |

### Install Tesseract (optional)

Download the installer from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki) and add it to your `PATH`.

---

## Quick Start

### 1. Clone and install Node dependencies

```bash
git clone https://github.com/your-org/flowmate.git
cd flowmate
npm install
```

### 2. Set up the Python engine

```bash
cd engine
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
cd ..
```

### 3. Run in development mode

```bash
npm run dev
```

This starts:
- **Vite** dev server for the React renderer (HMR enabled)
- **Electron** main process
- **Python FastAPI** engine (spawned automatically by Electron on port 7823)

---

## Project Structure

```
flowmate/
├── electron/
│   ├── main.ts              # Electron main process — window, tray, engine spawn
│   ├── preload.ts           # contextBridge API surface
│   └── ipc-handlers.ts      # IPC ↔ HTTP proxy handlers
│
├── src/                     # React renderer
│   ├── App.tsx
│   ├── types/index.ts       # Shared TypeScript types
│   ├── store/
│   │   └── automationStore.ts
│   ├── utils/
│   │   ├── engineApi.ts     # Typed API client
│   │   └── nanoid.ts
│   └── components/
│       ├── Layout/          # AppLayout, TitleBar, Sidebar
│       ├── Dashboard/       # Dashboard, AutomationCard
│       ├── AutomationEditor/# Editor, StepItem, StepConfigPanel, AddStepMenu
│       ├── RunHistory/      # RunHistory
│       ├── Settings/        # SettingsScreen
│       └── common/          # NotificationToast
│
├── engine/                  # Python FastAPI backend
│   ├── main.py              # FastAPI app + routes
│   ├── models.py            # Pydantic v2 models
│   ├── database.py          # SQLite CRUD
│   ├── executor.py          # Step runner with retry + cancellation
│   ├── requirements.txt
│   └── steps/
│       ├── __init__.py      # Step registry
│       ├── open_app.py
│       ├── open_url.py
│       ├── wait_step.py
│       ├── type_text.py
│       ├── press_key.py
│       └── show_notification.py
│
├── package.json
├── electron.vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start full dev environment (Electron + Vite + engine) |
| `npm run build` | Build for production (all three contexts) |
| `npm run build:win` | Package Windows NSIS installer |
| `npm run preview` | Preview the renderer build |

---

## Phase 1 Steps

| Step | Description |
|------|-------------|
| **Open App** | Launch any `.exe` with arguments; optionally wait for the window |
| **Open URL** | Open a URL in default, Chrome, Firefox, or Edge |
| **Wait** | Pause for N seconds, or wait until text appears on screen (OCR) |
| **Type Text** | Type a string at the current cursor position |
| **Press Key** | Press a key or combo (e.g. `ctrl+c`, `alt+F4`) with repeat support |
| **Show Notification** | Display a Windows desktop toast notification |

## Phase 2 Steps (coming soon)

Click Element, Login Form, Move/Resize Window, System Setting, Run Script, Condition (if/else), Loop

---

## Engine API

The Python engine exposes a REST API on `http://localhost:7823`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Engine status check |
| `GET` | `/automations` | List all automations |
| `POST` | `/automations` | Create a new automation |
| `GET` | `/automations/{id}` | Get automation by ID |
| `PUT` | `/automations/{id}` | Update automation |
| `DELETE` | `/automations/{id}` | Delete automation |
| `POST` | `/automations/{id}/run` | Start a run |
| `POST` | `/automations/{id}/stop` | Cancel an active run |
| `POST` | `/automations/{id}/steps/{stepId}/test` | Test a single step |
| `GET` | `/runs` | List run history |
| `GET` | `/runs/{id}` | Get a specific run |

---

## Data Storage

Automations and run history are stored in SQLite at:

```
%APPDATA%\FlowMate\flowmate.db
```

You can export/import automations as JSON from the **Settings** screen.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push and open a PR

---

## License

MIT © FlowMate Contributors
