/**
 * Store البيانات المركزي — مرتبط بـ Supabase كمصدر حقيقة.
 *
 * - `initialize()` يُحمِّل كل الكيانات بالتوازي (يُستدعى من AuthProvider بعد الدخول)
 * - `reset()` يُفرغ الحالة عند تسجيل الخروج
 * - كل action عمل تجاري يستدعي RPC ثم يُحدِّث الـ store من DB مباشرةً لضمان الاتساق
 *
 * لا persist إلى localStorage: البيانات تأتي من DB عند كل دخول.
 */

import { create } from 'zustand';
import type { Trainee, Trainer, Package, Session, Booking, LedgerEntry } from '../data/types';
import {
  fetchTrainees, fetchTrainers, fetchPackages,
  fetchSessions, fetchBookings, fetchLedger, fetchBranches,
  updateSessionFields,
} from '../api/entities';
import {
  rpcBookSession, rpcCancelBooking, rpcMarkAttendance,
  rpcCancelSession, rpcAssignPackage,
  rpcFreezeSubscription, rpcUnfreezeSubscription,
  rpcExtendSubscription, rpcAdjustBalance,
  rpcToggleTraineeStatus, rpcToggleTrainerStatus, rpcTogglePackageActive,
  rpcAdminCreateTrainee, rpcAdminCreateTrainer,
  insertSession, insertPackage,
  updateProfileSelf, updateTrainerProfile, updatePackageFields,
} from '../api/rpc';
import type { NewTraineeInput, NewTrainerInput, NewSessionInput, NewPackageInput } from '../api/rpc';

// ─── نتائج العمليات ────────────────────────────────────────────────────────
export interface ActionResult {
  ok: boolean;
  reason?: string;
}
export interface BookResult extends ActionResult {
  booking?: Booking;
}
export interface CancelResult extends ActionResult {
  refunded: boolean;
}

// ─── شكل الـ Store ─────────────────────────────────────────────────────────
interface DataState {
  initialized: boolean;
  loading:     boolean;

  trainees: Trainee[];
  trainers: Trainer[];
  packages: Package[];
  sessions: Session[];
  bookings: Booking[];
  ledger:   LedgerEntry[];

  // ─── lifecycle ─────
  initialize: () => Promise<void>;
  refresh:    () => Promise<void>;
  reset:      () => void;

  // ─── partial refresh ─────
  refreshBookings: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  refreshTrainees: () => Promise<void>;
  refreshTrainers: () => Promise<void>;
  refreshPackages: () => Promise<void>;

  // ─── عمليات المتدربة ─────
  bookSession:    (traineeId: string, sessionId: string) => Promise<BookResult>;
  cancelBooking:  (bookingId: string, opts?: { forceRefund?: boolean }) => Promise<CancelResult>;

  // ─── عمليات المدربة ─────
  markAttendance: (bookingId: string, state: 'attended' | 'absent' | 'late') => Promise<ActionResult>;

  // ─── عمليات الإدارة ─────
  cancelSession:        (sessionId: string) => Promise<ActionResult>;
  updateSession:        (sessionId: string, fields: Partial<{
    name: string; type: string; trainer_id: string; branch_id: string;
    date: string; start_time: string; end_time: string;
    capacity: number; level: string; notes: string; status: string;
  }>) => Promise<ActionResult>;
  toggleTraineeStatus:  (traineeId: string) => Promise<ActionResult>;
  assignPackage:        (traineeId: string, packageId: string, startDate: string) => Promise<ActionResult>;
  freezeSubscription:   (traineeId: string) => Promise<ActionResult>;
  unfreezeSubscription: (traineeId: string) => Promise<ActionResult>;
  extendSubscription:   (traineeId: string, days: number) => Promise<ActionResult>;
  adjustBalance:        (traineeId: string, delta: number, reason: string) => Promise<ActionResult>;
  updateTrainee:        (traineeId: string, patch: Partial<Trainee>) => Promise<ActionResult>;

  updateTrainer:        (trainerId: string, patch: Partial<Trainer>) => Promise<ActionResult>;
  toggleTrainerStatus:  (trainerId: string) => Promise<ActionResult>;
  updatePackage:        (packageId: string, patch: Partial<Package>) => Promise<ActionResult>;
  togglePackageActive:  (packageId: string) => Promise<ActionResult>;

  // ─── عمليات إنشاء ─────
  createTrainee: (input: NewTraineeInput) => Promise<ActionResult>;
  createTrainer: (input: NewTrainerInput) => Promise<ActionResult>;
  createSession: (input: NewSessionInput) => Promise<ActionResult>;
  createPackage: (input: NewPackageInput) => Promise<ActionResult>;
}

// ─── Store Factory ────────────────────────────────────────────────────────
export const useDataStore = create<DataState>()((set, get) => ({
  initialized: false,
  loading:     false,

  trainees: [],
  trainers: [],
  packages: [],
  sessions: [],
  bookings: [],
  ledger:   [],

  // ════════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ════════════════════════════════════════════════════════════════════════
  initialize: async () => {
    if (get().initialized) return;
    set({ loading: true });
    try {
      await get().refresh();
      set({ initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    // fetch branches once and share with trainees & trainers to avoid N+1
    const branches = await fetchBranches();

    const results = await Promise.allSettled([
      fetchTrainees(branches),
      fetchTrainers(branches),
      fetchPackages(),
      fetchSessions(),
      fetchBookings(),
      fetchLedger(),
    ]);

    const keys = ['trainees', 'trainers', 'packages', 'sessions', 'bookings', 'ledger'] as const;
    const patch: Record<string, unknown> = {};

    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        patch[keys[i]] = r.value;
      } else {
        console.error(`[Store refresh error: ${keys[i]}]`, r.reason);
      }
    });

    if (Object.keys(patch).length > 0) {
      set(patch as Partial<DataState>);
    }
  },

  reset: () => {
    set({
      initialized: false,
      loading: false,
      trainees: [],
      trainers: [],
      packages: [],
      sessions: [],
      bookings: [],
      ledger: [],
    });
  },

  // ════════════════════════════════════════════════════════════════════════
  // Partial Refresh — تحديث كيان واحد فقط بدل الكل
  // ════════════════════════════════════════════════════════════════════════
  refreshBookings: async () => {
    try { const bookings = await fetchBookings(); set({ bookings }); }
    catch (e) { console.error('[refreshBookings]', e); }
  },
  refreshSessions: async () => {
    try { const sessions = await fetchSessions(); set({ sessions }); }
    catch (e) { console.error('[refreshSessions]', e); }
  },
  refreshTrainees: async () => {
    try { const trainees = await fetchTrainees(); set({ trainees }); }
    catch (e) { console.error('[refreshTrainees]', e); }
  },
  refreshTrainers: async () => {
    try { const trainers = await fetchTrainers(); set({ trainers }); }
    catch (e) { console.error('[refreshTrainers]', e); }
  },
  refreshPackages: async () => {
    try { const packages = await fetchPackages(); set({ packages }); }
    catch (e) { console.error('[refreshPackages]', e); }
  },

  // ════════════════════════════════════════════════════════════════════════
  // عمليات المتدربة
  // ════════════════════════════════════════════════════════════════════════
  bookSession: async (_traineeId, sessionId) => {
    const res = await rpcBookSession(sessionId);
    if (!res.ok) return { ok: false, reason: res.reason };
    // نحدّث من DB بعد العملية لضمان اتساق (session.enrolled، booking)
    await Promise.all([get().refreshBookings(), get().refreshSessions()]);
    return { ok: true };
  },

  cancelBooking: async (bookingId, opts) => {
    const res = await rpcCancelBooking(bookingId, opts?.forceRefund ?? false);
    if (!res.ok) return { ok: false, refunded: false, reason: res.reason };
    await Promise.all([get().refreshBookings(), get().refreshSessions()]);
    // نستنتج refunded من حالة الحجز بعد التحديث
    const booking = get().bookings.find(b => b.id === bookingId);
    return { ok: true, refunded: booking?.status === 'cancelled_with_refund' };
  },

  // ════════════════════════════════════════════════════════════════════════
  // عمليات المدربة
  // ════════════════════════════════════════════════════════════════════════
  markAttendance: async (bookingId, state) => {
    const res = await rpcMarkAttendance(bookingId, state);
    if (!res.ok) return { ok: false, reason: res.reason };
    await Promise.all([get().refreshBookings(), get().refreshSessions()]);
    return { ok: true };
  },

  // ════════════════════════════════════════════════════════════════════════
  // عمليات الإدارة
  // ════════════════════════════════════════════════════════════════════════
  cancelSession: async (sessionId) => {
    const res = await rpcCancelSession(sessionId);
    if (!res.ok) return { ok: false, reason: res.reason };
    await get().refreshSessions();
    return { ok: true };
  },

  updateSession: async (sessionId, fields) => {
    try {
      await updateSessionFields(sessionId, fields);
    } catch (err: any) {
      return { ok: false, reason: err.message ?? 'تعذّر تعديل الجلسة' };
    }
    await get().refreshSessions();
    return { ok: true };
  },

  toggleTraineeStatus: async (traineeId) => {
    const res = await rpcToggleTraineeStatus(traineeId);
    if (!res.ok) return { ok: false, reason: res.reason };
    await get().refreshTrainees();
    return { ok: true };
  },

  assignPackage: async (traineeId, packageId, startDate) => {
    const res = await rpcAssignPackage(traineeId, packageId, startDate);
    if (!res.ok) return { ok: false, reason: res.reason };
    await get().refreshTrainees();
    return { ok: true };
  },

  freezeSubscription: async (traineeId) => {
    const res = await rpcFreezeSubscription(traineeId);
    if (!res.ok) return { ok: false, reason: res.reason };
    await get().refreshTrainees();
    return { ok: true };
  },

  unfreezeSubscription: async (traineeId) => {
    const res = await rpcUnfreezeSubscription(traineeId);
    if (!res.ok) return { ok: false, reason: res.reason };
    await get().refreshTrainees();
    return { ok: true };
  },

  extendSubscription: async (traineeId, days) => {
    const res = await rpcExtendSubscription(traineeId, days);
    if (!res.ok) return { ok: false, reason: res.reason };
    await get().refreshTrainees();
    return { ok: true };
  },

  adjustBalance: async (traineeId, delta, reason) => {
    const res = await rpcAdjustBalance(traineeId, delta, reason);
    if (!res.ok) return { ok: false, reason: res.reason };
    await get().refreshTrainees();
    return { ok: true };
  },

  updateTrainee: async (traineeId, patch) => {
    const { supabase } = await import('../lib/supabase');

    // ── 1) تحديث profiles (name, email, phone, status) ──
    const profilePatch: Record<string, unknown> = {};
    if (patch.name   !== undefined) profilePatch.name   = patch.name;
    if (patch.phone  !== undefined) profilePatch.phone  = patch.phone;
    if (patch.email  !== undefined) profilePatch.email  = patch.email;
    // تمرير status كما هي (active | suspended | inactive) — يدعمها enum في DB
    if (patch.status !== undefined) profilePatch.status  = patch.status;

    if (Object.keys(profilePatch).length > 0) {
      const { error } = await supabase.from('profiles').update(profilePatch).eq('id', traineeId);
      if (error) return { ok: false, reason: error.message };
    }

    // ── 2) تحديث trainees (gender, birth_date, branch_id, level, notes) ──
    const traineePatch: Record<string, unknown> = {};
    if (patch.gender    !== undefined) traineePatch.gender     = patch.gender;
    if (patch.birthDate !== undefined) traineePatch.birth_date = patch.birthDate;
    if (patch.level     !== undefined) traineePatch.level      = patch.level;
    if (patch.notes     !== undefined) traineePatch.notes      = patch.notes;

    // الواجهة تمرر اسم الفرع (branch) وليس branch_id — نبحث عنه
    if (patch.branch !== undefined) {
      const { data: branchRows } = await supabase.from('branches').select('id').eq('name', patch.branch).limit(1);
      if (branchRows && branchRows.length > 0) {
        traineePatch.branch_id = branchRows[0].id;
      }
    }

    if (Object.keys(traineePatch).length > 0) {
      const { error } = await supabase.from('trainees').update(traineePatch).eq('id', traineeId);
      if (error) return { ok: false, reason: error.message };
    }

    await get().refreshTrainees();
    return { ok: true };
  },

  updateTrainer: async (trainerId, patch) => {
    const { supabase } = await import('../lib/supabase');
    // الحقول على profiles (name/email/phone) ⇄ على trainers (specialty/branch)
    const profilePatch: Record<string, unknown> = {};
    if (patch.name  !== undefined) profilePatch.name  = patch.name;
    if (patch.phone !== undefined) profilePatch.phone = patch.phone;
    if (patch.email !== undefined) profilePatch.email = patch.email;

    if (Object.keys(profilePatch).length > 0) {
      const { error } = await supabase.from('profiles').update(profilePatch).eq('id', trainerId);
      if (error) return { ok: false, reason: error.message };
    }

    const trainerPatch: Record<string, unknown> = {};
    if (patch.specialty !== undefined) trainerPatch.specialty = patch.specialty;

    // patch.branch هو اسم الفرع — نبحث عن branch_id
    if (patch.branch !== undefined) {
      const { data: branchRows } = await supabase.from('branches').select('id').eq('name', patch.branch).limit(1);
      if (branchRows && branchRows.length > 0) {
        trainerPatch.branch_id = branchRows[0].id;
      }
    }

    if (Object.keys(trainerPatch).length > 0) {
      const res = await updateTrainerProfile(trainerId, trainerPatch);
      if (!res.ok) return { ok: false, reason: res.reason };
    }
    await get().refreshTrainers();
    return { ok: true };
  },

  toggleTrainerStatus: async (trainerId) => {
    const res = await rpcToggleTrainerStatus(trainerId);
    if (!res.ok) return { ok: false, reason: res.reason };
    await get().refreshTrainers();
    return { ok: true };
  },

  updatePackage: async (packageId, patch) => {
    // ترجمة الحقول من UI camelCase إلى DB snake_case
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined)              dbPatch.name = patch.name;
    if (patch.description !== undefined)       dbPatch.description = patch.description;
    if (patch.sessions !== undefined)          dbPatch.sessions = patch.sessions;
    if (patch.durationDays !== undefined)      dbPatch.duration_days = patch.durationDays;
    if (patch.price !== undefined)             dbPatch.price = patch.price;
    if (patch.cancellationHours !== undefined) dbPatch.cancellation_hours = patch.cancellationHours;
    if (patch.dailyLimit !== undefined)        dbPatch.daily_limit = patch.dailyLimit;
    if (patch.sessionTypes !== undefined)      dbPatch.session_types = patch.sessionTypes;
    if (patch.level !== undefined)             dbPatch.level = patch.level;
    if (patch.renewable !== undefined)         dbPatch.renewable = patch.renewable;
    if (patch.isActive !== undefined)          dbPatch.is_active = patch.isActive;

    const res = await updatePackageFields(packageId, dbPatch);
    if (!res.ok) return { ok: false, reason: res.reason };
    await get().refreshPackages();
    return { ok: true };
  },

  togglePackageActive: async (packageId) => {
    const res = await rpcTogglePackageActive(packageId);
    if (!res.ok) return { ok: false, reason: res.reason };
    await get().refreshPackages();
    return { ok: true };
  },

  // ════════════════════════════════════════════════════════════════════════
  // عمليات إنشاء (Admin فقط — تحقّقات على DB)
  // ════════════════════════════════════════════════════════════════════════
  createTrainee: async (input) => {
    const res = await rpcAdminCreateTrainee(input);
    if (!res.ok) return { ok: false, reason: res.reason };
    await get().refreshTrainees();
    return { ok: true };
  },

  createTrainer: async (input) => {
    const res = await rpcAdminCreateTrainer(input);
    if (!res.ok) return { ok: false, reason: res.reason };
    await get().refreshTrainers();
    return { ok: true };
  },

  createSession: async (input) => {
    const res = await insertSession(input);
    if (!res.ok) return { ok: false, reason: res.reason };
    await get().refreshSessions();
    return { ok: true };
  },

  createPackage: async (input) => {
    const res = await insertPackage(input);
    if (!res.ok) return { ok: false, reason: res.reason };
    await get().refreshPackages();
    return { ok: true };
  },
}));
