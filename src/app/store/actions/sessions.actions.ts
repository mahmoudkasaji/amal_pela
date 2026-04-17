/**
 * Sessions domain actions — cancelSession, updateSession, createSession.
 */
import type { StoreApi } from 'zustand';
import type { DataState, ActionResult } from '../useDataStore';
import { rpcCancelSession, updateSessionFields, insertSession } from '../../api';
import type { NewSessionInput } from '../../api';

type Get = StoreApi<DataState>['getState'];
type Set = StoreApi<DataState>['setState'];

export function createSessionsActions(get: Get, set: Set) {
  void set;
  return {
    cancelSession: async (sessionId: string): Promise<ActionResult> => {
      const res = await rpcCancelSession(sessionId);
      if (!res.ok) return { ok: false, reason: res.reason };
      await get().refreshSessions();
      return { ok: true };
    },

    updateSession: async (
      sessionId: string,
      fields: Partial<{
        name: string; type: string; trainer_id: string; branch_id: string;
        date: string; start_time: string; end_time: string;
        capacity: number; level: string; notes: string; status: string;
      }>,
    ): Promise<ActionResult> => {
      try {
        await updateSessionFields(sessionId, fields);
      } catch (err: any) {
        return { ok: false, reason: err.message ?? 'تعذّر تعديل الجلسة' };
      }
      await get().refreshSessions();
      return { ok: true };
    },

    createSession: async (input: NewSessionInput): Promise<ActionResult> => {
      const res = await insertSession(input);
      if (!res.ok) return { ok: false, reason: res.reason };
      await get().refreshSessions();
      return { ok: true };
    },
  };
}
