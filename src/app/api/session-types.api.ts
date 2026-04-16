import { supabase } from '../lib/supabase';
import { translateError, type RpcResult } from './_shared';

export interface SessionType {
  id: string;
  name: string;
  icon: string | null;
  is_active: boolean;
}

export async function fetchSessionTypesList(): Promise<SessionType[]> {
  const { data, error } = await supabase.from('session_types').select('*').order('name');
  if (error) return [];
  return (data ?? []) as SessionType[];
}

export async function insertSessionType(name: string, icon?: string): Promise<RpcResult> {
  const { error } = await supabase.from('session_types').insert({ name, icon: icon ?? null });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export async function deleteSessionType(id: string): Promise<RpcResult> {
  const { error } = await supabase.from('session_types').delete().eq('id', id);
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}
