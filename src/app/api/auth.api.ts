import { supabase } from '../lib/supabase';

/**
 * Resolves a username to its associated email (for login).
 * Returns a fake "noreply@invalid.local" email if username does not exist,
 * to prevent user enumeration.
 */
export async function resolveLoginEmail(username: string): Promise<string | null> {
  const { data } = await supabase.rpc('resolve_login_email', { p_username: username });
  return typeof data === 'string' ? data : null;
}
