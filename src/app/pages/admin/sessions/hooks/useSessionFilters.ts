import { useMemo, useState } from 'react';
import type { Session } from '../../../../data/types';

export function useSessionFilters(sessions: Session[]) {
  const [search, setSearch] = useState('');
  const [trainerFilter, setTrainerFilter] = useState('الكل');

  const filtered = useMemo(
    () =>
      sessions
        .filter(s => {
          const matchSearch = s.name.includes(search) || s.trainerName.includes(search) || s.branch.includes(search);
          const matchTrainer = trainerFilter === 'الكل' || s.trainerName === trainerFilter;
          return matchSearch && matchTrainer;
        })
        .sort((a, b) => a.date.localeCompare(b.date)),
    [sessions, search, trainerFilter],
  );

  return { search, setSearch, trainerFilter, setTrainerFilter, filtered };
}
