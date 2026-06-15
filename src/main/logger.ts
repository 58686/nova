import { app } from 'electron'
import fs from 'fs'
import path from 'path'

interface LogEntry {
  timestamp: string
  level: string
  message: string
  data?: unknown
  context?: string
}

const LOG_DIR = path.join(app.getPath('userData'), 'logs')
const MAX_LOG_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_LOG_FILES = 7 // Keep 7 days of logs

/**
 * Ensure log directory exists.
 */
function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  }
}

/**
 * Get current log file path (YYYY-MM-DD.log).
 */
function getCurrentLogPath(): string {
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  return path.join(LOG_DIR, `${date}.log`)
}

/**
 * Rotate logs if current file exceeds MAX_LOG_SIZE.
 */
function rotateLogs(): void {
  const currentLog = getCurrentLogPath()

  if (fs.existsSync(currentLog)) {
    const stats = fs.statSync(currentLog)
    if (stats.size > MAX_LOG_SIZE) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const rotatedPath = currentLog.replace('.log', `-${timestamp}.log`)
      fs.renameSync(currentLog, rotatedPath)
    }
  }

  // Clean up old logs (keep only MAX_LOG_FILES)
  cleanOldLogs()
}

/**
 * Remove log files older than MAX_LOG_FILES days.
 */
function cleanOldLogs(): void {
  try {
    const files = fs.readdirSync(LOG_DIR)
    const logFiles = files
      .filter(f => f.endsWith('.log'))
      .map(f => ({
        name: f,
        path: path.join(LOG_DIR, f),
        mtime: fs.statSync(path.join(LOG_DIR, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime)

    // Delete files beyond MAX_LOG_FILES
    logFiles.slice(MAX_LOG_FILES).forEach(file => {
      fs.unlinkSync(file.path)
    })
  } catch (error) {
    console.error('Failed to clean old logs:', error)
  }
}

/**
 * Write a log entry to file.
 */
export function writeLog(entry: LogEntry): void {
  try {
    ensureLogDir()
    rotateLogs()

    const logPath = getCurrentLogPath()
    const line = JSON.stringify(entry) + '\n'

    fs.appendFileSync(logPath, line, 'utf-8')
  } catch (error) {
    console.error('Failed to write log:', error)
  }
}

/**
 * Get path to logs directory.
 */
export function getLogDir(): string {
  return LOG_DIR
}

/**
 * Main process logger (writes directly to file).
 */
export function log(level: string, message: string, data?: unknown, context?: string): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
    context,
  }

  // Console output
  const prefix = context ? `[${context}]` : '[Main]'
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log

  if (data) {
    logFn(`${prefix} ${message}`, data)
  } else {
    logFn(`${prefix} ${message}`)
  }

  // Write to file
  writeLog(entry)
}

export const mainLogger = {
  debug: (msg: string, data?: unknown) => log('debug', msg, data, 'Main'),
  info: (msg: string, data?: unknown) => log('info', msg, data, 'Main'),
  warn: (msg: string, data?: unknown) => log('warn', msg, data, 'Main'),
  error: (msg: string, error?: Error | unknown) => {
    const data = error instanceof Error
      ? { message: error.message, stack: error.stack, name: error.name }
      : error
    log('error', msg, data, 'Main')
  },
}
