import { supabase } from '../lib/supabase';
import type { Session } from '../data/types';
import { translateError, type RpcResult } from './_shared';

// ─── DB row type (v_sessions_detail view) ─────────────────────────────────
export interface DbSession {
  id: string;
  name: string;
  type: string;
  trainer_id: string;
  trainer_name: string;
  branch_id: string;
  branch_name: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  enrolled: number;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  notes: string | null;
}

// ─── Mapper ───────────────────────────────────────────────────────────────
export function mapSession(row: DbSession): Session {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    trainerId: row.trainer_id,
    trainerName: row.trainer_name,
    date: row.date,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    branch: row.branch_name,
    capacity: row.capacity,
    enrolled: row.enrolled,
    status: row.status,
    level: row.level,
    notes: row.notes ?? '',
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────
export async function fetchSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('v_sessions_detail')
    .select('*')
    .order('date')
    .order('start_time');
  if (error) throw new Error(`Sessions: ${error.message}`);
  return (data as DbSession[]).map(mapSession);
}

// ─── Cancel ───────────────────────────────────────────────────────────────
export async function rpcCancelSession(sessionId: string): Promise<RpcResult> {
  const { error } = await supabase.rpc('cancel_session', { p_session_id: sessionId });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

// ─── Insert (admin) via admin_insert_session RPC ─────────────────────────
export interface NewSessionInput {
  name: string;
  type: string;
  trainer_id: string;
  branch_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  capacity: number;
  level: 'all' | 'beginner' | 'intermediate' | 'advanced';
  notes?: string;
}

export async function insertSession(input: NewSessionInput): Promise<RpcResult> {
  const { error } = await supabase.rpc('admin_insert_session', {
    p_name:       input.name,
    p_type:       input.type,
    p_trainer_id: input.trainer_id,
    p_branch_id:  input.branch_id,
    p_date:       input.date,
    p_start_time: input.start_time,
    p_end_time:   input.end_time,
    p_capacity:   input.capacity,
    p_level:      input.level,
    p_notes:      input.notes ?? null,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

// ─── Update session fields (admin) via admin_update_session RPC ──────────
export async function updateSessionFields(
  id: string,
  fields: Partial<{
    name: string;
    type: string;
    trainer_id: string;
    branch_id: string;
    date: string;
    start_time: string;
    end_time: string;
    capacity: number;
    level: string;
    notes: string;
    status: string;
  }>,
): Promise<void> {
  const { error } = await supabase.rpc('admin_update_session', {
    p_session_id: id,
    p_name:       fields.name       ?? null,
    p_type:       fields.type       ?? null,
    p_trainer_id: fields.trainer_id ?? null,
    p_branch_id:  fields.branch_id  ?? null,
    p_date:       fields.date       ?? null,
    p_start_time: fields.start_time ?? null,
    p_end_time:   fields.end_time   ?? null,
    p_capacity:   fields.capacity   ?? null,
    p_level:      fields.level      ?? null,
    p_notes:      fields.notes      ?? null,
    p_status:     fields.status     ?? null,
  });
  if (error) throw new Error(error.message);
}
