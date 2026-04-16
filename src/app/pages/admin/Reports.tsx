import { useMemo, useCallback } from 'react';
import { useDataStore } from '../../store/useDataStore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { addDays, today, workWeekDates, startOfWeek } from '../../lib/date';
import { downloadCSV } from '../../lib/csv';
import { Download } from 'lucide-react';
import type { Session, Booking } from '../../data/types';

const CHART_COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1'];

const WEEK_DAY_LABELS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس'];

/**
 * P1-23: حساب week trend ديناميكياً من الـ store.
 * لكل يوم من أيام الأسبوع الحالي (أحد → خميس):
 * - عدد الجلسات النشطة (غير الملغاة)
 * - عدد المتدربات الفريدة التي حجزت/حضرت ذلك اليوم
 */
function computeWeekTrend(
  sessions: Session[],
  bookings: Booking[]
): { day: string; جلسات: number; متدربون: number }[] {
  const dates = workWeekDates(startOfWeek(today()));
  return dates.map((iso, i) => {
    const sessionsOfDay = sessions.filter(s => s.date === iso && s.status !== 'cancelled');
    const bookingsOfDay = bookings.filter(b => b.date === iso && b.status !== 'cancelled_with_refund' && b.status !== 'cancelled_no_refund');
    const uniqueTrainees = new Set(bookingsOfDay.map(b => b.traineeId)).size;
    return {
      day: WEEK_DAY_LABELS[i],
      جلسات: sessionsOfDay.length,
      متدربون: uniqueTrainees,
    };
  });
}

export default function AdminReports() {
  const trainees = useDataStore(s => s.trainees);
  const trainers = useDataStore(s => s.trainers);
  const sessions = useDataStore(s => s.sessions);
  const bookings = useDataStore(s => s.bookings);
  const packages = useDataStore(s => s.packages);

  const weekTrend = useMemo(() => computeWeekTrend(sessions, bookings), [sessions, bookings]);

  const activeTrainees   = useMemo(() => trainees.filter(t => t.status === 'active').length, [trainees]);
  const totalAttended    = useMemo(() => bookings.filter(b => b.status === 'attended').length, [bookings]);
  const attendanceRate   = useMemo(() => bookings.length > 0 ? Math.round((totalAttended / bookings.length) * 100) : 0, [totalAttended, bookings]);
  const cancellationRate = useMemo(() => bookings.length > 0 ? Math.round((bookings.filter(b => b.status.includes('cancelled')).length / bookings.length) * 100) : 0, [bookings]);

  const trainerData = useMemo(() => trainers.map(t => ({
    name:     t.name,
    جلسات:   sessions.filter(s => s.trainerId === t.id).length,
    متدربون: bookings.filter(b => b.trainerName === t.name).length,
  })), [trainers, sessions, bookings]);

  const statusData = useMemo(() => [
    { name: 'حضر',       value: bookings.filter(b => b.status === 'attended').length },
    { name: 'غياب',      value: bookings.filter(b => b.status === 'absent').length },
    { name: 'ملغى مسترد', value: bookings.filter(b => b.status === 'cancelled_with_refund').length },
    { name: 'إلغاء متأخر', value: bookings.filter(b => b.status === 'cancelled_no_refund').length },
    { name: 'مؤكد',      value: bookings.filter(b => b.status === 'confirmed').length },
  ].filter(d => d.value > 0), [bookings]);

  const occupancyData = useMemo(() => sessions
    .filter(s => s.status === 'completed' || s.date >= addDays(today(), -2))
    .slice(0, 6)
    .map((s, idx) => {
      const base = s.name.length > 8 ? s.name.slice(0, 8) + '…' : s.name;
      return {
        name: `${base} #${idx + 1}`,
        إشغال: Math.round((s.enrolled / s.capacity) * 100),
      };
    }), [sessions]);

  const packageData = useMemo(() => packages.map(p => ({
    name: p.name.replace('باقة ', ''),
    عدد:  trainees.filter(t => t.subscription?.packageId === p.id).length,
  })).filter(d => d.عدد > 0), [packages, trainees]);

  const summaryCards = useMemo(() => [
    { label: 'معدل الحضور',       value: `${attendanceRate}%`,     color: '#16a34a', bg: '#f0fdf4' },
    { label: 'معدل الإلغاء',      value: `${cancellationRate}%`,   color: '#dc2626', bg: '#fef2f2' },
    { label: 'المتدربات النشطات', value: String(activeTrainees),   color: '#2563eb', bg: '#eff6ff' },
    { label: 'إجمالي الحجوزات',  value: String(bookings.length),  color: '#7c3aed', bg: '#faf5ff' },
  ], [attendanceRate, cancellationRate, activeTrainees, bookings]);

  const tooltipStyle = {
    contentStyle: { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11, fontFamily: "'Cairo', sans-serif" },
  };

  const handleExportBookings = useCallback(() => {
    const headers = ['المتدربة', 'المدربة', 'التاريخ', 'الحالة'];
    const rows = bookings.map(b => [
      b.traineeName ?? '',
      b.trainerName ?? '',
      b.date ?? '',
      b.status ?? '',
    ]);
    downloadCSV(headers, rows, 'bookings-report.csv');
  }, [bookings]);

  const handleExportTrainees = useCallback(() => {
    const headers = ['الاسم', 'الهاتف', 'الحالة', 'الباقة'];
    const rows = trainees.map(t => [
      t.name ?? '',
      t.phone ?? '',
      t.status ?? '',
      t.subscription?.packageName ?? '',
    ]);
    downloadCSV(headers, rows, 'trainees-report.csv');
  }, [trainees]);

  const handleExportSessions = useCallback(() => {
    const headers = ['الجلسة', 'المدربة', 'التاريخ', 'الوقت', 'المسجلون', 'السعة', 'الحالة'];
    const rows = sessions.map(s => [
      s.name ?? '',
      s.trainerName ?? '',
      s.date ?? '',
      s.startTime ?? '',
      String(s.enrolled ?? 0),
      String(s.capacity ?? 0),
      s.status ?? '',
    ]);
    downloadCSV(headers, rows, 'sessions-report.csv');
  }, [sessions]);

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      {/* Top bar */}
      <div className="px-5 pt-6 pb-5 flex items-start justify-between" style={{ borderBottom: '1px solid #eef0f3' }}>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>التقارير والتحليلات</h1>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>ملخص الأداء التشغيلي</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'الحجوزات', handler: handleExportBookings },
            { label: 'المتدربات', handler: handleExportTrainees },
            { label: 'الجلسات', handler: handleExportSessions },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.handler}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-slate-100"
              style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0' }}
            >
              <Download className="w-3.5 h-3.5" />
              تصدير {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 max-w-5xl mx-auto space-y-4">

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryCards.map(s => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: '#ffffff', border: '1px solid #eef0f3' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                <span style={{ fontWeight: 800, fontSize: '0.8rem', color: s.color }}>{s.value}</span>
              </div>
              <p style={{ fontWeight: 800, fontSize: '1.5rem', color: s.color, lineHeight: 1, letterSpacing: '-0.04em' }}>{s.value}</p>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Trainer performance */}
          <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #eef0f3' }}>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', marginBottom: '16px' }}>أداء المدربات</p>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={trainerData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }} id="report-trainer-bar">
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis key="xaxis" dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis key="yaxis" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip key="tooltip" {...tooltipStyle} />
                <Bar key="bar-sessions" dataKey="جلسات"   fill="#0f172a" radius={[4, 4, 0, 0]} />
                <Bar key="bar-trainees" dataKey="متدربون" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Booking status */}
          <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #eef0f3' }}>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', marginBottom: '16px' }}>توزيع حالات الحجوزات</p>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie key="pie" data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3} id="report-status-pie">
                  {statusData.map((entry, i) => <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip key="tooltip" {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {statusData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Weekly trend */}
          <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #eef0f3' }}>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', marginBottom: '16px' }}>النشاط الأسبوعي</p>
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={weekTrend} margin={{ top: 0, right: 0, left: -28, bottom: 0 }} id="report-week-area">
                <defs key="defs">
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0f172a" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis key="xaxis" dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis key="yaxis" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip key="tooltip" {...tooltipStyle} />
                <Area key="area" type="monotone" dataKey="متدربون" stroke="#0f172a" strokeWidth={2} fill="url(#areaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Occupancy */}
          <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #eef0f3' }}>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', marginBottom: '16px' }}>نسبة إشغال الجلسات</p>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={occupancyData} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }} id="report-occupancy-bar">
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis key="xaxis" type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <YAxis key="yaxis" type="category" dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip key="tooltip" {...tooltipStyle} formatter={v => [`${v}%`, 'الإشغال']} />
                <Bar key="bar" dataKey="إشغال" fill="#334155" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Package distribution */}
        <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #eef0f3' }}>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', marginBottom: '16px' }}>توزيع المتدربات على الباقات</p>
          <div className="flex flex-wrap gap-4">
            {packageData.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                >
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>{p.عدد}</span>
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.83rem', color: '#334155' }}>{p.name}</p>
                  <p style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{p.عدد} متدربة</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}