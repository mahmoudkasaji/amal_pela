import { supabase } from '../lib/supabase';
import type { Booking } from '../data/types';
import { translateError, type RpcResult } from './_shared';

// ─── DB row type (v_bookings_detail view) ─────────────────────────────────
export interface DbBooking {
  id: string;
  status: Booking['status'];
  session_deducted: boolean;
  created_at: string;
  cancelled_at: string | null;
  attended_marked_at: string | null;
  waitlist_position: number | null;
  trainee_id: string;
  trainee_name: string;
  session_id: string;
  session_name: string;
  date: string;
  time: string;
  trainer_id: string;
  trainer_name: string;
  branch_id: string;
  branch_name: string;
}

// ─── Mapper ───────────────────────────────────────────────────────────────
export function mapBooking(row: DbBooking): Booking {
  return {
    id: row.id,
    traineeId: row.trainee_id,
    traineeName: row.trainee_name,
    sessionId: row.session_id,
    sessionName: row.session_name,
    date: row.date,
    time: row.time.slice(0, 5),
    trainerName: row.trainer_name,
    branch: row.branch_name,
    status: row.status,
    sessionDeducted: row.session_deducted,
    createdAt: row.created_at.slice(0, 10),
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────
export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('v_bookings_detail')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw new Error(`Bookings: ${error.message}`);
  return (data as DbBooking[]).map(mapBooking);
}

// ─── Trainee actions ──────────────────────────────────────────────────────
export async function rpcBookSession(sessionId: string): Promise<RpcResult<{ id: string }>> {
  const { data, error } = await supabase.rpc('book_session', { p_session_id: sessionId });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true, data };
}

export async function rpcCancelBooking(
  bookingId: string,
  forceRefund = false,
): Promise<RpcResult<{ id: string; status: string }>> {
  const { data, error } = await supabase.rpc('cancel_booking', {
    p_booking_id: bookingId,
    p_force_refund: forceRefund,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true, data };
}

// ─── Trainer actions ──────────────────────────────────────────────────────
export async function rpcMarkAttendance(
  bookingId: string,
  state: 'attended' | 'absent' | 'late',
): Promise<RpcResult> {
  const { error } = await supabase.rpc('mark_attendance', {
    p_booking_id: bookingId,
    p_state: state,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

// ─── Admin: set booking status (includes reverting to 'confirmed') ────────
export async function rpcAdminSetBookingStatus(
  bookingId: string,
  status: 'confirmed' | 'attended' | 'absent' | 'late',
): Promise<RpcResult> {
  const { error } = await supabase.rpc('admin_set_booking_status', {
    p_booking_id: bookingId,
    p_status: status,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}
