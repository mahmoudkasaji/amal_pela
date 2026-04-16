import { supabase } from '../lib/supabase';
import type { LedgerEntry } from '../data/types';

// ─── DB row type ──────────────────────────────────────────────────────────
export interface DbLedger {
  id: string;
  trainee_id: string;
  subscription_id: string | null;
  entry_date: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  balance_after: number;
  source_booking_id: string | null;
}

// ─── Mapper ───────────────────────────────────────────────────────────────
export function mapLedger(row: DbLedger): LedgerEntry {
  return {
    id: row.id,
    traineeId: row.trainee_id,
    date: row.entry_date,
    type: row.type,
    amount: row.amount,
    reason: row.reason,
    balance: row.balance_after,
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────
export async function fetchLedger(): Promise<LedgerEntry[]> {
  const { data, error } = await supabase.from('ledger_entries').select('*').order('created_at', { ascending: true });
  if (error) throw new Error(`Ledger: ${error.message}`);
  return (data as DbLedger[]).map(mapLedger);
}
