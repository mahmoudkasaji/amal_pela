import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Indicates whether the Supabase environment is properly configured.
 * Consumers (e.g., ErrorBoundary / AuthContext) can use this to render
 * a friendly setup screen instead of crashing the entire app.
 */
export const isSupabaseConfigured: boolean = Boolean(url && anonKey);

function createMissingEnvClient(): SupabaseClient {
  // Return a proxy that throws a descriptive error on any access.
  // This prevents the app from crashing on import and allows a UI-level
  // handler to show a helpful message to the user.
  const handler: ProxyHandler<object> = {
    get() {
      throw new Error(
        'Supabase environment variables are missing. ' +
        'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file ' +
        '(copy .env.local.example if you need a template).'
      );
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
  : createMissingEnvClient();

if (!isSupabaseConfigured) {
  // Log a clear warning during development instead of throwing at import time
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'The app will render a configuration error screen instead of crashing.'
  );
}
