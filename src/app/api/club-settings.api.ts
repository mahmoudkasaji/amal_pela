import { supabase } from '../lib/supabase';
import { translateError, type RpcResult } from './_shared';

export interface ClubSettings {
  club_name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  cancellation_hours: number;
  cancellation_message: string | null;
}

export async function fetchClubSettings(): Promise<ClubSettings | null> {
  const { data, error } = await supabase
    .from('club_settings')
    .select('club_name, email, phone, website, cancellation_hours, cancellation_message')
    .eq('id', 1)
    .maybeSingle();
  if (error) return null;
  return data as ClubSettings | null;
}

export async function updateClubSettings(patch: Partial<ClubSettings>): Promise<RpcResult> {
  const { error } = await supabase.rpc('update_club_settings', { p_patch: patch });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}
