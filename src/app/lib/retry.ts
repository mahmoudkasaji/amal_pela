/**
 * Network retry helper with exponential backoff.
 *
 * Usage:
 *   const data = await withRetry(() => fetchTrainees());
 *   const data = await withRetry(() => fetchTrainees(), { retries: 5, baseDelayMs: 500 });
 */

export interface RetryOptions {
  /** Number of additional attempts after the first. Default: 2 (total 3 tries). */
  retries?: number;
  /** Initial backoff delay in ms. Default: 500. */
  baseDelayMs?: number;
  /** Maximum backoff cap in ms. Default: 4000. */
  maxDelayMs?: number;
  /** Called before each retry with (attempt, error). */
  onRetry?: (attempt: number, error: unknown) => void;
  /** Return true to stop retrying (permanent failure). */
  shouldAbort?: (error: unknown) => boolean;
}

const DEFAULTS: Required<Omit<RetryOptions, 'onRetry' | 'shouldAbort'>> = {
  retries: 2,
  baseDelayMs: 500,
  maxDelayMs: 4000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs `fn` with up to `retries` additional attempts on failure.
 * Backoff is exponential (2^attempt * baseDelay), capped at maxDelayMs,
 * with full jitter to prevent thundering herd.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { retries, baseDelayMs, maxDelayMs } = { ...DEFAULTS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (options.shouldAbort?.(err)) break;
      if (attempt === retries) break;

      const exp = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
      const jittered = Math.floor(Math.random() * exp);
      options.onRetry?.(attempt + 1, err);
      await sleep(jittered);
    }
  }

  throw lastError;
}

/** Convenience: aborts retry on 4xx Supabase errors (client errors are rarely transient). */
export function isClientError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: string }).code;
  if (typeof code === 'string') {
    // Postgres client-error codes start with 23 (integrity), 42 (syntax/perms), 22 (data exception)
    if (code.startsWith('23') || code.startsWith('42') || code.startsWith('22')) return true;
    // P0001 is raise exception from our RPCs — intentional, don't retry
    if (code === 'P0001') return true;
  }
  return false;
}
