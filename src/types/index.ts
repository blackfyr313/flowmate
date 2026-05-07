// ─── Step Types ───────────────────────────────────────────────────────────────

// Phase 1: Active - Desktop Automation Foundation
export type Phase1StepType =
  | 'open_app'
  | 'open_url'
  | 'wait'
  | 'type_text'
  | 'press_key'
  | 'move_window'
  | 'show_notification'
  | 'click_element'
  | 'wait_for_window'

// Phase 2: Active - Advanced Interaction
export type Phase2StepType =
  | 'scroll'
  | 'drag_drop'
  | 'hold_key'
  | 'focus_window'
  | 'minimize_window'
  | 'close_window'
  | 'kill_process'

// Phase 3: Coming Soon - System & Clipboard Control
export type Phase3StepType =
  | 'login'
  | 'run_script'
  | 'clipboard_write'
  | 'clipboard_paste'
  | 'clipboard_read'
  | 'set_volume'
  | 'lock_screen'
  | 'toggle_night_light'
  | 'set_brightness'
  | 'power_action'
  | 'system_setting' // deprecated: mapping to specific types above

// Phase 4: Coming Soon - Logic & File Operations
export type Phase4StepType =
  | 'condition'
  | 'loop'
  | 'loop_break'
  | 'variable'
  | 'run_automation'
  | 'file_create'
  | 'file_copy'
  | 'file_delete'
  | 'file_write'
  | 'file_read'
  | 'file_open'

// Phase 5: Coming Soon - Vision & Integrations
export type Phase5StepType =
  | 'wait_for_image'
  | 'ocr_click'
  | 'click_by_image'
  | 'http_request'
  | 'download_file'
  | 'play_sound'
  | 'send_email'
  | 'text_to_speech'

// Phase 6: Coming Soon - Advanced Automation
export type Phase6StepType =
  | 'use_secret'
  | 'set_audio_device'
  | 'registry_read'
  | 'registry_write'
  | 'env_variable'
  | 'empty_recycle_bin'

export type StepType = 
  | Phase1StepType 
  | Phase2StepType 
  | Phase3StepType 
  | Phase4StepType 
  | Phase5StepType 
  | Phase6StepType

// ─── Step Configs ─────────────────────────────────────────────────────────────

export interface OpenAppConfig {
  appPath: string
  arguments?: string[]
  waitForLoad?: boolean
}

export interface OpenUrlConfig {
  url: string
  browser?: 'default' | 'chrome' | 'firefox' | 'edge'
  waitForLoad?: boolean
}

export interface WaitConfig {
  seconds: number
}

export interface TypeTextConfig {
  text: string
  intervalMs?: number
  pressEnter?: boolean
}

export interface PressKeyConfig {
  keys: string[]
  repeatCount?: number
  delayMs?: number
}

export interface MoveWindowConfig {
  processName: string
  maximize?: boolean
  x: number
  y: number
  width: number
  height: number
}

export interface ShowNotificationConfig {
  title: string
  message: string
  duration?: number
}

export interface ClickElementConfig { x: number; y: number; button: 'left' | 'right' | 'double' }
export interface WaitForWindowConfig { windowTitle: string; processName?: string; timeoutSeconds?: number }

// Phase 2 configs
export interface ScrollConfig { x: number; y: number; direction: 'up' | 'down'; amount: number }
export interface DragDropConfig { x1: number; y1: number; x2: number; y2: number; duration?: number }
export interface HoldKeyConfig { keys: string[]; duration: number }
export interface FocusWindowConfig { processName?: string; windowTitle?: string }
export interface MinimizeWindowConfig { processName?: string; windowTitle?: string }
export interface CloseWindowConfig { processName?: string; windowTitle?: string }
export interface KillProcessConfig { processName: string }

// Phase 3+ configs
export interface LoginConfig { credentialName: string }
export interface SystemSettingConfig { setting: string; value: number | boolean }
export interface RunScriptConfig { scriptType: 'python' | 'batch' | 'powershell'; inlineScript?: string }
export interface ConditionConfig { conditionType: string; target: string; value: string }
export interface LoopConfig { count: number; targetStepId: string }
export interface VariableConfig { name: string; value: string }
export interface RunAutomationConfig { automationId: string }

// Phase 3: System & Clipboard
export interface ClipboardWriteConfig { text: string }
export interface ClipboardPasteConfig { target?: string; delayMs?: number }
export interface ClipboardReadConfig { outputVariable: string }
export interface SetVolumeConfig { level: number; mute?: boolean }
export interface LockScreenConfig { delay?: number }
export interface ToggleNightLightConfig { enable: boolean }
export interface SetBrightnessConfig { level: number; monitor?: number }
export interface PowerActionConfig { action: 'sleep' | 'shutdown' | 'restart'; delay?: number }

// Phase 4: File Operations
export interface FileCreateConfig { filePath: string; content?: string }
export interface FileCopyConfig { sourcePath: string; destinationPath: string; overwrite?: boolean }
export interface FileDeleteConfig { filePath: string; permanent?: boolean }
export interface FileWriteConfig { filePath: string; content: string; append?: boolean }
export interface FileReadConfig { filePath: string; outputVariable: string }
export interface FileOpenConfig { filePath: string; application?: string }
export interface LoopBreakConfig { condition?: string }
export interface WaitForImageConfig { imagePath: string; timeoutSeconds?: number; similarity?: number }

// Phase 5: Vision & Integrations
export interface OcrClickConfig { ocrText: string; x?: number; y?: number; similarity?: number }
export interface ClickByImageConfig { imagePath: string; x?: number; y?: number; similarity?: number }
export interface HttpRequestConfig { method: 'GET' | 'POST' | 'PUT' | 'DELETE'; url: string; headers?: Record<string, string>; body?: string; outputVariable?: string }
export interface DownloadFileConfig { url: string; savePath: string }
export interface PlaySoundConfig { audioPath: string; volume?: number }
export interface SendEmailConfig { to: string; subject: string; body: string; attachments?: string[] }
export interface TextToSpeechConfig { text: string; rate?: number; volume?: number }

// Phase 6: Advanced
export interface UseSecretConfig { secretName: string; outputVariable?: string }
export interface SetAudioDeviceConfig { deviceName: string }
export interface RegistryReadConfig { path: string; key: string; outputVariable: string }
export interface RegistryWriteConfig { path: string; key: string; value: string; type: 'string' | 'dword' }
export interface EnvVariableConfig { name: string; value: string; scope: 'user' | 'system' }
export interface EmptyRecycleBinConfig { permanent?: boolean }

export type StepConfig =
  | OpenAppConfig | OpenUrlConfig | WaitConfig | TypeTextConfig
  | PressKeyConfig | MoveWindowConfig | ShowNotificationConfig
  | ClickElementConfig | WaitForWindowConfig
  | ScrollConfig | DragDropConfig | HoldKeyConfig
  | FocusWindowConfig | MinimizeWindowConfig | CloseWindowConfig | KillProcessConfig
  | LoginConfig | SystemSettingConfig
  | RunScriptConfig | ConditionConfig | LoopConfig
  | ClipboardWriteConfig | ClipboardPasteConfig | ClipboardReadConfig | SetVolumeConfig | LockScreenConfig
  | ToggleNightLightConfig | SetBrightnessConfig | PowerActionConfig
  | FileCreateConfig | FileCopyConfig | FileDeleteConfig
  | FileWriteConfig | FileReadConfig | FileOpenConfig | LoopBreakConfig
  | VariableConfig | RunAutomationConfig | WaitForImageConfig
  | OcrClickConfig | ClickByImageConfig | HttpRequestConfig
  | DownloadFileConfig | PlaySoundConfig | SendEmailConfig | TextToSpeechConfig
  | UseSecretConfig | SetAudioDeviceConfig
  | RegistryReadConfig | RegistryWriteConfig
  | EnvVariableConfig | EmptyRecycleBinConfig

// ─── Step ─────────────────────────────────────────────────────────────────────

export interface Step {
  id: string
  type: StepType
  name: string
  enabled: boolean
  config: StepConfig
  onFailure: 'pause' | 'skip' | 'notify' | 'stop'  // 'stop' is legacy alias for 'pause'
  createdAt: string
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

export type TriggerType = 'manual' | 'startup' | 'schedule' | 'hotkey' | 'app_launch'

export interface Trigger {
  type: TriggerType
  schedule?: string
  hotkey?: string
  appName?: string
}

// ─── Automation ───────────────────────────────────────────────────────────────

export type AutomationStatus = 'idle' | 'running' | 'paused' | 'success' | 'error'

export interface Automation {
  id: string
  name: string
  description?: string
  emoji?: string
  steps: Step[]
  trigger: Trigger
  enabled: boolean
  status: AutomationStatus
  lastRunAt?: string
  lastRunSuccess?: boolean
  createdAt: string
  updatedAt: string
}

// ─── Run History ──────────────────────────────────────────────────────────────

export type StepRunStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped'

export interface StepRunResult {
  stepId: string
  stepName: string
  status: StepRunStatus
  durationMs: number
  error?: string
  retryCount: number
}

export type RunStatus = 'running' | 'paused' | 'completed' | 'stopped'

export interface AutomationRun {
  id: string
  automationId: string
  automationName: string
  startedAt: string
  completedAt?: string
  success: boolean
  stepResults: StepRunResult[]
  error?: string
  // Live execution state
  runStatus: RunStatus
  currentStepIndex: number
  failedStepId?: string
}

// ─── Run Actions ──────────────────────────────────────────────────────────────

export type RunAction = 'retry' | 'skip' | 'resume' | 'stop'

// ─── Engine State ─────────────────────────────────────────────────────────────

export interface EngineStatus {
  ready: boolean
  version?: string
}

export interface ActiveRun {
  automationId: string
  runId: string
  status: AutomationStatus
  stepResults: StepRunResult[]
  currentStepIndex: number
  failedStepId?: string
  error?: string
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export type AppView = 'dashboard' | 'editor' | 'history' | 'credentials' | 'settings'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
}

// ─── Step Metadata (for UI) ───────────────────────────────────────────────────

export interface StepTypeMeta {
  type: StepType
  label: string
  description: string
  icon: string
  color: string
  phase: 1 | 2 | 3 | 4 | 5 | 6
  category: string
}

export const STEP_TYPE_META: Record<StepType, StepTypeMeta> = {
  open_app: {
    type: 'open_app', label: 'Open Application',
    description: 'Launch any app or .exe file',
    icon: '🚀', color: 'accent-primary', phase: 1, category: 'App & Browser',
  },
  open_url: {
    type: 'open_url', label: 'Open URL',
    description: 'Open a website in your browser',
    icon: '🌐', color: 'accent-primary', phase: 1, category: 'App & Browser',
  },
  wait: {
    type: 'wait', label: 'Wait',
    description: 'Pause for a fixed duration',
    icon: '⏱️', color: 'accent-warning', phase: 1, category: 'Timing & Waiting',
  },
  type_text: {
    type: 'type_text', label: 'Type Text',
    description: 'Type text into the focused window',
    icon: '⌨️', color: 'accent-primary', phase: 1, category: 'Keyboard',
  },
  press_key: {
    type: 'press_key', label: 'Press Key / Shortcut',
    description: 'Send a keyboard shortcut like Ctrl+C',
    icon: '🎯', color: 'accent-primary', phase: 1, category: 'Keyboard',
  },
  move_window: {
    type: 'move_window', label: 'Move & Resize Window',
    description: 'Position and resize any open window',
    icon: '🪟', color: 'accent-primary', phase: 1, category: 'Window Management',
  },
  show_notification: {
    type: 'show_notification', label: 'Show Notification',
    description: 'Display a Windows toast notification',
    icon: '🔔', color: 'accent-success', phase: 1, category: 'Notifications',
  },
  click_element: {
    type: 'click_element', label: 'Click at Position',
    description: 'Move cursor to (x, y) and click',
    icon: '🖱️', color: 'accent-primary', phase: 1, category: 'Mouse',
  },
  wait_for_window: {
    type: 'wait_for_window', label: 'Wait for Window',
    description: 'Pause until a window with matching title appears',
    icon: '🪟', color: 'accent-warning', phase: 1, category: 'Timing & Waiting',
  },
  scroll: {
    type: 'scroll', label: 'Scroll',
    description: 'Scroll up or down at a screen position',
    icon: '🖱️', color: 'accent-primary', phase: 2, category: 'Mouse',
  },
  drag_drop: {
    type: 'drag_drop', label: 'Drag & Drop',
    description: 'Click and drag from one position to another',
    icon: '↕️', color: 'accent-primary', phase: 2, category: 'Mouse',
  },
  hold_key: {
    type: 'hold_key', label: 'Hold Key',
    description: 'Hold a key or shortcut down for a set duration',
    icon: '⌨️', color: 'accent-primary', phase: 2, category: 'Keyboard',
  },
  focus_window: {
    type: 'focus_window', label: 'Focus Window',
    description: 'Bring a window to the foreground',
    icon: '🪟', color: 'accent-primary', phase: 2, category: 'Window Management',
  },
  minimize_window: {
    type: 'minimize_window', label: 'Minimize Window',
    description: 'Minimize a window to the taskbar',
    icon: '🪟', color: 'accent-primary', phase: 2, category: 'Window Management',
  },
  close_window: {
    type: 'close_window', label: 'Close Window',
    description: 'Gracefully close a window',
    icon: '❌', color: 'accent-danger', phase: 2, category: 'Window Management',
  },
  kill_process: {
    type: 'kill_process', label: 'Kill Process',
    description: 'Force-terminate a running process',
    icon: '💀', color: 'accent-danger', phase: 2, category: 'Window Management',
  },
  login: {
    type: 'login', label: 'Login',
    description: 'Auto-fill credentials into a login form',
    icon: '🔐', color: 'accent-secondary', phase: 3, category: 'Credentials & Security',
  },
  run_script: {
    type: 'run_script', label: 'Run Script',
    description: 'Execute a Python, batch, or PowerShell script',
    icon: '📜', color: 'accent-secondary', phase: 3, category: 'Scripts',
  },
  system_setting: {
    type: 'system_setting', label: 'Set System Setting',
    description: 'Change volume, brightness, night mode, etc.',
    icon: '⚙️', color: 'accent-secondary', phase: 3, category: 'System Controls',
  },
  clipboard_write: {
    type: 'clipboard_write', label: 'Copy to Clipboard',
    description: 'Write text or a file path to the clipboard',
    icon: '📋', color: 'accent-secondary', phase: 3, category: 'Clipboard',
  },
  clipboard_paste: {
    type: 'clipboard_paste', label: 'Paste from Clipboard',
    description: 'Paste clipboard content into the focused window',
    icon: '📋', color: 'accent-secondary', phase: 3, category: 'Clipboard',
  },
  clipboard_read: {
    type: 'clipboard_read', label: 'Read Clipboard',
    description: 'Read current clipboard content into a variable',
    icon: '📄', color: 'accent-secondary', phase: 3, category: 'Clipboard',
  },
  set_volume: {
    type: 'set_volume', label: 'Set Volume',
    description: 'Adjust system volume or mute',
    icon: '🔊', color: 'accent-secondary', phase: 3, category: 'System Controls',
  },
  lock_screen: {
    type: 'lock_screen', label: 'Lock Screen',
    description: 'Lock the Windows screen',
    icon: '🔒', color: 'accent-secondary', phase: 3, category: 'System Controls',
  },
  toggle_night_light: {
    type: 'toggle_night_light', label: 'Toggle Night Light',
    description: 'Enable or disable Windows Night Light',
    icon: '🌙', color: 'accent-secondary', phase: 3, category: 'System Controls',
  },
  set_brightness: {
    type: 'set_brightness', label: 'Set Brightness',
    description: 'Adjust display brightness',
    icon: '☀️', color: 'accent-secondary', phase: 3, category: 'System Controls',
  },
  power_action: {
    type: 'power_action', label: 'Sleep / Shutdown / Restart',
    description: 'Sleep, shutdown, or restart the computer',
    icon: '⏻️', color: 'accent-secondary', phase: 3, category: 'System Controls',
  },
  condition: {
    type: 'condition', label: 'Condition (If / Else)',
    description: 'Branch based on a condition (window open, value, etc.)',
    icon: '🔀', color: 'accent-secondary', phase: 4, category: 'Logic & Control Flow',
  },
  loop: {
    type: 'loop', label: 'Loop',
    description: 'Repeat a set of steps a fixed number of times',
    icon: '🔁', color: 'accent-secondary', phase: 4, category: 'Logic & Control Flow',
  },
  loop_break: {
    type: 'loop_break', label: 'Break Loop',
    description: 'Exit the current loop early',
    icon: '⏹️', color: 'accent-secondary', phase: 4, category: 'Logic & Control Flow',
  },
  variable: {
    type: 'variable', label: 'Set Variable',
    description: 'Store a value and reuse it in later steps',
    icon: '📦', color: 'accent-secondary', phase: 4, category: 'Logic & Control Flow',
  },
  run_automation: {
    type: 'run_automation', label: 'Run Automation',
    description: 'Trigger another saved automation as a sub-routine',
    icon: '⚡', color: 'accent-secondary', phase: 4, category: 'Logic & Control Flow',
  },
  file_create: {
    type: 'file_create', label: 'Create File / Folder',
    description: 'Create a new file with optional content',
    icon: '📄', color: 'accent-secondary', phase: 4, category: 'File & Folder Operations',
  },
  file_copy: {
    type: 'file_copy', label: 'Copy / Move File',
    description: 'Copy a file from source to destination',
    icon: '📋', color: 'accent-secondary', phase: 4, category: 'File & Folder Operations',
  },
  file_delete: {
    type: 'file_delete', label: 'Delete File',
    description: 'Delete a file or folder',
    icon: '🗑️', color: 'accent-secondary', phase: 4, category: 'File & Folder Operations',
  },
  file_write: {
    type: 'file_write', label: 'Write to File',
    description: 'Write or append content to a file',
    icon: '✍️', color: 'accent-secondary', phase: 4, category: 'File & Folder Operations',
  },
  file_read: {
    type: 'file_read', label: 'Read from File',
    description: 'Read file content into a variable',
    icon: '📖', color: 'accent-secondary', phase: 4, category: 'File & Folder Operations',
  },
  file_open: {
    type: 'file_open', label: 'Open File',
    description: 'Open a file with its default application',
    icon: '📂', color: 'accent-secondary', phase: 4, category: 'File & Folder Operations',
  },
  wait_for_image: {
    type: 'wait_for_image', label: 'Wait for Image',
    description: 'Pause until a specific image appears on screen',
    icon: '🖼️', color: 'accent-secondary', phase: 5, category: 'Smart Vision',
  },
  ocr_click: {
    type: 'ocr_click', label: 'OCR Click',
    description: 'Find any text visible on screen and click it',
    icon: '👁️', color: 'accent-secondary', phase: 5, category: 'Smart Vision',
  },
  click_by_image: {
    type: 'click_by_image', label: 'Click by Image',
    description: 'Find an image on screen and click it',
    icon: '🖱️', color: 'accent-secondary', phase: 5, category: 'Smart Vision',
  },
  http_request: {
    type: 'http_request', label: 'HTTP Request',
    description: 'Send an HTTP GET/POST/PUT/DELETE request',
    icon: '🌐', color: 'accent-secondary', phase: 5, category: 'Network & Webhooks',
  },
  download_file: {
    type: 'download_file', label: 'Download File',
    description: 'Download a file from a URL',
    icon: '⬇️', color: 'accent-secondary', phase: 5, category: 'Network & Webhooks',
  },
  play_sound: {
    type: 'play_sound', label: 'Play Sound',
    description: 'Play an audio file or Windows system sound',
    icon: '🔊', color: 'accent-secondary', phase: 5, category: 'Communication',
  },
  send_email: {
    type: 'send_email', label: 'Send Email',
    description: 'Send an email via SMTP when automation finishes',
    icon: '📧', color: 'accent-secondary', phase: 5, category: 'Communication',
  },
  text_to_speech: {
    type: 'text_to_speech', label: 'Text to Speech',
    description: 'Speak a message aloud using Windows TTS',
    icon: '🗣️', color: 'accent-secondary', phase: 5, category: 'Communication',
  },
  use_secret: {
    type: 'use_secret', label: 'Use Secret',
    description: 'Inject a stored secret into any field without it appearing in logs',
    icon: '🔑', color: 'accent-secondary', phase: 6, category: 'Credentials & Security',
  },
  set_audio_device: {
    type: 'set_audio_device', label: 'Set Default Audio Device',
    description: 'Switch between speakers and headphones',
    icon: '🎧', color: 'accent-secondary', phase: 6, category: 'System Advanced',
  },
  registry_read: {
    type: 'registry_read', label: 'Registry Read',
    description: 'Read a Windows Registry value',
    icon: '📚', color: 'accent-secondary', phase: 6, category: 'System Advanced',
  },
  registry_write: {
    type: 'registry_write', label: 'Registry Write',
    description: 'Write a value to Windows Registry',
    icon: '✍️', color: 'accent-secondary', phase: 6, category: 'System Advanced',
  },
  env_variable: {
    type: 'env_variable', label: 'Environment Variable',
    description: 'Read or set an environment variable for the session',
    icon: '🌍', color: 'accent-secondary', phase: 6, category: 'System Advanced',
  },
  empty_recycle_bin: {
    type: 'empty_recycle_bin', label: 'Empty Recycle Bin',
    description: 'Clear the Windows Recycle Bin silently',
    icon: '🗑️', color: 'accent-secondary', phase: 6, category: 'System Advanced',
  },
}

// ─── Default Configs ──────────────────────────────────────────────────────────

export function getDefaultStepConfig(type: StepType): StepConfig {
  switch (type) {
    // Phase 1
    case 'open_app':    return { appPath: '', waitForLoad: true }
    case 'open_url':    return { url: '', browser: 'default', waitForLoad: true }
    case 'wait':        return { seconds: 2 }
    case 'type_text':   return { text: '', intervalMs: 0, pressEnter: false }
    case 'press_key':   return { keys: [], repeatCount: 1 }
    case 'move_window': return { processName: '', maximize: true, x: 0, y: 0, width: 1280, height: 720 }
    case 'show_notification': return { title: '', message: '' }
    case 'click_element':    return { x: 0, y: 0, button: 'left' }
    case 'wait_for_window':  return { windowTitle: '', processName: '', timeoutSeconds: 30 }
    // Phase 2
    case 'scroll':           return { x: 0, y: 0, direction: 'down', amount: 3 }
    case 'drag_drop':        return { x1: 0, y1: 0, x2: 100, y2: 100, duration: 0.5 }
    case 'hold_key':         return { keys: [], duration: 1.0 }
    case 'focus_window':     return { processName: '', windowTitle: '' }
    case 'minimize_window':  return { processName: '', windowTitle: '' }
    case 'close_window':     return { processName: '', windowTitle: '' }
    case 'kill_process':     return { processName: '' }
    // Phase 3
    case 'login':            return { credentialName: '' }
    case 'system_setting':   return { setting: 'volume', value: 50 }
    case 'run_script':       return { scriptType: 'python', inlineScript: '' }
    case 'clipboard_write':  return { text: '' }
    case 'clipboard_paste':  return { target: '', delayMs: 0 }
    case 'clipboard_read':   return { outputVariable: '' }
    case 'set_volume':       return { level: 50, mute: false }
    case 'lock_screen':      return { delay: 0 }
    case 'toggle_night_light': return { enable: true }
    case 'set_brightness':   return { level: 50, monitor: 0 }
    case 'power_action':     return { action: 'sleep', delay: 0 }
    // Phase 4
    case 'condition':        return { conditionType: 'process_running', target: '', value: '' }
    case 'loop':             return { count: 3, targetStepId: '' }
    case 'loop_break':       return { condition: '' }
    case 'variable':         return { name: '', value: '' }
    case 'run_automation':   return { automationId: '' }
    case 'file_create':      return { filePath: '', content: '' }
    case 'file_copy':        return { sourcePath: '', destinationPath: '', overwrite: false }
    case 'file_delete':      return { filePath: '', permanent: false }
    case 'file_write':       return { filePath: '', content: '', append: false }
    case 'file_read':        return { filePath: '', outputVariable: '' }
    case 'file_open':        return { filePath: '', application: '' }
    // Phase 5
    case 'wait_for_image':   return { imagePath: '', timeoutSeconds: 30, similarity: 0.9 }
    case 'ocr_click':        return { ocrText: '', x: 0, y: 0, similarity: 0.8 }
    case 'click_by_image':   return { imagePath: '', x: 0, y: 0, similarity: 0.9 }
    case 'http_request':     return { method: 'GET', url: '', headers: {}, outputVariable: '' }
    case 'download_file':    return { url: '', savePath: '' }
    case 'play_sound':       return { audioPath: '', volume: 100 }
    case 'send_email':       return { to: '', subject: '', body: '', attachments: [] }
    case 'text_to_speech':   return { text: '', rate: 1.0, volume: 100 }
    // Phase 6
    case 'use_secret':       return { secretName: '', outputVariable: '' }
    case 'set_audio_device': return { deviceName: '' }
    case 'registry_read':    return { path: '', key: '', outputVariable: '' }
    case 'registry_write':   return { path: '', key: '', value: '', type: 'string' }
    case 'env_variable':     return { name: '', value: '', scope: 'user' }
    case 'empty_recycle_bin': return { permanent: false }
    default: return {} as StepConfig
  }
}
