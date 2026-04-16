/**
 * API layer — استعلامات القراءة لكل كيان.
 * كل دالة تُعيد البيانات بصيغة متوافقة مع types.ts (snake_case → camelCase عند الحاجة).
 */
import { supabase } from '../lib/supabase';
import type {
  Trainee, Trainer, Package, Session, Booking, LedgerEntry, Subscription,
} from '../data/types';

// ─── Row types (تعكس أعمدة DB snake_case) ───────────────────────────────────
interface DbPackage {
  id: string; name: string; description: string | null;
  sessions: number; duration_days: number; price: number;
  cancellation_hours: number; daily_limit: number;
  session_types: string[]; level: 'all'|'beginner'|'intermediate'|'advanced';
  renewable: boolean; is_active: boolean;
}

interface DbSubscription {
  id: string; trainee_id: string; package_id: string;
  total_sessions: number; used_sessions: number;
  start_date: string; end_date: string;
  status: 'active'|'expired'|'frozen';
}

interface DbTraineeView {
  id: string; name: string; email: string; phone: string | null;
  username: string | null; account_status: 'active'|'suspended'|'inactive';
  gender: 'male'|'female'|null; birth_date: string | null;
  level: 'beginner'|'intermediate'|'advanced';
  branch_id: string | null;
  notes: string | null; join_date: string;
  subscription_id: string | null;
  package_id: string | null; package_name: string | null;
  total_sessions: number | null; used_sessions: number | null;
  remaining_sessions: number | null;
  start_date: string | null; end_date: string | null;
  subscription_status: 'active'|'expired'|'frozen'|null;
}

interface DbSession {
  id: string; name: string; type: string;
  trainer_id: string; trainer_name: string;
  branch_id: string; branch_name: string;
  date: string; start_time: string; end_time: string;
  capacity: number; enrolled: number;
  status: 'open'|'full'|'cancelled'|'completed';
  level: 'beginner'|'intermediate'|'advanced'|'all';
  notes: string | null;
}

interface DbBooking {
  id: string; status: Booking['status']; session_deducted: boolean;
  created_at: string; cancelled_at: string | null; attended_marked_at: string | null;
  waitlist_position: number | null;
  trainee_id: string; trainee_name: string;
  session_id: string; session_name: string;
  date: string; time: string;
  trainer_id: string; trainer_name: string;
  branch_id: string; branch_name: string;
}

interface DbLedger {
  id: string; trainee_id: string; subscription_id: string | null;
  entry_date: string; type: 'credit'|'debit';
  amount: number; reason: string; balance_after: number;
  source_booking_id: string | null;
}

interface DbTrainer {
  id: string;
  specialty: string | null;
  branch_id: string | null;
  join_date: string;
  // من profiles عبر JOIN
  name: string;
  email: string;
  phone: string | null;
  username: string | null;
  status: 'active'|'suspended'|'inactive';
}

// ─── Mappers (DB → UI types) ────────────────────────────────────────────────

function mapTrainee(row: DbTraineeView, branchName: string | null): Trainee {
  const sub: Subscription | undefined = row.subscription_id && row.package_id && row.package_name && row.subscription_status && row.start_date && row.end_date ? {
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
  } : undefined;

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
    status: row.account_status === 'inactive' ? 'suspended' : row.account_status,
    notes: row.notes ?? '',
    joinDate: row.join_date,
    subscription: sub,
  };
}

function mapPackage(row: DbPackage): Package {
  return {
    id: row.id,
    name: row.name,
    sessions: row.sessions,
    durationDays: row.duration_days,
    price: Number(row.price),
    cancellationHours: row.cancellation_hours,
    sessionTypes: row.session_types,
    dailyLimit: row.daily_limit,
    renewable: row.renewable,
    description: row.description ?? '',
    level: row.level,
    isActive: row.is_active,
  };
}

function mapSession(row: DbSession): Session {
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

function mapBooking(row: DbBooking): Booking {
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

function mapLedger(row: DbLedger): LedgerEntry {
  return {
    id: row.id,
    traineeId: row.trainee_id,
    date: row.entry_date,
    type: row.type,
    amount: row.amount,
    reason: row.reason,
    balance: row.balance_after,
  };
}

function mapTrainer(row: DbTrainer, branchName: string | null): Trainer {
  return {
    id: row.id,
    name: row.name,
    username: row.username ?? '',
    email: row.email,
    phone: row.phone ?? '',
    specialty: row.specialty ?? '',
    branch: branchName ?? '',
    status: row.status === 'inactive' ? 'inactive' : 'active',
    joinDate: row.join_date,
  };
}

// ─── Queries ────────────────────────────────────────────────────────────────

export async function fetchBranches(): Promise<Map<string, string>> {
  const { data, error } = await supabase.from('branches').select('id, name');
  if (error) throw new Error(`Branches: ${error.message}`);
  return new Map((data ?? []).map(b => [b.id, b.name]));
}

export async function fetchTrainees(branches?: Map<string, string>): Promise<Trainee[]> {
  const branchMap = branches ?? await fetchBranches();
  const { data, error } = await supabase
    .from('v_trainees_with_subscription')
    .select('*');
  if (error) throw new Error(`Trainees: ${error.message}`);
  return (data as DbTraineeView[]).map(r => mapTrainee(r, branchMap.get(r.branch_id ?? '') ?? null));
}

export async function fetchTrainers(branches?: Map<string, string>): Promise<Trainer[]> {
  const branchMap = branches ?? await fetchBranches();
  // JOIN profiles + trainers
  const { data, error } = await supabase
    .from('trainers')
    .select('id, specialty, branch_id, join_date, profiles!inner(name, email, phone, username, status)');
  if (error) throw new Error(`Trainers: ${error.message}`);

  type Row = {
    id: string; specialty: string | null; branch_id: string | null; join_date: string;
    profiles: { name: string; email: string; phone: string | null; username: string | null; status: 'active'|'suspended'|'inactive' }
            | { name: string; email: string; phone: string | null; username: string | null; status: 'active'|'suspended'|'inactive' }[];
  };

  return ((data ?? []) as Row[]).map(r => {
    // Supabase types nested relation as array حتى في علاقات 1-to-1؛ نطبّعه
    const prof = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return mapTrainer({
      id: r.id,
      specialty: r.specialty,
      branch_id: r.branch_id,
      join_date: r.join_date,
      name: prof.name,
      email: prof.email,
      phone: prof.phone,
      username: prof.username,
      status: prof.status,
    }, branchMap.get(r.branch_id ?? '') ?? null);
  });
}

export async function fetchPackages(): Promise<Package[]> {
  const { data, error } = await supabase.from('packages').select('*').order('price');
  if (error) throw new Error(`Packages: ${error.message}`);
  return (data as DbPackage[]).map(mapPackage);
}

export async function fetchSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('v_sessions_detail')
    .select('*')
    .order('date')
    .order('start_time');
  if (error) throw new Error(`Sessions: ${error.message}`);
  return (data as DbSession[]).map(mapSession);
}

export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('v_bookings_detail')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw new Error(`Bookings: ${error.message}`);
  return (data as DbBooking[]).map(mapBooking);
}

export async function updateSessionFields(id: string, fields: Partial<{
  name: string; type: string; trainer_id: string; branch_id: string;
  date: string; start_time: string; end_time: string;
  capacity: number; level: string; notes: string; status: string;
}>) {
  const { error } = await supabase.from('sessions').update(fields).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchLedger(): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Ledger: ${error.message}`);
  return (data as DbLedger[]).map(mapLedger);
}
