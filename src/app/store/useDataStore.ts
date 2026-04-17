/**
 * Store البيانات المركزي — مرتبط بـ Supabase كمصدر حقيقة.
 *
 * - `initialize()` يُحمِّل كل الكيانات بالتوازي (يُستدعى من AuthProvider بعد الدخول)
 * - `reset()` يُفرغ الحالة عند تسجيل الخروج
 * - كل action عمل تجاري يستدعي RPC ثم يُحدِّث الـ store من DB مباشرةً لضمان الاتساق
 *
 * Phase F: الـ actions مقسّمة على `./actions/*.actions.ts` — هذا الملف يحوي
 * state + lifecycle + partial refreshers فقط، ويدمج المصانع في النهاية.
 *
 * لا persist إلى localStorage: البيانات تأتي من DB عند كل دخول.
 */

import { create } from 'zustand';
import type { Trainee, Trainer, Package, Session, Booking, LedgerEntry, UserRole } from '../data/types';
import {
  fetchTrainees, fetchTrainers, fetchPackages,
  fetchSessions, fetchBookings, fetchLedger,
  fetchBranches, // Map<id,name> used in refresh() for trainee/trainer mappers
  fetchBranchesList, fetchSessionTypesList,
} from '../api';
import type { Branch, SessionType } from '../api';
import type { NewTraineeInput, NewTrainerInput, NewSessionInput, NewPackageInput } from '../api';

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
export interface DataState {
  /**
   * Phase E:
   * - `initialized`: fast path اكتمل — الواجهة الأساسية (Dashboard/Sessions)
   *   جاهزة للعرض
   * - `fullyLoaded`: كل البيانات (الثقيلة: ledger + reports) جاهزة
   * الصفحات الخفيفة تنتظر `initialized` فقط؛ الصفحات الثقيلة تستخدم
   * `fullyLoaded` لعرض skeletons.
   */
  initialized: boolean;
  fullyLoaded: boolean;
  loading:     boolean;
  /** رسالة خطأ عند فشل التهيئة — الواجهة تعرضها مع زر إعادة المحاولة */
  initError:   string | null;

  trainees: Trainee[];
  trainers: Trainer[];
  packages: Package[];
  sessions: Session[];
  bookings: Booking[];
  ledger:   LedgerEntry[];
  /** بيانات مرجعية مشتركة (Phase D): تُحمّل مرة واحدة وتُقرأ من الصفحات */
  branches: Branch[];
  sessionTypes: SessionType[];

  // ─── lifecycle ─────
  /**
   * يُحمِّل البيانات حسب دور المستخدم لتقليل عدد الاستعلامات.
   * - admin: يحمّل كل الكيانات (6 استعلامات)
   * - trainer: يحمّل sessions + bookings + trainees (3 استعلامات)
   * - trainee: يحمّل sessions + bookings + packages + ledger (4 استعلامات)
   */
  initialize: (role?: UserRole) => Promise<void>;
  refresh:    () => Promise<void>;
  /** Phase E: يحمّل البيانات الثقيلة في الخلفية (Admin فقط) */
  loadBackground: () => Promise<void>;
  reset:      () => void;

  // ─── partial refresh ─────
  refreshBookings: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  refreshTrainees: () => Promise<void>;
  refreshTrainers: () => Promise<void>;
  refreshPackages: () => Promise<void>;
  refreshLedger:   () => Promise<void>;
  refreshBranches:     () => Promise<void>;
  refreshSessionTypes: () => Promise<void>;

  // ─── عمليات المتدربة ─────
  bookSession:    (traineeId: string, sessionId: string) => Promise<BookResult>;
  cancelBooking:  (bookingId: string, opts?: { forceRefund?: boolean }) => Promise<CancelResult>;

  // ─── عمليات المدربة ─────
  markAttendance: (bookingId: string, state: 'attended' | 'absent' | 'late') => Promise<ActionResult>;

  /** Admin فقط — تغيير حالة حجز إلى أي حالة صالحة (يشمل الرجوع لـ confirmed) */
  setBookingStatus: (bookingId: string, status: 'confirmed' | 'attended' | 'absent' | 'late') => Promise<ActionResult>;

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

// Role-based loaders extracted to ./loaders.ts for separation of concerns.
import { loadForTrainer, loadForTrainee, loadAdminFastPath } from './loaders';
// Phase F: domain action factories
import { createBookingsActions } from './actions/bookings.actions';
import { createSessionsActions } from './actions/sessions.actions';
import { createTraineesActions } from './actions/trainees.actions';
import { createTrainersActions } from './actions/trainers.actions';
import { createPackagesActions } from './actions/packages.actions';

// ─── Store Factory ────────────────────────────────────────────────────────
export const useDataStore = create<DataState>()((set, get) => ({
  initialized: false,
  fullyLoaded: false,
  loading:     false,
  initError:   null,

  trainees: [],
  trainers: [],
  packages: [],
  sessions: [],
  bookings: [],
  ledger:   [],
  branches:     [],
  sessionTypes: [],

  // ════════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ════════════════════════════════════════════════════════════════════════
  initialize: async (role) => {
    if (get().initialized) return;
    set({ loading: true, initError: null, fullyLoaded: false });
    try {
      // Route to role-specific loader to minimize network round-trips
      if (role === 'trainer') {
        await loadForTrainer(set);
        // trainer لا يحتاج background — كل بياناته تحمّلت في الـ fast path
        set({ fullyLoaded: true });
      } else if (role === 'trainee') {
        await loadForTrainee(set);
        // trainee لا يحتاج background — كل بياناته تحمّلت في الـ fast path
        set({ fullyLoaded: true });
      } else {
        // Admin: Fast path — branches + session_types + sessions + trainees + trainers
        // (للـ Dashboard KPIs والـ modals). يكفي للسماح للواجهة بالعرض.
        await loadAdminFastPath(set);
        // ثم نشغّل background fetch بدون انتظار — bookings + packages + ledger
        // يُحمَّلون بالخلفية. الصفحات الثقيلة تنتظر `fullyLoaded`.
        get().loadBackground().catch((err) => console.error('[background load]', err));
      }
    } catch (err) {
      console.error('[initialize] unexpected error:', err);
      set({
        initError: err instanceof Error
          ? `تعذّر تحميل بعض البيانات: ${err.message}`
          : 'تعذّر تحميل بعض البيانات. يرجى إعادة المحاولة.',
      });
    } finally {
      // initialized دائماً true بعد محاولة التهيئة — حتى مع فشل جزئي
      set({ initialized: true, loading: false });
    }
  },

  loadBackground: async () => {
    const results = await Promise.allSettled([
      fetchBookings(),
      fetchPackages(),
      fetchLedger(),
    ]);
    const [rBookings, rPackages, rLedger] = results;
    const patch: Partial<DataState> = {};
    if (rBookings.status === 'fulfilled') patch.bookings = rBookings.value;
    else console.error('[loadBackground bookings]', rBookings.reason);
    if (rPackages.status === 'fulfilled') patch.packages = rPackages.value;
    else console.error('[loadBackground packages]', rPackages.reason);
    if (rLedger.status === 'fulfilled') patch.ledger = rLedger.value;
    else console.error('[loadBackground ledger]', rLedger.reason);
    set({ ...patch, fullyLoaded: true });
  },

  refresh: async () => {
    // Phase D: fetch branches + session_types once as reference data,
    // pass branches map to trainee/trainer fetchers to avoid N+1
    const refResults = await Promise.allSettled([
      fetchBranches(),      // Map<id, name> for mappers
      fetchBranchesList(),  // Full Branch[] for UI
      fetchSessionTypesList(),
    ]);
    const branchesMap = refResults[0].status === 'fulfilled' ? refResults[0].value : new Map<string, string>();
    if (refResults[0].status === 'rejected') console.error('[refresh branches map]', refResults[0].reason);
    const branchesList = refResults[1].status === 'fulfilled' ? refResults[1].value : [];
    if (refResults[1].status === 'rejected') console.error('[refresh branches list]', refResults[1].reason);
    const sessionTypesList = refResults[2].status === 'fulfilled' ? refResults[2].value : [];
    if (refResults[2].status === 'rejected') console.error('[refresh session_types]', refResults[2].reason);

    const results = await Promise.allSettled([
      fetchTrainees(branchesMap),
      fetchTrainers(branchesMap),
      fetchPackages(),
      fetchSessions(),
      fetchBookings(),
      fetchLedger(),
    ]);

    const keys = ['trainees', 'trainers', 'packages', 'sessions', 'bookings', 'ledger'] as const;
    const patch: Record<string, unknown> = {
      branches: branchesList,
      sessionTypes: sessionTypesList,
    };

    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        patch[keys[i]] = r.value;
      } else {
        console.error(`[Store refresh error: ${keys[i]}]`, r.reason);
      }
    });

    set(patch as Partial<DataState>);
  },

  reset: () => {
    set({
      initialized: false,
      fullyLoaded: false,
      loading: false,
      initError: null,
      trainees: [],
      trainers: [],
      packages: [],
      sessions: [],
      bookings: [],
      ledger: [],
      branches: [],
      sessionTypes: [],
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
  refreshLedger: async () => {
    try { const ledger = await fetchLedger(); set({ ledger }); }
    catch (e) { console.error('[refreshLedger]', e); }
  },
  refreshBranches: async () => {
    try { const branches = await fetchBranchesList(); set({ branches }); }
    catch (e) { console.error('[refreshBranches]', e); }
  },
  refreshSessionTypes: async () => {
    try { const sessionTypes = await fetchSessionTypesList(); set({ sessionTypes }); }
    catch (e) { console.error('[refreshSessionTypes]', e); }
  },

  // ════════════════════════════════════════════════════════════════════════
  // Domain actions — factories (Phase F)
  // ════════════════════════════════════════════════════════════════════════
  ...createBookingsActions(get, set),
  ...createSessionsActions(get, set),
  ...createTraineesActions(get, set),
  ...createTrainersActions(get, set),
  ...createPackagesActions(get, set),
}));
