/**
 * Packages domain actions — updatePackage, togglePackageActive, createPackage.
 */
import type { StoreApi } from 'zustand';
import type { DataState, ActionResult } from '../useDataStore';
import type { Package } from '../../data/types';
import {
  updatePackageFields, rpcTogglePackageActive, insertPackage,
} from '../../api';
import type { NewPackageInput } from '../../api';

type Get = StoreApi<DataState>['getState'];
type Set = StoreApi<DataState>['setState'];

export function createPackagesActions(get: Get, set: Set) {
  void set;
  return {
    updatePackage: async (packageId: string, patch: Partial<Package>): Promise<ActionResult> => {
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

    togglePackageActive: async (packageId: string): Promise<ActionResult> => {
      const res = await rpcTogglePackageActive(packageId);
      if (!res.ok) return { ok: false, reason: res.reason };
      await get().refreshPackages();
      return { ok: true };
    },

    createPackage: async (input: NewPackageInput): Promise<ActionResult> => {
      const res = await insertPackage(input);
      if (!res.ok) return { ok: false, reason: res.reason };
      await get().refreshPackages();
      return { ok: true };
    },
  };
}
