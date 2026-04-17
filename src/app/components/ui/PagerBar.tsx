/**
 * PagerBar — RTL Arabic pagination component used by Admin list pages.
 * يُستخدم مع usePagination hook (src/app/lib/usePagination.ts).
 *
 * ملاحظة: المكوّن الـ shadcn الأصلي `pagination.tsx` غير مستخدم في Admin.
 * هذا المكوّن مخصص للتصميم العربي الحالي.
 */
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showingFrom: number;
  showingTo: number;
  total: number;
}

export function PagerBar({ page, totalPages, onPageChange, showingFrom, showingTo, total }: Props) {
  if (total === 0) return null;

  // Compact page list: 1 ... (current-1) current (current+1) ... last
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div
      dir="rtl"
      className="flex items-center justify-between gap-3 px-5 py-4 flex-wrap"
      style={{ borderTop: '1px solid #eef0f3', fontFamily: "'Cairo', sans-serif" }}
    >
      <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
        عرض <span style={{ fontWeight: 700, color: '#0f172a' }}>{showingFrom}</span>
        {' – '}
        <span style={{ fontWeight: 700, color: '#0f172a' }}>{showingTo}</span>
        {' من '}
        <span style={{ fontWeight: 700, color: '#0f172a' }}>{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-2 rounded-lg transition-all hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'white', border: '1px solid #e2e8f0', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          title="السابقة"
          aria-label="الصفحة السابقة"
        >
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {pages.map((p, i) => {
          if (p === '...') {
            return (
              <span key={`e${i}`} style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '0 4px' }}>
                …
              </span>
            );
          }
          const active = p === page;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className="px-3 py-1.5 rounded-lg transition-all"
              style={{
                fontSize: '0.8rem',
                fontWeight: active ? 700 : 500,
                background: active ? '#0f172a' : 'white',
                color: active ? '#ffffff' : '#475569',
                border: `1px solid ${active ? '#0f172a' : '#e2e8f0'}`,
                cursor: 'pointer',
                minWidth: 36,
              }}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-2 rounded-lg transition-all hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'white', border: '1px solid #e2e8f0', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
          title="التالية"
          aria-label="الصفحة التالية"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </div>
  );
}
