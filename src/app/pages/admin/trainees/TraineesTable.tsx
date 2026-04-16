import { Eye, UserX } from 'lucide-react';
import type { Trainee } from '../../../data/types';
import { LEVEL_MAP, LEVEL_STYLE, ACCOUNT_STATUS_CONFIG } from '../../../data/constants';
import { today, daysBetween } from '../../../lib/date';

interface Props {
  trainees: Trainee[];
  onSelect: (t: Trainee) => void;
  onToggleStatus: (id: string) => void;
}

export function TraineesTable({ trainees, onSelect, onToggleStatus }: Props) {
  const daysLeft = (t: Trainee) => {
    if (!t.subscription) return null;
    return Math.max(0, daysBetween(today(), t.subscription.endDate));
  };

  return (
    <div className="hidden md:block rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #eef0f3' }}>
      <table className="w-full">
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
            {['المتدربة', 'الهاتف', 'الباقة', 'الرصيد', 'الانتهاء', 'الحالة', ''].map(h => (
              <th key={h} className="text-right px-4 py-3" style={{ fontWeight: 600, fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.06em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trainees.map((t, i) => {
            const days = daysLeft(t);
            const remaining = t.subscription
              ? (t.subscription.totalSessions === 999 ? '∞' : String(t.subscription.totalSessions - t.subscription.usedSessions))
              : '—';
            const lvl = LEVEL_STYLE[t.level] ?? LEVEL_STYLE.beginner;
            return (
              <tr key={t.id} style={{ borderTop: i > 0 ? '1px solid #f8fafc' : 'none' }} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f1f5f9' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#475569' }}>{t.name.slice(0, 1)}</span>
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>{t.name}</p>
                      <span className="px-1.5 py-0.5 rounded" style={{ fontSize: '0.62rem', fontWeight: 600, background: lvl.bg, color: lvl.color }}>
                        {LEVEL_MAP[t.level]}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ fontSize: '0.82rem', color: '#64748b' }}>{t.phone}</td>
                <td className="px-4 py-3" style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.subscription?.packageName || '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-lg" style={{
                    fontSize: '0.72rem', fontWeight: 700,
                    background: remaining === '0' ? '#fef2f2' : remaining === '∞' ? '#f0fdf4' : Number(remaining) <= 2 ? '#fffbeb' : '#f0fdf4',
                    color:      remaining === '0' ? '#dc2626' : remaining === '∞' ? '#16a34a' : Number(remaining) <= 2 ? '#d97706' : '#16a34a',
                  }}>
                    {remaining === '—' ? '—' : remaining}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {days !== null
                    ? <span style={{ fontSize: '0.78rem', fontWeight: 500, color: days <= 7 ? '#d97706' : '#64748b' }}>{days} يوم</span>
                    : <span style={{ color: '#e2e8f0', fontSize: '0.78rem' }}>—</span>
                  }
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const cfg = ACCOUNT_STATUS_CONFIG[t.status];
                    return (
                      <span className="px-2.5 py-1 rounded-full" style={{
                        fontSize: '0.65rem', fontWeight: 600,
                        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                      }}>
                        {cfg.label}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onSelect(t)} className="p-1.5 rounded-lg transition-all hover:bg-slate-100" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                      <Eye className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                    </button>
                    <button onClick={() => onToggleStatus(t.id)} className="p-1.5 rounded-lg transition-all hover:bg-slate-100" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                      <UserX className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
