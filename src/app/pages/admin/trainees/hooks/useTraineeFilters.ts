import { useMemo, useState } from 'react';
import type { Trainee } from '../../../../data/types';
import type { FilterTab, StatusFilter } from '../TraineesFilters';

export function useTraineeFilters(trainees: Trainee[]) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => trainees.filter(t => {
    const matchSearch = t.name.includes(search) || t.phone.includes(search) || t.username.includes(search);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  }), [trainees, search, statusFilter]);

  const filterTabs: FilterTab[] = useMemo(() => ([
    { key: 'all',       label: 'الكل',      count: trainees.length },
    { key: 'active',    label: 'فعالة',     count: trainees.filter(t => t.status === 'active').length },
    { key: 'suspended', label: 'موقوفة',    count: trainees.filter(t => t.status === 'suspended').length },
    { key: 'inactive',  label: 'غير نشطة',  count: trainees.filter(t => t.status === 'inactive').length },
  ]), [trainees]);

  return { search, setSearch, statusFilter, setStatusFilter, filtered, filterTabs };
}
