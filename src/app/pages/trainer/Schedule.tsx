import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDataStore } from '../../store/useDataStore';
import { CalendarDays, Clock, MapPin, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import { today, addDays, workWeekDates, formatLongArabic } from '../../lib/date';

const WEEK_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

const formatFullDate = formatLongArabic;

function statusStyle(status: string) {
  if (status === 'open')      return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'مفتوحة' };
  if (status === 'full')      return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'مكتملة' };
  if (status === 'completed') return { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', label: 'منتهية' };
  return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'ملغاة' };
}

export default function TrainerSchedule() {
  const { user } = useAuth();
  const initialized = useDataStore(s => s.initialized);
  const sessions = useDataStore(s => s.sessions);
  const TODAY = today();
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [view, setView] = useState<'day' | 'week'>('day');

  if (!initialized) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );

  // أسبوع ديناميكي حول التاريخ المختار (الأحد → الخميس، 5 أيام عمل الاستوديو)
  const WEEK_DATES = workWeekDates(selectedDate);

  const trainerSessions = sessions.filter(s => s.trainerId === user?.id);
  const daySessions = trainerSessions
    .filter(s => s.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  function shiftDay(delta: number) {
    setSelectedDate(addDays(selectedDate, delta));
  }

  function shiftWeek(delta: number) {
    setSelectedDate(addDays(selectedDate, delta * 7));
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid #eef0f3' }}>
        <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
          جدول الجلسات
        </h1>
        <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
          استعراض وإدارة جلساتك
        </p>

        {/* View toggle */}
        <div
          className="flex gap-1 mt-4 p-1 rounded-xl"
          style={{ background: '#f1f5f9', width: 'fit-content' }}
        >
          {(['day', 'week'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-5 py-2 rounded-lg transition-all duration-200"
              style={{
                fontSize: '0.78rem',
                fontWeight: view === v ? 700 : 400,
                background: view === v ? '#ffffff' : 'transparent',
                color: view === v ? '#0f172a' : '#94a3b8',
                boxShadow: view === v ? '0 1px 4px rgba(15,23,42,0.08)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {v === 'day' ? 'يومي' : 'أسبوعي'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 max-w-2xl mx-auto space-y-4">

        {/* ── Week view ── */}
        {view === 'week' && (
          <>
            {/* Prev/Next week nav */}
            <div
              className="flex items-center justify-between p-3 rounded-2xl mb-2"
              style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
            >
              <button
                onClick={() => shiftWeek(1)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-slate-50"
                style={{ border: '1px solid #eef0f3', background: 'transparent', cursor: 'pointer' }}
                aria-label="الأسبوع التالي"
              >
                <ChevronLeft className="w-4 h-4" style={{ color: '#64748b' }} />
              </button>

              <div className="text-center">
                <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>الأسبوع من</p>
                <p style={{ fontWeight: 600, fontSize: '0.83rem', color: '#0f172a' }}>
                  {new Date(WEEK_DATES[0]).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                  {' – '}
                  {new Date(WEEK_DATES[WEEK_DATES.length - 1]).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                </p>
              </div>

              <button
                onClick={() => shiftWeek(-1)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-slate-50"
                style={{ border: '1px solid #eef0f3', background: 'transparent', cursor: 'pointer' }}
                aria-label="الأسبوع السابق"
              >
                <ChevronRight className="w-4 h-4" style={{ color: '#64748b' }} />
              </button>
            </div>

          <div className="grid grid-cols-5 gap-2">
            {WEEK_DAYS.map((day, i) => {
              const date     = WEEK_DATES[i];
              const daySess  = trainerSessions.filter(s => s.date === date);
              const isToday  = date === TODAY;
              const isSel    = date === selectedDate;

              return (
                <button
                  key={date}
                  onClick={() => { setSelectedDate(date); setView('day'); }}
                  className="rounded-2xl p-3 transition-all text-center"
                  style={{
                    background: isSel ? '#0f172a' : isToday ? '#f8fafc' : '#ffffff',
                    border: `1px solid ${isSel ? '#0f172a' : isToday ? '#e2e8f0' : '#eef0f3'}`,
                    cursor: 'pointer',
                  }}
                >
                  <p style={{ fontSize: '0.6rem', color: isSel ? 'rgba(255,255,255,0.45)' : '#94a3b8', marginBottom: '3px' }}>
                    {day}
                  </p>
                  <p style={{
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: isSel ? '#ffffff' : isToday ? '#0f172a' : '#475569',
                    marginBottom: '8px',
                    letterSpacing: '-0.02em',
                  }}>
                    {new Date(date).getDate()}
                  </p>
                  <div className="space-y-1">
                    {daySess.slice(0, 2).map(s => (
                      <div
                        key={s.id}
                        className="rounded-lg px-1.5 py-1"
                        style={{ background: isSel ? 'rgba(255,255,255,0.12)' : '#f1f5f9' }}
                      >
                        <p style={{
                          fontSize: '0.55rem',
                          fontWeight: 600,
                          color: isSel ? 'rgba(255,255,255,0.75)' : '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {s.name}
                        </p>
                        <p style={{ fontSize: '0.5rem', color: isSel ? 'rgba(255,255,255,0.35)' : '#94a3b8' }}>
                          {s.startTime}
                        </p>
                      </div>
                    ))}
                    {daySess.length === 0 && (
                      <p style={{ fontSize: '0.6rem', color: isSel ? 'rgba(255,255,255,0.25)' : '#e2e8f0' }}>—</p>
                    )}
                    {daySess.length > 2 && (
                      <p style={{ fontSize: '0.55rem', color: isSel ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}>
                        +{daySess.length - 2}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          </>
        )}

        {/* ── Day nav ── */}
        {view === 'day' && (
          <div
            className="flex items-center justify-between p-4 rounded-2xl"
            style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
          >
            <button
              onClick={() => shiftDay(1)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-slate-50"
              style={{ border: '1px solid #eef0f3', background: 'transparent', cursor: 'pointer' }}
            >
              <ChevronLeft className="w-4 h-4" style={{ color: '#64748b' }} />
            </button>

            <div className="text-center">
              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                {formatFullDate(selectedDate)}
              </p>
              {selectedDate === TODAY && (
                <span
                  className="px-2.5 py-0.5 rounded-full inline-block mt-1"
                  style={{ fontSize: '0.65rem', fontWeight: 700, background: '#0f172a', color: '#ffffff' }}
                >
                  اليوم
                </span>
              )}
            </div>

            <button
              onClick={() => shiftDay(-1)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-slate-50"
              style={{ border: '1px solid #eef0f3', background: 'transparent', cursor: 'pointer' }}
            >
              <ChevronRight className="w-4 h-4" style={{ color: '#64748b' }} />
            </button>
          </div>
        )}

        {/* ── Sessions list ── */}
        <div className="space-y-3">
          {daySessions.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
            >
              <CalendarDays className="w-10 h-10 mx-auto mb-3" style={{ color: '#e2e8f0' }} />
              <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>لا توجد جلسات في هذا اليوم</p>
            </div>
          ) : (
            daySessions.map(s => {
              const st = statusStyle(s.status);
              const fillPct = (s.enrolled / s.capacity) * 100;
              return (
                <div
                  key={s.id}
                  className="rounded-2xl p-4"
                  style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: '0.93rem', color: '#0f172a', marginBottom: '4px' }}>
                        {s.name}
                      </h3>
                      <span
                        className="px-2.5 py-0.5 rounded-lg"
                        style={{ fontSize: '0.65rem', fontWeight: 600, background: '#f1f5f9', color: '#475569' }}
                      >
                        {s.type}
                      </span>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ fontSize: '0.65rem', fontWeight: 600, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                    >
                      {st.label}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-3 mb-3" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {s.startTime} – {s.endTime}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {s.branch}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {s.enrolled} / {s.capacity}
                    </span>
                  </div>

                  {/* Fill bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${fillPct}%`,
                          background: fillPct >= 90 ? '#d97706' : '#0f172a',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                      {Math.round(fillPct)}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
