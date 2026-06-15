/**
 * Structured logging service for Nova.
 * Writes logs to console (dev) and file (production).
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: unknown
  context?: string
}

class Logger {
  private context?: string

  constructor(context?: string) {
    this.context = context
  }

  /**
   * Create a child logger with specific context.
   */
  child(context: string): Logger {
    return new Logger(context)
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data)
  }

  error(message: string, error?: Error | unknown): void {
    const data = error instanceof Error
      ? { message: error.message, stack: error.stack, name: error.name }
      : error
    this.log('error', message, data)
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      data,
    }

    // Console output (always in dev, errors only in prod)
    if (import.meta.env.DEV || level === 'error') {
      const prefix = this.context ? `[${this.context}]` : '[Nova]'
      const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log

      if (data) {
        logFn(`${prefix} ${message}`, data)
      } else {
        logFn(`${prefix} ${message}`)
      }
    }

    // Send to main process for file writing (production only)
    if (!import.meta.env.DEV && window.electronAPI?.writeLog) {
      window.electronAPI.writeLog(entry).catch(() => {
        // Silently fail - don't want logging to break the app
      })
    }
  }
}

// Global logger instance
export const logger = new Logger()

// Named loggers for different modules
export const aiLogger = new Logger('AI')
export const storageLogger = new Logger('Storage')
export const ipcLogger = new Logger('IPC')
export const uiLogger = new Logger('UI')
