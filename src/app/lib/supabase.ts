import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Indicates whether the Supabase environment is properly configured.
 *
 * **App.tsx MUST check this first and render <ConfigError /> if false.**
 * The `supabase` export below is a safe no-op stub when not configured,
 * specifically so that `useEffect`s in auth/context don't throw (which
 * React Error Boundaries cannot catch) — but any real use at runtime
 * would return empty errors silently. Always gate with `isSupabaseConfigured`.
 */
export const isSupabaseConfigured: boolean = Boolean(url && anonKey);

/**
 * Safe no-op Supabase client used when env vars are missing.
 * All chained methods return a proxy that can be called again (for
 * `supabase.from('x').select().eq().limit().maybeSingle()` style chains)
 * and all terminal methods resolve to `{ data: null, error: ... }`.
 *
 * This prevents `TypeError: Cannot read properties of undefined` and
 * unhandled throws inside useEffect that cause silent white screens.
 */
function createNoopClient(): SupabaseClient {
  const NOT_CONFIGURED = {
    message: 'Supabase غير مُكوَّن — متغيرات البيئة مفقودة',
    name: 'SupabaseNotConfigured',
  } as const;

  // Async result returned from .insert/.select/.update/etc
  const resolvedResult = () => Promise.resolve({ data: null, error: NOT_CONFIGURED, count: 0, status: 0, statusText: '' });

  // Auth API needs specific shapes to avoid breaking AuthContext
  const auth = {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser:    () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { session: null, user: null }, error: NOT_CONFIGURED }),
    signOut:    () => Promise.resolve({ error: null }),
    updateUser: () => Promise.resolve({ data: { user: null }, error: NOT_CONFIGURED }),
    resetPasswordForEmail: () => Promise.resolve({ data: null, error: NOT_CONFIGURED }),
    onAuthStateChange: () => ({
      data: { subscription: { id: 'noop', callback: () => {}, unsubscribe: () => {} } },
    }),
  };

  // Chainable query builder — every method returns the same proxy OR a promise
  const queryTarget: unknown = function noopFn() { return queryProxy; };
  const queryHandler: ProxyHandler<any> = {
    get(_t, prop) {
      // Terminal methods that should resolve
      const TERMINAL = ['then', 'maybeSingle', 'single', 'csv'];
      if (TERMINAL.includes(String(prop))) {
        // .then → promise-like for await
        if (prop === 'then') {
          return resolvedResult().then.bind(resolvedResult());
        }
        return resolvedResult;
      }
      // Otherwise return the proxy itself so chaining works
      return queryProxy;
    },
    apply() { return queryProxy; },
  };
  const queryProxy: any = new Proxy(queryTarget as object, queryHandler);

  // Top-level client proxy
  const handler: ProxyHandler<any> = {
    get(_t, prop) {
      if (prop === 'auth') return auth;
      if (prop === 'from') return () => queryProxy;
      if (prop === 'rpc')  return () => resolvedResult();
      if (prop === 'storage') return new Proxy({}, handler);
      return () => resolvedResult();
    },
  };

  return new Proxy({}, handler) as SupabaseClient;
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createNoopClient();

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'App.tsx should render <ConfigError /> instead of mounting AuthProvider.'
  );
}
