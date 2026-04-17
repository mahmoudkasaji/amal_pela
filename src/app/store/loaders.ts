/**
 * Role-based store loaders.
 *
 * كل دالة تُحمّل فقط الكيانات التي يحتاجها الدور المعيّن — لتقليل عدد
 * استعلامات Supabase على كل دخول.
 *
 * - Admin: يستخدم `refresh()` الكامل في الـ store (يشمل المراجع)
 * - Trainer: 3 استعلامات رئيسية + 2 مراجع (branches + sessionTypes)
 * - Trainee: 4 استعلامات رئيسية + 2 مراجع
 *
 * Phase A note: كل fetch داخل Promise.allSettled (بما فيها fetchBranches)
 * لمنع أي فشل جزئي من إسقاط كامل التهيئة.
 *
 * Phase D note: branches + sessionTypes تُحمَّل مركزياً ضمن store لتفادي
 * تكرارها على الصفحات الفرعية.
 */

import type { Trainee, Trainer, Package, Session, Booking, LedgerEntry } from '../data/types';
import type { Branch, SessionType } from '../api';
import {
  fetchBranches, fetchBranchesList, fetchSessionTypesList,
  fetchSessions, fetchBookings, fetchTrainees, fetchPackages, fetchLedger,
} from '../api';

/** شكل الحالة التي تقبلها دوال التحميل. */
export interface LoadableState {
  trainees?: Trainee[];
  trainers?: Trainer[];
  packages?: Package[];
  sessions?: Session[];
  bookings?: Booking[];
  ledger?: LedgerEntry[];
  branches?: Branch[];
  sessionTypes?: SessionType[];
}

type SetFn = (partial: LoadableState) => void;

/** Empty map as a safe fallback when fetchBranches fails. */
const EMPTY_BRANCHES = new Map<string, string>();

/** يحمّل البيانات التي تحتاجها واجهة المدربة فقط. */
export async function loadForTrainer(set: SetFn): Promise<void> {
  // كل شيء داخل allSettled — حتى فشل fetchBranches لا يُسقط التهيئة
  const results = await Promise.allSettled([
    fetchBranches(),          // Map<id, name> للـ mappers
    fetchBranchesList(),      // Branch[] للـ UI
    fetchSessionTypesList(),  // SessionType[] للـ UI
    fetchSessions(),
    fetchBookings(),
  ]);
  const [rBranchesMap, rBranchesList, rSessionTypes, rSessions, rBookings] = results;

  const branchesMap = rBranchesMap.status === 'fulfilled' ? rBranchesMap.value : EMPTY_BRANCHES;
  if (rBranchesMap.status === 'rejected') console.error('[loadForTrainer branches map]', rBranchesMap.reason);

  // fetchTrainees يحتاج branches map — نستدعيه بعدها
  let trainees: Trainee[] | undefined;
  try {
    trainees = await fetchTrainees(branchesMap);
  } catch (err) {
    console.error('[loadForTrainer trainees]', err);
  }

  const patch: LoadableState = {};
  if (rBranchesList.status === 'fulfilled') patch.branches = rBranchesList.value;
  else console.error('[loadForTrainer branches list]', rBranchesList.reason);
  if (rSessionTypes.status === 'fulfilled') patch.sessionTypes = rSessionTypes.value;
  else console.error('[loadForTrainer session_types]', rSessionTypes.reason);
  if (rSessions.status === 'fulfilled') patch.sessions = rSessions.value;
  else console.error('[loadForTrainer sessions]', rSessions.reason);
  if (rBookings.status === 'fulfilled') patch.bookings = rBookings.value;
  else console.error('[loadForTrainer bookings]', rBookings.reason);
  if (trainees) patch.trainees = trainees;

  set(patch);
}

/** يحمّل البيانات التي تحتاجها واجهة المتدربة فقط. */
export async function loadForTrainee(set: SetFn): Promise<void> {
  const results = await Promise.allSettled([
    fetchBranchesList(),
    fetchSessionTypesList(),
    fetchSessions(),
    fetchBookings(),
    fetchPackages(),
    fetchLedger(),
  ]);
  const [rBranches, rSessionTypes, rSessions, rBookings, rPackages, rLedger] = results;

  const patch: LoadableState = {};
  if (rBranches.status === 'fulfilled') patch.branches = rBranches.value;
  else console.error('[loadForTrainee branches]', rBranches.reason);
  if (rSessionTypes.status === 'fulfilled') patch.sessionTypes = rSessionTypes.value;
  else console.error('[loadForTrainee session_types]', rSessionTypes.reason);
  if (rSessions.status === 'fulfilled') patch.sessions = rSessions.value;
  else console.error('[loadForTrainee sessions]', rSessions.reason);
  if (rBookings.status === 'fulfilled') patch.bookings = rBookings.value;
  else console.error('[loadForTrainee bookings]', rBookings.reason);
  if (rPackages.status === 'fulfilled') patch.packages = rPackages.value;
  else console.error('[loadForTrainee packages]', rPackages.reason);
  if (rLedger.status === 'fulfilled') patch.ledger = rLedger.value;
  else console.error('[loadForTrainee ledger]', rLedger.reason);

  set(patch);
}
