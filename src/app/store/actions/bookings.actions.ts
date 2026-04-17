/**
 * Bookings domain actions — bookSession, cancelBooking, markAttendance.
 */
import type { StoreApi } from 'zustand';
import type { DataState, BookResult, CancelResult, ActionResult } from '../useDataStore';
import { rpcBookSession, rpcCancelBooking, rpcMarkAttendance, rpcAdminSetBookingStatus } from '../../api';

type Get = StoreApi<DataState>['getState'];
type Set = StoreApi<DataState>['setState'];

export function createBookingsActions(get: Get, set: Set) {
  void set;
  return {
    bookSession: async (_traineeId: string, sessionId: string): Promise<BookResult> => {
      const res = await rpcBookSession(sessionId);
      if (!res.ok) return { ok: false, reason: res.reason };
      // نحدّث من DB بعد العملية: bookings (الحجز الجديد)، sessions (enrolled)، ledger (خصم الجلسة)
      await Promise.all([get().refreshBookings(), get().refreshSessions(), get().refreshLedger()]);
      return { ok: true };
    },

    cancelBooking: async (bookingId: string, opts?: { forceRefund?: boolean }): Promise<CancelResult> => {
      const res = await rpcCancelBooking(bookingId, opts?.forceRefund ?? false);
      if (!res.ok) return { ok: false, refunded: false, reason: res.reason };
      // ledger يتحدّث (credit إن كان الإلغاء مسترَداً)
      await Promise.all([get().refreshBookings(), get().refreshSessions(), get().refreshLedger()]);
      // نستنتج refunded من حالة الحجز بعد التحديث
      const booking = get().bookings.find(b => b.id === bookingId);
      return { ok: true, refunded: booking?.status === 'cancelled_with_refund' };
    },

    markAttendance: async (bookingId: string, state: 'attended' | 'absent' | 'late'): Promise<ActionResult> => {
      const res = await rpcMarkAttendance(bookingId, state);
      if (!res.ok) return { ok: false, reason: res.reason };
      await Promise.all([get().refreshBookings(), get().refreshSessions()]);
      return { ok: true };
    },

    /**
     * Admin-only: set booking status to any valid state (including reverting
     * to 'confirmed' if attendance was recorded in error). Cannot un-cancel
     * fully cancelled bookings.
     */
    setBookingStatus: async (
      bookingId: string,
      status: 'confirmed' | 'attended' | 'absent' | 'late',
    ): Promise<ActionResult> => {
      const res = await rpcAdminSetBookingStatus(bookingId, status);
      if (!res.ok) return { ok: false, reason: res.reason };
      await Promise.all([get().refreshBookings(), get().refreshSessions()]);
      return { ok: true };
    },
  };
}
