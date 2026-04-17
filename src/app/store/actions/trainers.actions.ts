/**
 * Trainers domain actions — updateTrainer, toggleTrainerStatus, createTrainer.
 */
import type { StoreApi } from 'zustand';
import type { DataState, ActionResult } from '../useDataStore';
import type { Trainer } from '../../data/types';
import {
  rpcAdminUpdateTrainer, rpcToggleTrainerStatus, rpcAdminCreateTrainer,
} from '../../api';
import type { UpdateTrainerInput, NewTrainerInput } from '../../api';

type Get = StoreApi<DataState>['getState'];
type Set = StoreApi<DataState>['setState'];

export function createTrainersActions(get: Get, set: Set) {
  void set;
  return {
    updateTrainer: async (trainerId: string, patch: Partial<Trainer>): Promise<ActionResult> => {
      // Phase D: branches من store
      let branchId: string | undefined;
      if (patch.branch !== undefined) {
        const match = get().branches.find(b => b.name === patch.branch);
        branchId = match?.id;
      }

      const rpcPatch: UpdateTrainerInput = {
        name:      patch.name,
        email:     patch.email,
        phone:     patch.phone,
        status:    patch.status,
        specialty: patch.specialty,
        branch_id: branchId,
      };

      const res = await rpcAdminUpdateTrainer(trainerId, rpcPatch);
      if (!res.ok) return { ok: false, reason: res.reason };

      await get().refreshTrainers();
      return { ok: true };
    },

    toggleTrainerStatus: async (trainerId: string): Promise<ActionResult> => {
      const res = await rpcToggleTrainerStatus(trainerId);
      if (!res.ok) return { ok: false, reason: res.reason };
      await get().refreshTrainers();
      return { ok: true };
    },

    createTrainer: async (input: NewTrainerInput): Promise<ActionResult> => {
      const res = await rpcAdminCreateTrainer(input);
      if (!res.ok) return { ok: false, reason: res.reason };
      await get().refreshTrainers();
      return { ok: true };
    },
  };
}
