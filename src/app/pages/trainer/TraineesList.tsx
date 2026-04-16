import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDataStore } from '../../store/useDataStore';
import { Search, User, CalendarDays, CheckCircle2, MapPin } from 'lucide-react';
import { today } from '../../lib/date';
import { LEVEL_MAP, LEVEL_STYLE } from '../../data/constants';

export default function TrainerTraineesList() {
  const { user } = useAuth();
  const bookings = useDataStore(s => s.bookings);
  const trainees = useDataStore(s => s.trainees);

  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // P1-13 note: الربط عبر الاسم هشّ — سيُستبدل بـ trainer_id عند الانتقال لـ Supabase
  const trainerBookings = bookings.filter(b => b.trainerName === user?.name);
  const traineeIds = [...new Set(trainerBookings.map(b => b.traineeId))];
  const myTrainees = trainees
    .filter(t => traineeIds.includes(t.id))
    .filter(t => !search || t.name.includes(search));

  function getStats(traineeId: string) {
    const tb       = trainerBookings.filter(b => b.traineeId === traineeId);
    const attended = tb.filter(b => b.status === 'attended').length;
    const upcoming = tb.filter(b => b.status === 'confirmed' && b.date >= today()).length;
    const last     = tb.filter(b => b.status === 'attended').sort((a, b) => b.date.localeCompare(a.date))[0];
    return { attended, upcoming, last };
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid #eef0f3' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
              المتدربون
            </h1>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
              {myTrainees.length} متدربة في جلساتك
            </p>
          </div>
          <div
            className="px-3 py-1 rounded-full"
            style={{ background: '#0f172a', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700 }}
          >
            {myTrainees.length}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ right: '12px', color: '#cbd5e1' }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحثي عن متدربة..."
            className="w-full py-2.5 rounded-xl outline-none"
            style={{
              paddingRight: '38px',
              paddingLeft: '14px',
              fontSize: '0.83rem',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#334155',
            }}
          />
        </div>
      </div>

      {/* ── List ── */}
      <div className="px-5 py-4 space-y-3 max-w-2xl mx-auto">
        {myTrainees.length === 0 && (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
          >
            <User className="w-10 h-10 mx-auto mb-3" style={{ color: '#e2e8f0' }} />
            <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              {search ? 'لا نتائج لهذا البحث' : 'لا يوجد متدربون مسجلون في جلساتك'}
            </p>
          </div>
        )}

        {myTrainees.map(trainee => {
          const stats      = getStats(trainee.id);
          const lvlStyle   = LEVEL_STYLE[trainee.level] ?? LEVEL_STYLE.beginner;
          const isExpanded = expanded === trainee.id;

          return (
            <div
              key={trainee.id}
              className="rounded-2xl overflow-hidden transition-all"
              style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
            >
              {/* Card header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : trainee.id)}
                className="w-full flex items-center gap-4 p-4 text-right transition-all hover:bg-slate-50"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#f1f5f9' }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#475569' }}>
                    {trainee.name.slice(0, 1)}
                  </span>
                </div>

                {/* Name + level */}
                <div className="flex-1 min-w-0">
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{trainee.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 600,
                        background: lvlStyle.bg,
                        color: lvlStyle.color,
                        border: `1px solid ${lvlStyle.border}`,
                      }}
                    >
                      {LEVEL_MAP[trainee.level]}
                    </span>
                    <span className="flex items-center gap-1" style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      <MapPin className="w-3 h-3" />
                      {trainee.branch}
                    </span>
                  </div>
                </div>

                {/* Status + toggle */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 600,
                      background: trainee.status === 'active' ? '#f0fdf4' : '#f8fafc',
                      color: trainee.status === 'active' ? '#16a34a' : '#94a3b8',
                      border: `1px solid ${trainee.status === 'active' ? '#bbf7d0' : '#e2e8f0'}`,
                    }}
                  >
                    {trainee.status === 'active' ? 'فعالة' : 'موقوفة'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Expanded stats */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid #f1f5f9' }}>
                  <div className="grid grid-cols-3 gap-px" style={{ background: '#f1f5f9' }}>
                    {[
                      { icon: CheckCircle2, label: 'جلسات حضرت', value: stats.attended, color: '#16a34a' },
                      { icon: CalendarDays, label: 'قادمة',       value: stats.upcoming, color: '#0284c7' },
                      {
                        icon: CalendarDays,
                        label: 'آخر حضور',
                        value: stats.last
                          ? new Date(stats.last.date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
                          : '—',
                        color: '#64748b',
                        isText: true,
                      },
                    ].map(stat => (
                      <div
                        key={stat.label}
                        className="flex flex-col items-center justify-center py-4"
                        style={{ background: '#ffffff' }}
                      >
                        <p style={{
                          fontWeight: stat.isText ? 600 : 800,
                          fontSize: stat.isText ? '0.85rem' : '1.5rem',
                          color: stat.color,
                          lineHeight: 1,
                          letterSpacing: stat.isText ? 0 : '-0.03em',
                        }}>
                          {stat.value}
                        </p>
                        <p style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '4px' }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {trainee.notes && (
                    <div className="px-4 py-3" style={{ background: '#ffffff', borderTop: '1px solid #f8fafc' }}>
                      <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '2px' }}>ملاحظة</p>
                      <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>{trainee.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
