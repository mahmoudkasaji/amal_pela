/**
 * Centralized logging wrapper.
 *
 * - In development: writes to the browser console.
 * - In production: errors go to `console.error`; info/debug are silent.
 * - Ready to be wired to Sentry or similar monitoring later via `setErrorReporter`.
 *
 * Usage:
 *   log.info('User logged in', { userId });
 *   log.warn('Slow query', { ms });
 *   log.error('Booking failed', err, { sessionId });
 */

const isProd = import.meta.env.PROD;

type ErrorReporter = (error: unknown, context?: Record<string, unknown>) => void;

let errorReporter: ErrorReporter | null = null;

/** Register a production error reporter (e.g., Sentry). */
export function setErrorReporter(fn: ErrorReporter | null): void {
  errorReporter = fn;
}

interface Logger {
  debug: (msg: string, ctx?: Record<string, unknown>) => void;
  info: (msg: string, ctx?: Record<string, unknown>) => void;
  warn: (msg: string, ctx?: Record<string, unknown>) => void;
  error: (msg: string, error?: unknown, ctx?: Record<string, unknown>) => void;
}

export const log: Logger = {
  debug: (msg, ctx) => {
    if (!isProd) {
      // eslint-disable-next-line no-console
      console.debug('[debug]', msg, ctx ?? '');
    }
  },

  info: (msg, ctx) => {
    if (!isProd) {
      // eslint-disable-next-line no-console
      console.info('[info]', msg, ctx ?? '');
    }
  },

  warn: (msg, ctx) => {
    // eslint-disable-next-line no-console
    console.warn('[warn]', msg, ctx ?? '');
  },

  error: (msg, error, ctx) => {
    // eslint-disable-next-line no-console
    console.error('[error]', msg, error ?? '', ctx ?? '');
    if (errorReporter && error) {
      try {
        errorReporter(error, { message: msg, ...ctx });
      } catch {
        // reporter must never throw
      }
    }
  },
};
