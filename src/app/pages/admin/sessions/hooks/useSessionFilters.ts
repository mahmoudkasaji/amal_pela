import { useMemo, useState } from 'react';
import type { Session } from '../../../../data/types';

/**
 * Advanced session filters (Phase X3.4):
 * - search: اسم الجلسة / المدربة / الفرع
 * - trainerFilter: اسم مدربة محددة أو "الكل"
 * - typeFilter: نوع الجلسة (من session_types) أو "الكل"
 * - statusFilter: open/full/cancelled/completed أو "الكل"
 * - dateFrom / dateTo: نطاق تواريخ (YYYY-MM-DD) — فارغ = بدون حد
 */
export function useSessionFilters(sessions: Session[]) {
  const [search, setSearch] = useState('');
  const [trainerFilter, setTrainerFilter] = useState('الكل');
  const [typeFilter, setTypeFilter] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState<'الكل' | Session['status']>('الكل');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(
    () =>
      sessions
        .filter((s) => {
          const matchSearch  = !search || s.name.includes(search) || s.trainerName.includes(search) || s.branch.includes(search);
          const matchTrainer = trainerFilter === 'الكل' || s.trainerName === trainerFilter;
          const matchType    = typeFilter === 'الكل' || s.type === typeFilter;
          const matchStatus  = statusFilter === 'الكل' || s.status === statusFilter;
          const matchFrom    = !dateFrom || s.date >= dateFrom;
          const matchTo      = !dateTo   || s.date <= dateTo;
          return matchSearch && matchTrainer && matchType && matchStatus && matchFrom && matchTo;
        })
        .sort((a, b) => a.date.localeCompare(b.date)),
    [sessions, search, trainerFilter, typeFilter, statusFilter, dateFrom, dateTo],
  );

  function resetFilters() {
    setSearch('');
    setTrainerFilter('الكل');
    setTypeFilter('الكل');
    setStatusFilter('الكل');
    setDateFrom('');
    setDateTo('');
  }

  const hasActiveFilters =
    !!search ||
    trainerFilter !== 'الكل' ||
    typeFilter !== 'الكل' ||
    statusFilter !== 'الكل' ||
    !!dateFrom ||
    !!dateTo;

  return {
    search, setSearch,
    trainerFilter, setTrainerFilter,
    typeFilter, setTypeFilter,
    statusFilter, setStatusFilter,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    filtered,
    resetFilters,
    hasActiveFilters,
  };
}
