import { Search } from 'lucide-react';

export type StatusFilter = 'all' | 'active' | 'suspended' | 'inactive';

export interface FilterTab {
  key: StatusFilter;
  label: string;
  count: number;
}

interface Props {
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  filterTabs: FilterTab[];
  search: string;
  setSearch: (v: string) => void;
}

export function TraineesFilters({ statusFilter, setStatusFilter, filterTabs, search, setSearch }: Props) {
  return (
    <>
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4" style={{ right: '12px', color: '#cbd5e1' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو الهاتف..."
          className="w-full py-2.5 rounded-xl outline-none"
          style={{ paddingRight: '38px', paddingLeft: '14px', fontSize: '0.83rem', background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155' }}
        />
      </div>

      {/* Status filter pills */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#f1f5f9' }}>
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
            style={{
              fontSize: '0.75rem', fontWeight: statusFilter === tab.key ? 700 : 400,
              background: statusFilter === tab.key ? '#ffffff' : 'transparent',
              color: statusFilter === tab.key ? '#0f172a' : '#94a3b8',
              border: 'none', cursor: 'pointer',
              boxShadow: statusFilter === tab.key ? '0 1px 4px rgba(15,23,42,0.08)' : 'none',
            }}
          >
            {tab.label}
            <span style={{ fontSize: '0.62rem', fontWeight: 700 }}>({tab.count})</span>
          </button>
        ))}
      </div>
    </>
  );
}
