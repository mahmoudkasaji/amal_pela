import { Search, Plus, Filter, X } from 'lucide-react';
import type { Trainer, Session } from '../../../data/types';
import type { SessionType } from '../../../api';

const STATUS_OPTIONS: { value: 'الكل' | Session['status']; label: string }[] = [
  { value: 'الكل',      label: 'كل الحالات' },
  { value: 'open',      label: 'مفتوحة' },
  { value: 'full',      label: 'مكتملة' },
  { value: 'cancelled', label: 'ملغاة' },
  { value: 'completed', label: 'منتهية' },
];

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  trainerFilter: string;
  onTrainerFilterChange: (v: string) => void;
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
  statusFilter: 'الكل' | Session['status'];
  onStatusFilterChange: (v: 'الكل' | Session['status']) => void;
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;

  trainers: Trainer[];
  sessionTypes: SessionType[];
  totalCount: number;
  filteredCount: number;
  onAddClick: () => void;
}

export function SessionsFilters(p: Props) {
  const selectStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#475569',
    padding: '0.55rem 0.75rem',
    borderRadius: '0.75rem',
    outline: 'none',
  };

  return (
    <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid #eef0f3' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>الجلسات</h1>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
            {p.filteredCount} من {p.totalCount} جلسة
          </p>
        </div>
        <button
          onClick={p.onAddClick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
          style={{ fontSize: '0.83rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
        >
          <Plus className="w-4 h-4" />
          جلسة جديدة
        </button>
      </div>

      {/* Search bar */}
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4" style={{ right: '12px', color: '#cbd5e1' }} />
          <input
            value={p.search}
            onChange={(e) => p.onSearchChange(e.target.value)}
            placeholder="بحث بالاسم، المدربة، أو الفرع..."
            className="w-full py-2.5 rounded-xl outline-none"
            style={{ paddingRight: '38px', paddingLeft: '14px', fontSize: '0.83rem', background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155' }}
          />
        </div>
      </div>

      {/* Advanced filters grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <select
          value={p.trainerFilter}
          onChange={(e) => p.onTrainerFilterChange(e.target.value)}
          style={selectStyle}
          title="المدربة"
        >
          <option value="الكل">كل المدربات</option>
          {p.trainers.map((t) => <option key={t.id}>{t.name}</option>)}
        </select>

        <select
          value={p.typeFilter}
          onChange={(e) => p.onTypeFilterChange(e.target.value)}
          style={selectStyle}
          title="نوع الجلسة"
        >
          <option value="الكل">كل الأنواع</option>
          {p.sessionTypes.map((t) => <option key={t.id}>{t.name}</option>)}
        </select>

        <select
          value={p.statusFilter}
          onChange={(e) => p.onStatusFilterChange(e.target.value as 'الكل' | Session['status'])}
          style={selectStyle}
          title="الحالة"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <input
          type="date"
          value={p.dateFrom}
          onChange={(e) => p.onDateFromChange(e.target.value)}
          placeholder="من"
          style={selectStyle}
          title="من تاريخ"
        />

        <input
          type="date"
          value={p.dateTo}
          onChange={(e) => p.onDateToChange(e.target.value)}
          placeholder="إلى"
          style={selectStyle}
          title="إلى تاريخ"
        />
      </div>

      {/* Active filters indicator + reset */}
      {p.hasActiveFilters && (
        <div className="mt-3 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" style={{ color: '#2563eb' }} />
          <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>
            فلاتر مفعّلة — {p.filteredCount} نتيجة
          </span>
          <button
            onClick={p.onResetFilters}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100"
            style={{ fontSize: '0.7rem', color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            <X className="w-3 h-3" />
            مسح الفلاتر
          </button>
        </div>
      )}
    </div>
  );
}
