/**
 * RPC wrappers — كل دالة Supabase RPC يُعاد تصديرها بصيغة آمنة تُعيد
 * { ok, reason?, data? } ليسهل استخدامها من UI و Store.
 *
 * أي خطأ Postgres يُرفع بـ errcode=P0001 يحمل رسالة عربية قابلة للعرض مباشرة.
 */
import { supabase } from '../lib/supabase';

export interface RpcResult<T = unknown> {
  ok: boolean;
  reason?: string;
  data?: T;
}

function translateError(msg: string | undefined): string {
  if (!msg) return 'حدث خطأ غير متوقع';
  // رسائل العربية من الـ RPCs تصل كما هي
  return msg;
}

// ─── Trainee actions ────────────────────────────────────────────────────────

export async function rpcBookSession(sessionId: string): Promise<RpcResult<{ id: string }>> {
  const { data, error } = await supabase.rpc('book_session', { p_session_id: sessionId });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true, data };
}

export async function rpcCancelBooking(
  bookingId: string,
  forceRefund = false
): Promise<RpcResult<{ id: string; status: string }>> {
  const { data, error } = await supabase.rpc('cancel_booking', {
    p_booking_id: bookingId,
    p_force_refund: forceRefund,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true, data };
}

// ─── Trainer actions ────────────────────────────────────────────────────────

export async function rpcMarkAttendance(
  bookingId: string,
  state: 'attended' | 'absent' | 'late'
): Promise<RpcResult> {
  const { error } = await supabase.rpc('mark_attendance', {
    p_booking_id: bookingId,
    p_state: state,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

// ─── Admin actions ──────────────────────────────────────────────────────────

export async function rpcCancelSession(sessionId: string): Promise<RpcResult> {
  const { error } = await supabase.rpc('cancel_session', { p_session_id: sessionId });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export async function rpcAssignPackage(
  traineeId: string, packageId: string, startDate: string
): Promise<RpcResult> {
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
  const { error } = await supabase.rpc('extend_subscription', {
    p_trainee_id: traineeId,
    p_days: days,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export async function rpcAdjustBalance(
  traineeId: string, delta: number, reason: string
): Promise<RpcResult> {
  const { error } = await supabase.rpc('adjust_balance', {
    p_trainee_id: traineeId,
    p_delta: delta,
    p_reason: reason,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export async function rpcToggleTraineeStatus(traineeId: string): Promise<RpcResult> {
  const { error } = await supabase.rpc('toggle_trainee_status', { p_trainee_id: traineeId });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export async function rpcToggleTrainerStatus(trainerId: string): Promise<RpcResult> {
  const { error } = await supabase.rpc('toggle_trainer_status', { p_trainer_id: trainerId });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export async function rpcTogglePackageActive(packageId: string): Promise<RpcResult> {
  const { error } = await supabase.rpc('toggle_package_active', { p_package_id: packageId });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

// ─── Profile updates (direct UPDATE, RLS-protected) ────────────────────────

export async function updateProfileSelf(patch: {
  name?: string; phone?: string; email?: string; prefs?: Record<string, unknown>;
}): Promise<RpcResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'غير مسجّل دخول' };
  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export async function updateTrainerProfile(trainerId: string, patch: {
  specialty?: string; branch_id?: string | null;
}): Promise<RpcResult> {
  const { error } = await supabase.from('trainers').update(patch).eq('id', trainerId);
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export async function updatePackageFields(packageId: string, patch: Record<string, unknown>): Promise<RpcResult> {
  const { error } = await supabase.from('packages').update(patch).eq('id', packageId);
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

// ─── Auth helper ────────────────────────────────────────────────────────────

export async function resolveLoginEmail(username: string): Promise<string | null> {
  const { data } = await supabase.rpc('resolve_login_email', { p_username: username });
  return typeof data === 'string' ? data : null;
}

// ─── Admin create accounts ──────────────────────────────────────────────────

export interface NewTraineeInput {
  name: string;
  username: string;
  password: string;
  phone?: string;
  email?: string;     // اختياري — يُولَّد من username إن لم يُعطَ
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
    p_email: input.email || null,  // فارغ → null → RPC يولّد username@serene.local
    p_gender: input.gender ?? 'female',
    p_branch_id: input.branch_id || null,
    p_level: input.level ?? 'beginner',
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true, data: data as string };
}

export interface NewTrainerInput {
  name: string;
  username: string;
  password: string;
  phone?: string;
  email?: string;     // اختياري
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

// ─── Admin update RPCs (replace direct table writes) ───────────────────────

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

export async function rpcAdminUpdateTrainee(
  traineeId: string,
  patch: UpdateTraineeInput,
): Promise<RpcResult> {
  const { error } = await supabase.rpc('admin_update_trainee', {
    p_trainee_id: traineeId,
    p_name:       patch.name       ?? null,
    p_email:      patch.email      ?? null,
    p_phone:      patch.phone      ?? null,
    p_status:     patch.status     ?? null,
    p_gender:     patch.gender     ?? null,
    p_birth_date: patch.birth_date ?? null,
    p_branch_id:  patch.branch_id  ?? null,
    p_level:      patch.level      ?? null,
    p_notes:      patch.notes      ?? null,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export interface UpdateTrainerInput {
  name?: string;
  email?: string;
  phone?: string;
  status?: 'active' | 'suspended' | 'inactive';
  specialty?: string;
  branch_id?: string;
}

export async function rpcAdminUpdateTrainer(
  trainerId: string,
  patch: UpdateTrainerInput,
): Promise<RpcResult> {
  const { error } = await supabase.rpc('admin_update_trainer', {
    p_trainer_id: trainerId,
    p_name:       patch.name      ?? null,
    p_email:      patch.email     ?? null,
    p_phone:      patch.phone     ?? null,
    p_status:     patch.status    ?? null,
    p_specialty:  patch.specialty ?? null,
    p_branch_id:  patch.branch_id ?? null,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

// ─── Direct INSERT helpers (admin has RLS write permission) ────────────────

export interface NewSessionInput {
  name: string;
  type: string;
  trainer_id: string;
  branch_id: string;
  date: string;        // YYYY-MM-DD
  start_time: string;  // HH:MM
  end_time: string;    // HH:MM
  capacity: number;
  level: 'all' | 'beginner' | 'intermediate' | 'advanced';
  notes?: string;
}

export async function insertSession(input: NewSessionInput): Promise<RpcResult> {
  const { error } = await supabase.from('sessions').insert({
    name: input.name,
    type: input.type,
    trainer_id: input.trainer_id,
    branch_id: input.branch_id,
    date: input.date,
    start_time: input.start_time,
    end_time: input.end_time,
    capacity: input.capacity,
    level: input.level,
    notes: input.notes ?? null,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export interface NewPackageInput {
  name: string;
  description: string;
  sessions: number;
  duration_days: number;
  price: number;
  cancellation_hours: number;
  daily_limit: number;
  session_types: string[];
  level: 'all' | 'beginner' | 'intermediate' | 'advanced';
  renewable: boolean;
}

export async function insertPackage(input: NewPackageInput): Promise<RpcResult> {
  const { error } = await supabase.from('packages').insert({
    ...input,
    is_active: true,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

// ─── Club settings ──────────────────────────────────────────────────────────

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

// ─── Session types + branches (for settings + dropdowns) ───────────────────

export interface Branch { id: string; name: string; address: string | null; phone: string | null; is_active: boolean; }

export async function fetchBranchesList(): Promise<Branch[]> {
  const { data, error } = await supabase.from('branches').select('*').order('name');
  if (error) return [];
  return (data ?? []) as Branch[];
}

export async function insertBranch(name: string, address?: string, phone?: string): Promise<RpcResult> {
  const { error } = await supabase.from('branches').insert({ name, address: address ?? null, phone: phone ?? null });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export async function deleteBranch(id: string): Promise<RpcResult> {
  const { error } = await supabase.from('branches').delete().eq('id', id);
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

export interface SessionType { id: string; name: string; icon: string | null; is_active: boolean; }

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
