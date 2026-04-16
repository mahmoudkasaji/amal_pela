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

// ─── Insert (admin) ───────────────────────────────────────────────────────
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

// ─── Update session fields (admin) ────────────────────────────────────────
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
  const { error } = await supabase.from('sessions').update(fields).eq('id', id);
  if (error) throw new Error(error.message);
}
