import { supabase } from '../lib/supabase';
import type { Package } from '../data/types';
import { translateError, type RpcResult } from './_shared';

// ─── DB row types ─────────────────────────────────────────────────────────
export interface DbPackage {
  id: string;
  name: string;
  description: string | null;
  sessions: number;
  duration_days: number;
  price: number;
  cancellation_hours: number;
  daily_limit: number;
  session_types: string[];
  level: 'all' | 'beginner' | 'intermediate' | 'advanced';
  renewable: boolean;
  is_active: boolean;
}

export interface DbSubscription {
  id: string;
  trainee_id: string;
  package_id: string;
  total_sessions: number;
  used_sessions: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'frozen';
}

// ─── Mapper ───────────────────────────────────────────────────────────────
export function mapPackage(row: DbPackage): Package {
  return {
    id: row.id,
    name: row.name,
    sessions: row.sessions,
    durationDays: row.duration_days,
    price: Number(row.price),
    cancellationHours: row.cancellation_hours,
    sessionTypes: row.session_types,
    dailyLimit: row.daily_limit,
    renewable: row.renewable,
    description: row.description ?? '',
    level: row.level,
    isActive: row.is_active,
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────
export async function fetchPackages(): Promise<Package[]> {
  const { data, error } = await supabase.from('packages').select('*').order('price');
  if (error) throw new Error(`Packages: ${error.message}`);
  return (data as DbPackage[]).map(mapPackage);
}

// ─── Insert ───────────────────────────────────────────────────────────────
export interface NewPackageInput {
  name: string;
  description: string;
  sessions: number;
  duration_days: number;
  price: number;
  cancellation_hours: number;
  daily_limit: number;
  session_types: string[];
  level: 'all' | 'beginner' | 'intermediate' | 'advanced';
  renewable: boolean;
}

export async function insertPackage(input: NewPackageInput): Promise<RpcResult> {
  const { error } = await supabase.rpc('admin_insert_package', {
    p_name:               input.name,
    p_description:        input.description,
    p_sessions:           input.sessions,
    p_duration_days:      input.duration_days,
    p_price:              input.price,
    p_cancellation_hours: input.cancellation_hours,
    p_daily_limit:        input.daily_limit,
    p_session_types:      input.session_types,
    p_level:              input.level,
    p_renewable:          input.renewable,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

// ─── Update via admin_update_package RPC ─────────────────────────────────
export async function updatePackageFields(packageId: string, patch: Record<string, unknown>): Promise<RpcResult> {
  const { error } = await supabase.rpc('admin_update_package', {
    p_package_id:         packageId,
    p_name:               (patch.name               as string | undefined) ?? null,
    p_description:        (patch.description        as string | undefined) ?? null,
    p_sessions:           (patch.sessions           as number | undefined) ?? null,
    p_duration_days:      (patch.duration_days      as number | undefined) ?? null,
    p_price:              (patch.price              as number | undefined) ?? null,
    p_cancellation_hours: (patch.cancellation_hours as number | undefined) ?? null,
    p_daily_limit:        (patch.daily_limit        as number | undefined) ?? null,
    p_session_types:      (patch.session_types      as string[] | undefined) ?? null,
    p_level:              (patch.level              as string | undefined) ?? null,
    p_renewable:          (patch.renewable          as boolean | undefined) ?? null,
    p_is_active:          (patch.is_active          as boolean | undefined) ?? null,
  });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}

// ─── Toggle active ────────────────────────────────────────────────────────
export async function rpcTogglePackageActive(packageId: string): Promise<RpcResult> {
  const { error } = await supabase.rpc('toggle_package_active', { p_package_id: packageId });
  if (error) return { ok: false, reason: translateError(error.message) };
  return { ok: true };
}
