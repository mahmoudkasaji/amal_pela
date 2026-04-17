/**
 * Role-based store loaders.
 *
 * كل دالة تُحمّل فقط الكيانات التي يحتاجها الدور المعيّن — لتقليل عدد
 * استعلامات Supabase على كل دخول.
 *
 * - Admin: يستخدم `refresh()` الكامل في الـ store
 * - Trainer: 3 استعلامات (sessions + bookings + trainees)
 * - Trainee: 4 استعلامات (sessions + bookings + packages + ledger)
 *
 * Phase A note: كل fetch داخل Promise.allSettled (بما فيها fetchBranches)
 * لمنع أي فشل جزئي من إسقاط كامل التهيئة.
 */

import type { Trainee, Trainer, Package, Session, Booking, LedgerEntry } from '../data/types';
import { fetchBranches, fetchSessions, fetchBookings, fetchTrainees, fetchPackages, fetchLedger } from '../api';

/** شكل الحالة التي تقبلها دوال التحميل. */
export interface LoadableState {
  trainees?: Trainee[];
  trainers?: Trainer[];
  packages?: Package[];
  sessions?: Session[];
  bookings?: Booking[];
  ledger?: LedgerEntry[];
}

type SetFn = (partial: LoadableState) => void;

/** Empty map as a safe fallback when fetchBranches fails. */
const EMPTY_BRANCHES = new Map<string, string>();

/** يحمّل البيانات التي تحتاجها واجهة المدربة فقط. */
export async function loadForTrainer(set: SetFn): Promise<void> {
  // كل شيء داخل allSettled — حتى فشل fetchBranches لا يُسقط التهيئة
  const results = await Promise.allSettled([
    fetchBranches(),
    fetchSessions(),
    fetchBookings(),
  ]);
  const [rBranches, rSessions, rBookings] = results;

  const branches = rBranches.status === 'fulfilled' ? rBranches.value : EMPTY_BRANCHES;
  if (rBranches.status === 'rejected') console.error('[loadForTrainer branches]', rBranches.reason);

  // fetchTrainees يحتاج branches map — نستدعيه بعدها
  let trainees: Trainee[] | undefined;
  try {
    trainees = await fetchTrainees(branches);
  } catch (err) {
    console.error('[loadForTrainer trainees]', err);
  }

  const patch: LoadableState = {};
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
    fetchSessions(),
    fetchBookings(),
    fetchPackages(),
    fetchLedger(),
  ]);
  const [rSessions, rBookings, rPackages, rLedger] = results;

  const patch: LoadableState = {};
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
