/**
 * Logger — SidhaHisab Rider
 *
 * Coloured, level-aware logger that is fully silent in production.
 * Use `logger.debug | info | warn | error` throughout the app.
 *
 * Usage:
 *   import { logger } from '@/core/utils/logger';
 *   logger.info('auth', 'Driver logged in', { driverId });
 *   logger.error('payment', 'Confirm failed', error);
 */

// ─── Types ────────────────────────────────────────────────────────────────────

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  tag: string;
  message: string;
  data?: unknown;
  timestamp: string;
}

// ─── ANSI colours for Metro / terminal output ─────────────────────────────────

const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[37m', // white
  info:  '\x1b[36m', // cyan
  warn:  '\x1b[33m', // yellow
  error: '\x1b[31m', // red
};
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';
const DIM   = '\x1b[2m';

const ICONS: Record<LogLevel, string> = {
  debug: '🔍',
  info:  '💬',
  warn:  '⚠️ ',
  error: '🔴',
};

// ─── In-memory log buffer (last 200 entries) — useful for support/debug exports

const LOG_BUFFER_SIZE = 200;
const _buffer: LogEntry[] = [];

// ─── Core print function ──────────────────────────────────────────────────────

function _log(level: LogLevel, tag: string, message: string, data?: unknown): void {
  if (!__DEV__ && level !== 'error') return; // silence everything except errors in prod

  const timestamp = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  const color = COLORS[level];
  const icon  = ICONS[level];

  // Store in buffer regardless of __DEV__
  const entry: LogEntry = { level, tag, message, data, timestamp };
  _buffer.push(entry);
  if (_buffer.length > LOG_BUFFER_SIZE) _buffer.shift();

  // Format for Metro bundler console
  const prefix = `${color}${BOLD}${icon} [${level.toUpperCase()}]${RESET}${DIM} ${timestamp}${RESET} ${color}[${tag}]${RESET}`;
  const body   = `${message}`;

  if (level === 'error') {
    console.error(prefix, body, data !== undefined ? data : '');
  } else if (level === 'warn') {
    console.warn(prefix, body, data !== undefined ? data : '');
  } else {
    console.log(prefix, body, data !== undefined ? data : '');
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const logger = {
  debug: (tag: string, message: string, data?: unknown) => _log('debug', tag, message, data),
  info:  (tag: string, message: string, data?: unknown) => _log('info',  tag, message, data),
  warn:  (tag: string, message: string, data?: unknown) => _log('warn',  tag, message, data),
  error: (tag: string, message: string, data?: unknown) => _log('error', tag, message, data),

  /**
   * Returns a copy of the recent log buffer.
   * Useful for attaching logs to bug reports / support tickets.
   */
  getBuffer: (): ReadonlyArray<LogEntry> => [..._buffer],

  /**
   * Clears the in-memory buffer.
   */
  clearBuffer: () => { _buffer.length = 0; },
} as const;

// ─── Redux middleware factory ─────────────────────────────────────────────────

/**
 * Lightweight Redux logger middleware.
 * Logs dispatched action type + state diff (only in __DEV__).
 *
 * Add to store via:
 *   getDefaultMiddleware().concat(reduxLoggerMiddleware)
 */
export function reduxLoggerMiddleware(store: {
  getState: () => unknown;
}) {
  return (next: (action: unknown) => unknown) => (action: unknown) => {
    if (!__DEV__) return next(action);

    const typedAction = action as { type?: string };
    logger.debug('redux', `→ ${typedAction.type ?? 'unknown'}`, {
      prevState: store.getState(),
    });
    const result = next(action);
    logger.debug('redux', `✓ ${typedAction.type ?? 'unknown'}`, {
      nextState: store.getState(),
    });
    return result;
  };
}
