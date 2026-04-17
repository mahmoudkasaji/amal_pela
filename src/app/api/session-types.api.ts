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
  const { error } = await supabase.rpc('admin_insert_session_type', {
    p_name: name,
    p_icon: icon ?? null,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export async function deleteSessionType(id: string): Promise<RpcResult> {
  const { error } = await supabase.rpc('admin_delete_session_type', { p_type_id: id });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}
