import { supabase } from '../lib/supabase';
import { translateError, type RpcResult } from './_shared';

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
}

/** Returns a Map<id, name> — used by trainee/trainer mappers. */
export async function fetchBranches(): Promise<Map<string, string>> {
  const { data, error } = await supabase.from('branches').select('id, name');
  if (error) throw new Error(`Branches: ${error.message}`);
  return new Map((data ?? []).map((b) => [b.id, b.name]));
}

/** Returns full Branch[] — used by Settings page for CRUD. */
export async function fetchBranchesList(): Promise<Branch[]> {
  const { data, error } = await supabase.from('branches').select('*').order('name');
  if (error) return [];
  return (data ?? []) as Branch[];
}

export async function insertBranch(name: string, address?: string, phone?: string): Promise<RpcResult> {
  const { error } = await supabase.from('branches').insert({
    name,
    address: address ?? null,
    phone: phone ?? null,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export async function deleteBranch(id: string): Promise<RpcResult> {
  const { error } = await supabase.from('branches').delete().eq('id', id);
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}
