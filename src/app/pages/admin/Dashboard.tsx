import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useDataStore } from '../../store/useDataStore';
import { Users, CalendarDays, BookOpen, AlertCircle, XCircle, ChevronLeft } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { today, addDays, daysBetween } from '../../lib/date';
import type { Session } from '../../data/types';
import { STATUS_CONFIG } from '../../data/constants';

/** عدد الجلسات لآخر 7 أيام (شامل اليوم) محسوباً من بيانات الـ store. */
function computeSessionTrend(sessions: Session[]): { name: string; sessions: number }[] {
  const result: { name: string; sessions: number }[] = [];
  for (let offset = -6; offset <= 0; offset++) {
    const iso = addDays(today(), offset);
    const count = sessions.filter(s => s.date === iso && s.status !== 'cancelled').length;
    const d = new Date(iso);
    const label = `${d.getDate()} ${d.toLocaleDateString('ar-SA', { month: 'short' })}`;
    result.push({ name: label, sessions: count });
  }
  return result;
}

const PIE_COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1'];

export default function AdminDashboard() {
  const navigate = useNavigate();

  const initialized = useDataStore(s => s.initialized);
  const trainees = useDataStore(s => s.trainees);
  const trainers = useDataStore(s => s.trainers);
  const sessions = useDataStore(s => s.sessions);
  const bookings = useDataStore(s => s.bookings);
  const packages = useDataStore(s => s.packages);
  void trainers; // for future KPIs

  // P1-23: بيانات المخطط تُحسب من الـ store بدل أن تكون ثابتة
  const sessionTrend = useMemo(() => computeSessionTrend(sessions), [sessions]);

  const activeTrainees = useMemo(() => trainees.filter(t => t.status === 'active').length, [trainees]);
  const todaySessions  = useMemo(() => sessions.filter(s => s.date === today()), [sessions]);
  const totalBookings  = bookings.length;
  const todayBookings  = useMemo(() => bookings.filter(b => b.createdAt === today()).length, [bookings]);
  const cancellations  = useMemo(() => bookings.filter(b => b.status.includes('cancelled')).length, [bookings]);
  const recentBookings = useMemo(() => bookings.slice(0, 6), [bookings]);

  const expiring = useMemo(() => trainees.filter(t => {
    if (!t.subscription) return false;
    const days = daysBetween(today(), t.subscription.endDate);
    return days <= 7 && days > 0;
  }), [trainees]);

  const occupancyRate = useMemo(() => todaySessions.length > 0
    ? Math.round(todaySessions.reduce((acc, s) => acc + s.enrolled / s.capacity, 0) / todaySessions.length * 100)
    : 0, [todaySessions]);

  const packageDist = useMemo(() => packages.map(p => ({
    name: p.name,
    value: trainees.filter(t => t.subscription?.packageId === p.id).length,
  })).filter(p => p.value > 0), [packages, trainees]);

  if (!initialized) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );

  const kpis = [
    { label: 'المتدربون النشطون', value: activeTrainees, sub: `من ${trainees.length} إجمالي`,    icon: Users,        to: '/admin/trainees' },
    { label: 'جلسات اليوم',       value: todaySessions.length, sub: `إشغال ${occupancyRate}%`, icon: CalendarDays, to: '/admin/sessions' },
    { label: 'حجوزات اليوم',      value: todayBookings, sub: `${totalBookings} إجمالي`,         icon: BookOpen,     to: '/admin/bookings' },
    { label: 'الإلغاءات',         value: cancellations, sub: 'إجمالي الإلغاءات',                icon: XCircle,      to: '/admin/bookings' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      {/* Top bar */}
      <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid #eef0f3' }}>
        <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          {new Date(today()).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em', marginTop: '2px' }}>
          لوحة التحكم
        </h1>
      </div>

      <div className="px-5 py-5 space-y-5 max-w-5xl mx-auto">

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map(k => (
            <button
              key={k.label}
              onClick={() => navigate(k.to)}
              className="rounded-2xl p-4 text-right transition-all hover:shadow-sm"
              style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-3" style={{ background: '#f1f5f9' }}>
                <k.icon className="w-3.5 h-3.5" style={{ color: '#475569' }} />
              </div>
              <p style={{ fontWeight: 800, fontSize: '1.8rem', color: '#0f172a', lineHeight: 1, letterSpacing: '-0.04em' }}>
                {k.value}
              </p>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginTop: '4px' }}>{k.label}</p>
              <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>{k.sub}</p>
            </button>
          ))}
        </div>

        {/* Expiring alert */}
        {expiring.length > 0 && (
          <div
            className="flex items-start gap-3 p-4 rounded-2xl"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#d97706' }} />
            <div className="flex-1">
              <p style={{ fontWeight: 700, fontSize: '0.83rem', color: '#92400e', marginBottom: '8px' }}>
                {expiring.length} اشتراكات تنتهي خلال 7 أيام
              </p>
              <div className="flex flex-wrap gap-2">
                {expiring.map(t => {
                  const days = daysBetween(today(), t.subscription!.endDate);
                  return (
                    <span
                      key={t.id}
                      className="px-2.5 py-1 rounded-lg"
                      style={{ fontSize: '0.72rem', fontWeight: 500, background: '#ffffff', border: '1px solid #fde68a', color: '#92400e' }}
                    >
                      {t.name} · {days} أيام
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Charts row */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Area chart */}
          <div className="md:col-span-2 rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #eef0f3' }}>
            <div className="flex items-center justify-between mb-5">
              <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>الجلسات — الأسبوع الماضي</p>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={sessionTrend} margin={{ top: 0, right: 0, left: -30, bottom: 0 }} id="dash-session-area">
                <defs key="defs">
                  <linearGradient id="darkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0f172a" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis key="xaxis" dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis key="yaxis" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  key="tooltip"
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11, fontFamily: "'Cairo', sans-serif" }}
                  formatter={(v: number) => [v, 'جلسات']}
                />
                <Area key="area" type="monotone" dataKey="sessions" stroke="#0f172a" strokeWidth={2} fill="url(#darkGrad)" dot={{ fill: '#0f172a', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #eef0f3' }}>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', marginBottom: '16px' }}>توزيع الباقات</p>
            <ResponsiveContainer width="100%" height={110}>
              <PieChart>
                <Pie key="pie" data={packageDist} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={3} id="dash-package-pie">
                  {packageDist.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip key="tooltip" contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-3">
              {packageDist.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }} className="truncate max-w-[100px]">{p.name}</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155' }}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent bookings */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #eef0f3' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>آخر الحجوزات</p>
            <button
              onClick={() => navigate('/admin/bookings')}
              className="flex items-center gap-1"
              style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              عرض الكل <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['المتدربة', 'الجلسة', 'التاريخ', 'المدربة', 'الحالة'].map(h => (
                    <th key={h} className="text-right px-4 py-3" style={{ fontWeight: 600, fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b, i) => {
                  const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.confirmed;
                  return (
                    <tr key={b.id} style={{ borderTop: '1px solid #f8fafc' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f1f5f9' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>{b.traineeName.slice(0, 1)}</span>
                          </div>
                          <span style={{ fontWeight: 500, fontSize: '0.83rem', color: '#334155', whiteSpace: 'nowrap' }}>{b.traineeName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '0.83rem', color: '#64748b', whiteSpace: 'nowrap' }}>{b.sessionName}</td>
                      <td className="px-4 py-3" style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {new Date(b.date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '0.83rem', color: '#64748b', whiteSpace: 'nowrap' }}>{b.trainerName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-lg" style={{ fontSize: '0.65rem', fontWeight: 600, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}