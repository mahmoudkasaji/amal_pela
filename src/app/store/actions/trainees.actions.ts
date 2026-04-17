/**
 * Trainees domain actions — status toggle, package assignment, freeze/unfreeze,
 * extend, balance adjust, update, create.
 */
import type { StoreApi } from 'zustand';
import type { DataState, ActionResult } from '../useDataStore';
import type { Trainee } from '../../data/types';
import {
  rpcToggleTraineeStatus, rpcAssignPackage,
  rpcFreezeSubscription, rpcUnfreezeSubscription,
  rpcExtendSubscription, rpcAdjustBalance,
  rpcAdminUpdateTrainee, rpcAdminCreateTrainee,
} from '../../api';
import type { UpdateTraineeInput, NewTraineeInput } from '../../api';

type Get = StoreApi<DataState>['getState'];
type Set = StoreApi<DataState>['setState'];

export function createTraineesActions(get: Get, set: Set) {
  void set;
  return {
    toggleTraineeStatus: async (traineeId: string): Promise<ActionResult> => {
      const res = await rpcToggleTraineeStatus(traineeId);
      if (!res.ok) return { ok: false, reason: res.reason };
      await get().refreshTrainees();
      return { ok: true };
    },

    assignPackage: async (traineeId: string, packageId: string, startDate: string): Promise<ActionResult> => {
      const res = await rpcAssignPackage(traineeId, packageId, startDate);
      if (!res.ok) return { ok: false, reason: res.reason };
      // ledger يتحدّث (credit بعدد جلسات الباقة)
      await Promise.all([get().refreshTrainees(), get().refreshLedger()]);
      return { ok: true };
    },

    freezeSubscription: async (traineeId: string): Promise<ActionResult> => {
      const res = await rpcFreezeSubscription(traineeId);
      if (!res.ok) return { ok: false, reason: res.reason };
      // ledger يتحدّث (entry للتجميد بقيمة 0)
      await Promise.all([get().refreshTrainees(), get().refreshLedger()]);
      return { ok: true };
    },

    unfreezeSubscription: async (traineeId: string): Promise<ActionResult> => {
      const res = await rpcUnfreezeSubscription(traineeId);
      if (!res.ok) return { ok: false, reason: res.reason };
      // ledger يتحدّث (entry لإعادة التفعيل)
      await Promise.all([get().refreshTrainees(), get().refreshLedger()]);
      return { ok: true };
    },

    extendSubscription: async (traineeId: string, days: number): Promise<ActionResult> => {
      const res = await rpcExtendSubscription(traineeId, days);
      if (!res.ok) return { ok: false, reason: res.reason };
      // ledger يتحدّث (entry بتوثيق التمديد)
      await Promise.all([get().refreshTrainees(), get().refreshLedger()]);
      return { ok: true };
    },

    adjustBalance: async (traineeId: string, delta: number, reason: string): Promise<ActionResult> => {
      const res = await rpcAdjustBalance(traineeId, delta, reason);
      if (!res.ok) return { ok: false, reason: res.reason };
      // ledger يتحدّث (entry يدوي بالقيمة) — هذا الأهم: سجل التعديل يجب أن يظهر فوراً
      await Promise.all([get().refreshTrainees(), get().refreshLedger()]);
      return { ok: true };
    },

    updateTrainee: async (traineeId: string, patch: Partial<Trainee>): Promise<ActionResult> => {
      // اسم الفرع من UI يجب تحويله إلى branch_id
      // Phase D: استخدم branches المحفوظة في store بدل fetchBranches() جديد
      let branchId: string | undefined;
      if (patch.branch !== undefined) {
        const match = get().branches.find(b => b.name === patch.branch);
        branchId = match?.id;
      }

      const rpcPatch: UpdateTraineeInput = {
        name:       patch.name,
        email:      patch.email,
        phone:      patch.phone,
        status:     patch.status,
        gender:     patch.gender,
        birth_date: patch.birthDate,
        branch_id:  branchId,
        level:      patch.level,
        notes:      patch.notes,
      };

      const res = await rpcAdminUpdateTrainee(traineeId, rpcPatch);
      if (!res.ok) return { ok: false, reason: res.reason };

      await get().refreshTrainees();
      return { ok: true };
    },

    createTrainee: async (input: NewTraineeInput): Promise<ActionResult> => {
      const res = await rpcAdminCreateTrainee(input);
      if (!res.ok) return { ok: false, reason: res.reason };
      await get().refreshTrainees();
      return { ok: true };
    },
  };
}
