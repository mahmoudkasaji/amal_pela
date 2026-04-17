import { supabase } from '../lib/supabase';
import type { Trainee, Subscription } from '../data/types';
import { translateError, type RpcResult } from './_shared';
import { fetchBranches } from './branches.api';

// ─── DB row type (v_trainees_with_subscription view) ──────────────────────
export interface DbTraineeView {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  username: string | null;
  account_status: 'active' | 'suspended' | 'inactive';
  gender: 'male' | 'female' | null;
  birth_date: string | null;
  level: 'beginner' | 'intermediate' | 'advanced';
  branch_id: string | null;
  notes: string | null;
  join_date: string;
  subscription_id: string | null;
  package_id: string | null;
  package_name: string | null;
  total_sessions: number | null;
  used_sessions: number | null;
  remaining_sessions: number | null;
  start_date: string | null;
  end_date: string | null;
  subscription_status: 'active' | 'expired' | 'frozen' | null;
}

// ─── Mapper ───────────────────────────────────────────────────────────────
export function mapTrainee(row: DbTraineeView, branchName: string | null): Trainee {
  const sub: Subscription | undefined =
    row.subscription_id && row.package_id && row.package_name && row.subscription_status && row.start_date && row.end_date
      ? {
          id: row.subscription_id,
          traineeId: row.id,
          packageId: row.package_id,
          packageName: row.package_name,
          totalSessions: row.total_sessions ?? 0,
          usedSessions: row.used_sessions ?? 0,
          startDate: row.start_date,
          endDate: row.end_date,
          status: row.subscription_status,
          cancellationHours: 3,
        }
      : undefined;

  return {
    id: row.id,
    name: row.name,
    username: row.username ?? '',
    email: row.email,
    phone: row.phone ?? '',
    gender: row.gender ?? 'female',
    birthDate: row.birth_date ?? '',
    branch: branchName ?? '',
    level: row.level,
    // تمرير الحالة كما هي (active | suspended | inactive) — Phase 2 fix
    status: row.account_status,
    notes: row.notes ?? '',
    joinDate: row.join_date,
    subscription: sub,
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────
export async function fetchTrainees(branches?: Map<string, string>): Promise<Trainee[]> {
  const branchMap = branches ?? (await fetchBranches());
  const { data, error } = await supabase.from('v_trainees_with_subscription').select('*');
  if (error) throw new Error(`Trainees: ${error.message}`);
  return (data as DbTraineeView[]).map((r) => mapTrainee(r, branchMap.get(r.branch_id ?? '') ?? null));
}

// ─── Admin create ─────────────────────────────────────────────────────────
export interface NewTraineeInput {
  name: string;
  username: string;
  password: string;
  phone?: string;
  email?: string; // optional — generated from username if empty
  gender?: 'male' | 'female';
  branch_id?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
}

export async function rpcAdminCreateTrainee(input: NewTraineeInput): Promise<RpcResult<string>> {
  const { data, error } = await supabase.rpc('admin_create_trainee', {
    p_name: input.name,
    p_username: input.username,
    p_password: input.password,
    p_phone: input.phone ?? null,
    p_email: input.email || null,
    p_gender: input.gender ?? 'female',
    p_branch_id: input.branch_id || null,
    p_level: input.level ?? 'beginner',
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true, data: data as string };
}

// ─── Admin update ─────────────────────────────────────────────────────────
export interface UpdateTraineeInput {
  name?: string;
  email?: string;
  phone?: string;
  status?: 'active' | 'suspended' | 'inactive';
  gender?: 'male' | 'female';
  birth_date?: string;
  branch_id?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  notes?: string;
}

export async function rpcAdminUpdateTrainee(traineeId: string, patch: UpdateTraineeInput): Promise<RpcResult> {
  const { error } = await supabase.rpc('admin_update_trainee', {
    p_trainee_id: traineeId,
    p_name: patch.name ?? null,
    p_email: patch.email ?? null,
    p_phone: patch.phone ?? null,
    p_status: patch.status ?? null,
    p_gender: patch.gender ?? null,
    p_birth_date: patch.birth_date ?? null,
    p_branch_id: patch.branch_id ?? null,
    p_level: patch.level ?? null,
    p_notes: patch.notes ?? null,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

// ─── Trainee lifecycle RPCs ───────────────────────────────────────────────
export async function rpcToggleTraineeStatus(traineeId: string): Promise<RpcResult> {
  const { error } = await supabase.rpc('toggle_trainee_status', { p_trainee_id: traineeId });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export async function rpcAssignPackage(traineeId: string, packageId: string, startDate: string): Promise<RpcResult> {
  const { error } = await supabase.rpc('assign_package', {
    p_trainee_id: traineeId,
    p_package_id: packageId,
    p_start_date: startDate,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export async function rpcFreezeSubscription(traineeId: string): Promise<RpcResult> {
  const { error } = await supabase.rpc('freeze_subscription', { p_trainee_id: traineeId });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export async function rpcUnfreezeSubscription(traineeId: string): Promise<RpcResult> {
  const { error } = await supabase.rpc('unfreeze_subscription', { p_trainee_id: traineeId });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export async function rpcExtendSubscription(traineeId: string, days: number): Promise<RpcResult> {
  const { error } = await supabase.rpc('extend_subscription', { p_trainee_id: traineeId, p_days: days });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export async function rpcAdjustBalance(traineeId: string, delta: number, reason: string): Promise<RpcResult> {
  const { error } = await supabase.rpc('adjust_balance', {
    p_trainee_id: traineeId,
    p_delta: delta,
    p_reason: reason,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

// ─── Self profile update (used by any authenticated user) ─────────────────
// عبر RPC update_profile_self — لا كتابة مباشرة على profiles من الواجهة
export async function updateProfileSelf(patch: {
  name?: string;
  phone?: string;
  email?: string;
  prefs?: Record<string, unknown>;
}): Promise<RpcResult> {
  const { error } = await supabase.rpc('update_profile_self', {
    p_name:  patch.name  ?? null,
    p_phone: patch.phone ?? null,
    p_email: patch.email ?? null,
    p_prefs: patch.prefs ?? null,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}
