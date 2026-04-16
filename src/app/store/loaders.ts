/**
 * Role-based store loaders.
 *
 * كل دالة تُحمّل فقط الكيانات التي يحتاجها الدور المعيّن — لتقليل عدد
 * استعلامات Supabase على كل دخول.
 *
 * - Admin: يستخدم `refresh()` الكامل في الـ store
 * - Trainer: 3 استعلامات (sessions + bookings + trainees)
 * - Trainee: 4 استعلامات (sessions + bookings + packages + ledger)
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

/** يحمّل البيانات التي تحتاجها واجهة المدربة فقط. */
export async function loadForTrainer(set: SetFn): Promise<void> {
  const branches = await fetchBranches();
  const results = await Promise.allSettled([
    fetchSessions(),
    fetchBookings(),
    fetchTrainees(branches),
  ]);
  const [rSessions, rBookings, rTrainees] = results;

  const patch: LoadableState = {};
  if (rSessions.status === 'fulfilled') patch.sessions = rSessions.value;
  else console.error('[loadForTrainer sessions]', rSessions.reason);
  if (rBookings.status === 'fulfilled') patch.bookings = rBookings.value;
  else console.error('[loadForTrainer bookings]', rBookings.reason);
  if (rTrainees.status === 'fulfilled') patch.trainees = rTrainees.value;
  else console.error('[loadForTrainer trainees]', rTrainees.reason);

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
