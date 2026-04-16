import { supabase } from '../lib/supabase';
import type { Trainer } from '../data/types';
import { translateError, type RpcResult } from './_shared';
import { fetchBranches } from './branches.api';

// ─── DB row type (trainers + profiles join) ───────────────────────────────
export interface DbTrainer {
  id: string;
  specialty: string | null;
  branch_id: string | null;
  join_date: string;
  // from profiles via JOIN
  name: string;
  email: string;
  phone: string | null;
  username: string | null;
  status: 'active' | 'suspended' | 'inactive';
}

// ─── Mapper ───────────────────────────────────────────────────────────────
export function mapTrainer(row: DbTrainer, branchName: string | null): Trainer {
  return {
    id: row.id,
    name: row.name,
    username: row.username ?? '',
    email: row.email,
    phone: row.phone ?? '',
    specialty: row.specialty ?? '',
    branch: branchName ?? '',
    // Phase 2 fix: pass through, previously collapsed suspended → active
    status: row.status,
    joinDate: row.join_date,
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────
export async function fetchTrainers(branches?: Map<string, string>): Promise<Trainer[]> {
  const branchMap = branches ?? (await fetchBranches());

  const { data, error } = await supabase
    .from('trainers')
    .select('id, specialty, branch_id, join_date, profiles!inner(name, email, phone, username, status)');
  if (error) throw new Error(`Trainers: ${error.message}`);

  type Row = {
    id: string;
    specialty: string | null;
    branch_id: string | null;
    join_date: string;
    profiles:
      | { name: string; email: string; phone: string | null; username: string | null; status: 'active' | 'suspended' | 'inactive' }
      | { name: string; email: string; phone: string | null; username: string | null; status: 'active' | 'suspended' | 'inactive' }[];
  };

  return ((data ?? []) as Row[]).map((r) => {
    // Supabase types nested relation as array even for 1-to-1 — normalize
    const prof = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return mapTrainer(
      {
        id: r.id,
        specialty: r.specialty,
        branch_id: r.branch_id,
        join_date: r.join_date,
        name: prof.name,
        email: prof.email,
        phone: prof.phone,
        username: prof.username,
        status: prof.status,
      },
      branchMap.get(r.branch_id ?? '') ?? null,
    );
  });
}

// ─── Admin create ─────────────────────────────────────────────────────────
export interface NewTrainerInput {
  name: string;
  username: string;
  password: string;
  phone?: string;
  email?: string;
  specialty?: string;
  branch_id?: string;
}

export async function rpcAdminCreateTrainer(input: NewTrainerInput): Promise<RpcResult<string>> {
  const { data, error } = await supabase.rpc('admin_create_trainer', {
    p_name: input.name,
    p_username: input.username,
    p_password: input.password,
    p_phone: input.phone ?? null,
    p_email: input.email || null,
    p_specialty: input.specialty ?? null,
    p_branch_id: input.branch_id || null,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true, data: data as string };
}

// ─── Admin update ─────────────────────────────────────────────────────────
export interface UpdateTrainerInput {
  name?: string;
  email?: string;
  phone?: string;
  status?: 'active' | 'suspended' | 'inactive';
  specialty?: string;
  branch_id?: string;
}

export async function rpcAdminUpdateTrainer(trainerId: string, patch: UpdateTrainerInput): Promise<RpcResult> {
  const { error } = await supabase.rpc('admin_update_trainer', {
    p_trainer_id: trainerId,
    p_name: patch.name ?? null,
    p_email: patch.email ?? null,
    p_phone: patch.phone ?? null,
    p_status: patch.status ?? null,
    p_specialty: patch.specialty ?? null,
    p_branch_id: patch.branch_id ?? null,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

// ─── Toggle status ────────────────────────────────────────────────────────
export async function rpcToggleTrainerStatus(trainerId: string): Promise<RpcResult> {
  const { error } = await supabase.rpc('toggle_trainer_status', { p_trainer_id: trainerId });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

// ─── Trainer profile direct update (specialty/branch_id) ──────────────────
export async function updateTrainerProfile(
  trainerId: string,
  patch: { specialty?: string; branch_id?: string | null },
): Promise<RpcResult> {
  const { error } = await supabase.from('trainers').update(patch).eq('id', trainerId);
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}
