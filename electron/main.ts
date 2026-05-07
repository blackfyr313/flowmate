import {
  app,
  BrowserWindow,
  dialog,
  shell,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  Notification,
  screen,
} from 'electron'
import { join } from 'path'
import { tmpdir } from 'os'
import { ChildProcess, execFileSync, spawn } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import { setupIpcHandlers, loadSettings } from './ipc-handlers'

// ─── Constants ───────────────────────────────────────────────────────────────

const ENGINE_PORT = 7823
const ENGINE_HOST = `http://localhost:${ENGINE_PORT}`
const IS_DEV = !app.isPackaged
const PRELOAD_PATH = join(__dirname, '../preload/index.js')

// ─── State ───────────────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let engineProcess: ChildProcess | null = null
let engineReady = false
let minimizeToTray = true
let isQuitting = false

// ─── Admin Elevation ──────────────────────────────────────────────────────────

function isElevated(): boolean {
  try {
    // 'net session' succeeds only when the process has admin privileges
    execFileSync('net', ['session'], { stdio: 'ignore', timeout: 3000 })
    return true
  } catch {
    return false
  }
}

function relaunchAsAdmin(): void {
  // PowerShell spawn fails silently on Windows because Electron's Job Object kills
  // child processes when the parent exits. The fix: use wscript.exe + VBScript's
  // Shell.Application.ShellExecute, which is the Windows-native UAC trigger and
  // is not subject to Job Object inheritance.

  let vbsContent: string

  if (IS_DEV) {
    // Dev mode: electron-vite owns the Electron process; quitting it also tears down
    // the Vite dev server. Open a fresh elevated PowerShell window that re-runs
    // `npm run dev` from the project root instead.
    const projectDir = process.cwd()
    // Single-quoted PS path — no backslash issues, '' escapes a literal '
    const psPath = projectDir.replace(/'/g, "''")
    const psArg = `-NoExit -Command Set-Location '${psPath}'; npm run dev`
    vbsContent = [
      'Set sh = CreateObject("Shell.Application")',
      `sh.ShellExecute "powershell.exe", "${psArg}", "", "runas", 1`,
    ].join('\n')
  } else {
    // Production: relaunch the packaged exe with admin rights
    const exePath = process.execPath
    const extraArgs = process.argv.slice(1).join(' ')
    vbsContent = [
      'Set sh = CreateObject("Shell.Application")',
      `sh.ShellExecute "${exePath}", "${extraArgs}", "", "runas", 1`,
    ].join('\n')
  }

  const vbsPath = join(tmpdir(), 'flowmate_relaunch.vbs')
  writeFileSync(vbsPath, vbsContent, 'utf8')

  try {
    // Run wscript synchronously: ShellExecute fires the UAC prompt (via explorer.exe,
    // outside Electron's Job Object) before wscript exits, so the elevated process is
    // already in flight by the time we call app.quit().
    execFileSync('wscript.exe', [vbsPath], { timeout: 5000 })
  } catch {
    // Ignore — UAC dismissed or wscript error; we still quit.
  }

  app.quit()
}

// ─── Python Engine ────────────────────────────────────────────────────────────

function getEnginePath(): string {
  if (IS_DEV) {
    return join(process.cwd(), 'engine', 'main.py')
  }
  // In packaged app, engine is in extraResources
  return join(process.resourcesPath, 'engine', 'main.py')
}

function getPythonExecutable(): string {
  if (IS_DEV) {
    // Use the venv python if it exists, otherwise system python
    const venvPython = join(process.cwd(), 'engine', '.venv', 'Scripts', 'python.exe')
    if (existsSync(venvPython)) return venvPython
    return 'python'
  }
  // In packaged app, use bundled python
  const bundledPython = join(process.resourcesPath, 'python', 'python.exe')
  if (existsSync(bundledPython)) return bundledPython
  return 'python'
}

async function waitForEngine(maxRetries = 30, intervalMs = 500): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${ENGINE_HOST}/health`)
      if (res.ok) return true
    } catch {
      // Engine not ready yet
    }
    await new Promise(r => setTimeout(r, intervalMs))
  }
  return false
}

function startPythonEngine(): void {
  const enginePath = getEnginePath()
  const python = getPythonExecutable()

  console.log(`[FlowMate] Starting Python engine: ${python} ${enginePath}`)

  engineProcess = spawn(python, [enginePath, '--port', String(ENGINE_PORT)], {
    cwd: IS_DEV ? join(process.cwd(), 'engine') : join(process.resourcesPath, 'engine'),
    env: {
      ...process.env,
      FLOWMATE_PORT: String(ENGINE_PORT),
      FLOWMATE_DATA_DIR: app.getPath('userData'),
    },
    // Don't show Python console window on Windows
    windowsHide: true,
  })

  engineProcess.stdout?.on('data', (data: Buffer) => {
    console.log(`[Engine] ${data.toString().trim()}`)
  })

  engineProcess.stderr?.on('data', (data: Buffer) => {
    const msg = data.toString().trim()
    // Uvicorn logs to stderr by default — don't treat as errors
    if (msg) console.log(`[Engine stderr] ${msg}`)
  })

  engineProcess.on('error', (err) => {
    console.error('[Engine] Failed to start:', err.message)
    showCriticalError(`Failed to start automation engine: ${err.message}`)
  })

  engineProcess.on('exit', (code, signal) => {
    console.log(`[Engine] Exited with code ${code}, signal ${signal}`)
    engineReady = false
    // Restart engine if it crashed unexpectedly and app is still open
    if (code !== 0 && !isQuitting) {
      console.log('[Engine] Restarting in 2s...')
      setTimeout(startPythonEngine, 2000)
    }
  })
}

function stopPythonEngine(): void {
  if (engineProcess && !engineProcess.killed) {
    console.log('[FlowMate] Stopping Python engine...')
    engineProcess.kill('SIGTERM')
    engineProcess = null
  }
}

function showCriticalError(message: string): void {
  new Notification({
    title: 'FlowMate — Engine Error',
    body: message,
    urgency: 'critical',
  }).show()
}

// ─── Window ───────────────────────────────────────────────────────────────────

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,           // Custom title bar
    titleBarStyle: 'hidden',
    backgroundColor: '#0d0f14',
    show: false,            // Show once ready-to-show
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,       // Needed for IPC
    },
  })

  // Load renderer
  if (IS_DEV) {
    await mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Show window once DOM is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Open external links in default browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Minimize to tray on close (respects persisted setting)
  mainWindow.on('close', (event) => {
    if (!isQuitting && minimizeToTray) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })
}

// ─── System Tray ─────────────────────────────────────────────────────────────

function createTray(): void {
  // Use a simple 16x16 icon — replace with real icon in production
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open FlowMate',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      },
    },
    { type: 'separator' },
    {
      label: engineReady ? '● Engine Running' : '○ Engine Starting...',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Quit FlowMate',
      click: () => {
        isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setToolTip('FlowMate — Automation Engine')
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

// ─── IPC: Window Controls ────────────────────────────────────────────────────
// Custom title bar needs these

ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.on('window:close', () => mainWindow?.hide())

ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)

ipcMain.handle('cursor:pick', async () => {
  mainWindow?.minimize()
  await new Promise(r => setTimeout(r, 3000))
  const point = screen.getCursorScreenPoint()
  mainWindow?.restore()
  mainWindow?.show()
  mainWindow?.focus()
  return point
})

// ─── App Lifecycle ────────────────────────────────────────────────────────────

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

app.whenReady().then(async () => {
  const elevated = isElevated()
  console.log('[FlowMate] Running as administrator:', elevated)

  if (!elevated) {
    const response = dialog.showMessageBoxSync({
      type: 'question',
      buttons: ['Relaunch as Administrator', 'Continue Anyway'],
      defaultId: 0,
      cancelId: 1,
      title: 'Administrator Access Recommended',
      message: 'FlowMate needs administrator privileges',
      detail:
        'Without admin access, launching some applications and controlling windows may trigger repeated permission prompts.\n\nClick "Relaunch as Administrator" to approve once via Windows UAC.',
    })
    if (response === 0) {
      relaunchAsAdmin()
      return
    }
  }

  // Start the Python engine
  startPythonEngine()
  console.log('[FlowMate] Waiting for engine to start...')
  engineReady = await waitForEngine()

  if (!engineReady) {
    console.error('[FlowMate] Engine failed to start within timeout')
  } else {
    console.log('[FlowMate] Engine is ready!')
  }

  // Load persisted settings and apply them
  const userData = app.getPath('userData')
  const initialSettings = loadSettings(userData)
  minimizeToTray = initialSettings.minimizeToTray
  app.setLoginItemSettings({ openAtLogin: initialSettings.startOnLogin, openAsHidden: true })

  // Register all IPC handlers (DB, engine proxy, etc.)
  setupIpcHandlers({
    engineHost: ENGINE_HOST,
    userData,
    onSettingsChange: (s) => { minimizeToTray = s.minimizeToTray },
  })

  await createWindow()
  createTray()

  // Notify renderer that engine is ready
  mainWindow?.webContents.send('engine:status', { ready: engineReady })
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  stopPythonEngine()
})

app.on('will-quit', () => {
  stopPythonEngine()
})
