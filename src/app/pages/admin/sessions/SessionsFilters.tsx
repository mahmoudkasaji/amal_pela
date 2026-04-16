import { Search, Plus } from 'lucide-react';
import type { Trainer } from '../../../data/types';

export function SessionsFilters({
  search,
  onSearchChange,
  trainerFilter,
  onTrainerFilterChange,
  trainers,
  totalCount,
  filteredCount,
  onAddClick,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  trainerFilter: string;
  onTrainerFilterChange: (v: string) => void;
  trainers: Trainer[];
  totalCount: number;
  filteredCount: number;
  onAddClick: () => void;
}) {
  return (
    <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid #eef0f3' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>الجلسات</h1>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{filteredCount} من {totalCount} جلسة</p>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
          style={{ fontSize: '0.83rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
        >
          <Plus className="w-4 h-4" />
          جلسة جديدة
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px] relative">
          <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4" style={{ right: '12px', color: '#cbd5e1' }} />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="بحث عن جلسة..."
            className="w-full py-2.5 rounded-xl outline-none"
            style={{ paddingRight: '38px', paddingLeft: '14px', fontSize: '0.83rem', background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155' }}
          />
        </div>
        <select
          value={trainerFilter}
          onChange={e => onTrainerFilterChange(e.target.value)}
          className="py-2.5 px-3 rounded-xl outline-none"
          style={{ fontSize: '0.83rem', background: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b' }}
        >
          <option>الكل</option>
          {trainers.map(t => <option key={t.id}>{t.name}</option>)}
        </select>
      </div>
    </div>
  );
}
