import { CalendarDays, Clock, Users, MapPin } from 'lucide-react';
import type { Session } from '../../../data/types';
import { formatShortArabic } from '../../../lib/date';

export function getStatusStyle(status: string) {
  if (status === 'open')      return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'مفتوحة' };
  if (status === 'full')      return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'مكتملة' };
  if (status === 'cancelled') return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'ملغاة' };
  return                             { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', label: 'منتهية' };
}

const formatDate = formatShortArabic;

export function SessionsList({
  sessions,
  onSelect,
}: {
  sessions: Session[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="px-5 py-4 max-w-5xl mx-auto">
      <div className="grid md:grid-cols-2 gap-3">
        {sessions.map(s => {
          const st = getStatusStyle(s.status);
          const fillPct = (s.enrolled / s.capacity) * 100;
          return (
            <div
              key={s.id}
              onClick={() => onSelect(s.id)}
              className="rounded-2xl p-4 cursor-pointer transition-all hover:shadow-sm"
              style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', marginBottom: '3px' }}>{s.name}</h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>مع {s.trainerName}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full flex-shrink-0 mr-3" style={{ fontSize: '0.62rem', fontWeight: 600, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                  {st.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 mb-3" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{formatDate(s.date)}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{s.startTime} – {s.endTime}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{s.branch}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1" style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    <Users className="w-3 h-3" />{s.enrolled} / {s.capacity}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{Math.round(fillPct)}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${fillPct}%`, background: fillPct >= 90 ? '#d97706' : '#0f172a' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
