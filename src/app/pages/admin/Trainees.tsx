import { useState, useEffect } from 'react';
import { useDataStore } from '../../store/useDataStore';
import type { Trainee } from '../../data/types';
import { Search, Plus, Eye, UserX, X, Pause, Play, Minus, CalendarPlus, Package as PackageIcon, CheckCircle2 } from 'lucide-react';
import { today, daysBetween } from '../../lib/date';
import { fetchBranchesList, type Branch } from '../../api/rpc';
import { LEVEL_MAP, LEVEL_STYLE } from '../../data/constants';
import { inputStyle } from '../../components/ui/utils';

export default function AdminTrainees() {
  const initialized         = useDataStore(s => s.initialized);
  const trainees            = useDataStore(s => s.trainees);
  const packages            = useDataStore(s => s.packages);
  const toggleTraineeStatus = useDataStore(s => s.toggleTraineeStatus);
  const assignPackage       = useDataStore(s => s.assignPackage);
  const freezeSubscription  = useDataStore(s => s.freezeSubscription);
  const unfreezeSubscription= useDataStore(s => s.unfreezeSubscription);
  const extendSubscription  = useDataStore(s => s.extendSubscription);
  const adjustBalance       = useDataStore(s => s.adjustBalance);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createTrainee = useDataStore(s => s.createTrainee);
  const assignPackageRpc = useDataStore(s => s.assignPackage);
  const [addDraft, setAddDraft] = useState({
    name: '', phone: '', username: '', password: 'pass1234', email: '',
    gender: 'female' as 'male'|'female',
    branch_id: '',
    level: 'beginner' as 'beginner'|'intermediate'|'advanced',
    package_id: '',
  });
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    if (showAdd && branches.length === 0) {
      fetchBranchesList().then(setBranches);
    }
  }, [showAdd, branches.length]);

  // Sub-modal state داخل تفاصيل المتدربة
  const [showAssignPkg, setShowAssignPkg] = useState(false);
  const [pkgToAssign, setPkgToAssign]     = useState<string>('');
  const [startDate, setStartDate]         = useState<string>(today());
  const [extendDays, setExtendDays]       = useState<string>('');
  const [balanceDelta, setBalanceDelta]   = useState<string>('');
  const [balanceReason, setBalanceReason] = useState<string>('');
  const [toast, setToast]                 = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  if (!initialized) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );

  // اقرأ التفاصيل الحيّة للمتدربة المختارة من الـ store (لتنعكس التحديثات فوراً)
  const selected: Trainee | null = selectedId
    ? trainees.find(t => t.id === selectedId) ?? null
    : null;

  const filtered = trainees.filter(t => {
    const matchSearch = t.name.includes(search) || t.phone.includes(search) || t.username.includes(search);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function toggleStatus(id: string) {
    await toggleTraineeStatus(id);
  }

  const daysLeft = (t: Trainee) => {
    if (!t.subscription) return null;
    return Math.max(0, daysBetween(today(), t.subscription.endDate));
  };

  const filterTabs = [
    { key: 'all' as const, label: 'الكل', count: trainees.length },
    { key: 'active' as const, label: 'فعالة', count: trainees.filter(t => t.status === 'active').length },
    { key: 'suspended' as const, label: 'موقوفة', count: trainees.filter(t => t.status === 'suspended').length },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      {/* Top bar */}
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid #eef0f3' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>المتدربون</h1>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{filtered.length} من {trainees.length} متدربة</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
            style={{ fontSize: '0.83rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
          >
            <Plus className="w-4 h-4" />
            إضافة
          </button>
        </div>

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
      </div>

      <div className="px-5 py-4 max-w-5xl mx-auto">

        {/* Desktop table */}
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
              {filtered.map((t, i) => {
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
                      <span className="px-2.5 py-1 rounded-full" style={{
                        fontSize: '0.65rem', fontWeight: 600,
                        background: t.status === 'active' ? '#f0fdf4' : '#f8fafc',
                        color:      t.status === 'active' ? '#16a34a' : '#94a3b8',
                        border:     `1px solid ${t.status === 'active' ? '#bbf7d0' : '#e2e8f0'}`,
                      }}>
                        {t.status === 'active' ? 'فعالة' : 'موقوفة'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedId(t.id)} className="p-1.5 rounded-lg transition-all hover:bg-slate-100" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                          <Eye className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                        </button>
                        <button onClick={() => toggleStatus(t.id)} className="p-1.5 rounded-lg transition-all hover:bg-slate-100" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
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

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filtered.map(t => {
            const remaining = t.subscription
              ? (t.subscription.totalSessions === 999 ? '∞' : String(t.subscription.totalSessions - t.subscription.usedSessions))
              : '—';
            return (
              <div key={t.id} className="rounded-2xl p-4" style={{ background: '#ffffff', border: '1px solid #eef0f3' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#f1f5f9' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569' }}>{t.name.slice(0, 1)}</span>
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{t.name}</p>
                      <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{t.phone}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full" style={{
                    fontSize: '0.65rem', fontWeight: 600,
                    background: t.status === 'active' ? '#f0fdf4' : '#f8fafc',
                    color:      t.status === 'active' ? '#16a34a' : '#94a3b8',
                    border:     `1px solid ${t.status === 'active' ? '#bbf7d0' : '#e2e8f0'}`,
                  }}>
                    {t.status === 'active' ? 'فعالة' : 'موقوفة'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #f8fafc' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{t.subscription?.packageName || 'بدون باقة'}</span>
                  <button onClick={() => setSelectedId(t.id)} className="px-3 py-1.5 rounded-lg" style={{ fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer' }}>
                    عرض
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trainee detail modal */}
      {selected && (
        <Modal onClose={() => setSelectedId(null)}>
          <div className="text-center mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#0f172a' }}>
              <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#ffffff' }}>{selected.name.slice(0, 1)}</span>
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{selected.name}</h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{selected.branch} · {LEVEL_MAP[selected.level]}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'الهاتف',         value: selected.phone },
              { label: 'البريد',         value: selected.email },
              { label: 'الجنس',          value: selected.gender === 'female' ? 'أنثى' : 'ذكر' },
              { label: 'تاريخ الانضمام', value: new Date(selected.joinDate).toLocaleDateString('ar-SA') },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                <p style={{ fontSize: '0.62rem', color: '#94a3b8', marginBottom: '2px' }}>{item.label}</p>
                <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>{item.value}</p>
              </div>
            ))}
          </div>

          {selected.subscription && (
            <div className="p-4 rounded-2xl mb-4" style={{ background: '#f8fafc', border: '1px solid #eef0f3' }}>
              <p style={{ fontWeight: 700, fontSize: '0.83rem', color: '#0f172a', marginBottom: '10px' }}>تفاصيل الاشتراك</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'الباقة',        value: selected.subscription.packageName },
                  { label: 'الحالة',        value: selected.subscription.status === 'active' ? 'فعالة' : selected.subscription.status === 'frozen' ? 'مجمدة' : 'منتهية' },
                  { label: 'إجمالي',        value: selected.subscription.totalSessions === 999 ? '∞' : String(selected.subscription.totalSessions) },
                  { label: 'مستخدمة',      value: String(selected.subscription.usedSessions) },
                  { label: 'متبقية',        value: selected.subscription.totalSessions === 999 ? '∞' : String(selected.subscription.totalSessions - selected.subscription.usedSessions) },
                  { label: 'ينتهي',         value: new Date(selected.subscription.endDate).toLocaleDateString('ar-SA') },
                ].map(item => (
                  <div key={item.label}>
                    <p style={{ fontSize: '0.62rem', color: '#94a3b8', marginBottom: '2px' }}>{item.label}</p>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selected.notes && (
            <div className="p-3 rounded-xl mb-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <p style={{ fontSize: '0.78rem', color: '#92400e' }}><strong>ملاحظة: </strong>{selected.notes}</p>
            </div>
          )}

          {/* ────── إجراءات على الاشتراك ────── */}
          {selected.subscription && (
            <div className="p-3 rounded-xl mb-3 space-y-3" style={{ background: '#f8fafc', border: '1px solid #eef0f3' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', letterSpacing: '0.04em' }}>
                إدارة الاشتراك
              </p>

              {/* تجميد / تفعيل */}
              <button
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    if (selected.subscription?.status === 'frozen') {
                      const r = await unfreezeSubscription(selected.id);
                      flash(r.ok ? 'تم تفعيل الاشتراك' : r.reason ?? 'تعذّر التفعيل');
                    } else {
                      const r = await freezeSubscription(selected.id);
                      flash(r.ok ? 'تم تجميد الاشتراك' : r.reason ?? 'تعذّر التجميد');
                    }
                  } catch (err) {
                    flash('خطأ: ' + (err instanceof Error ? err.message : 'غير معروف'));
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all hover:opacity-90"
                style={{
                  fontSize: '0.78rem', fontWeight: 600,
                  background: selected.subscription.status === 'frozen' ? '#dcfce7' : '#fef3c7',
                  color: selected.subscription.status === 'frozen' ? '#166534' : '#92400e',
                  border: 'none', cursor: 'pointer',
                }}
              >
                {selected.subscription.status === 'frozen' ? (
                  <><Play className="w-3.5 h-3.5" /> تفعيل الاشتراك</>
                ) : (
                  <><Pause className="w-3.5 h-3.5" /> تجميد الاشتراك</>
                )}
              </button>

              {/* تمديد بالأيام */}
              <div className="flex gap-2">
                <input
                  type="number"
                  value={extendDays}
                  onChange={e => setExtendDays(e.target.value)}
                  placeholder="أيام إضافية"
                  style={{ ...inputStyle(), padding: '7px 10px', fontSize: '0.78rem' }}
                />
                <button
                  disabled={isSubmitting}
                  onClick={async () => {
                    const n = parseInt(extendDays, 10);
                    if (!n || n <= 0) return;
                    setIsSubmitting(true);
                    try {
                      const r = await extendSubscription(selected.id, n);
                      setExtendDays('');
                      flash(r.ok ? `تم تمديد الاشتراك ${n} يوم` : r.reason ?? 'تعذّر التمديد');
                    } catch (err) {
                      flash('خطأ: ' + (err instanceof Error ? err.message : 'غير معروف'));
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="flex items-center gap-1 px-3 rounded-lg transition-all hover:opacity-90 flex-shrink-0"
                  style={{ fontSize: '0.72rem', fontWeight: 600, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  تمديد
                </button>
              </div>

              {/* ± رصيد يدوي */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={balanceDelta}
                    onChange={e => setBalanceDelta(e.target.value)}
                    placeholder="عدد الجلسات (+/−)"
                    style={{ ...inputStyle(), padding: '7px 10px', fontSize: '0.78rem' }}
                  />
                  <button
                    disabled={isSubmitting}
                    onClick={async () => {
                      const n = parseInt(balanceDelta, 10);
                      if (!n) return;
                      setIsSubmitting(true);
                      try {
                        const r = await adjustBalance(selected.id, n, balanceReason || (n > 0 ? 'إضافة يدوية' : 'خصم يدوي'));
                        setBalanceDelta('');
                        setBalanceReason('');
                        flash(r.ok ? (n > 0 ? `تم إضافة ${n} جلسة` : `تم خصم ${Math.abs(n)} جلسة`) : r.reason ?? 'تعذّر التعديل');
                      } catch (err) {
                        flash('خطأ: ' + (err instanceof Error ? err.message : 'غير معروف'));
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="flex items-center gap-1 px-3 rounded-lg transition-all hover:opacity-90 flex-shrink-0"
                    style={{ fontSize: '0.72rem', fontWeight: 600, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    تعديل
                  </button>
                </div>
                <input
                  type="text"
                  value={balanceReason}
                  onChange={e => setBalanceReason(e.target.value)}
                  placeholder="السبب (اختياري)"
                  style={{ ...inputStyle(), padding: '7px 10px', fontSize: '0.75rem' }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={async () => {
                const was = selected.status;
                await toggleStatus(selected.id);
                flash(was === 'active' ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب');
              }}
              className="flex-1 py-2.5 rounded-xl transition-all"
              style={{ fontSize: '0.85rem', fontWeight: 500, background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}
            >
              {selected.status === 'active' ? 'إيقاف الحساب' : 'تفعيل الحساب'}
            </button>
            <button
              onClick={() => {
                setPkgToAssign('');
                setStartDate(today());
                setShowAssignPkg(true);
              }}
              className="flex-1 py-2.5 rounded-xl transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
              style={{ fontSize: '0.85rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            >
              <PackageIcon className="w-4 h-4" />
              {selected.subscription ? 'تجديد / تبديل الباقة' : 'إسناد باقة'}
            </button>
          </div>
        </Modal>
      )}

      {/* ────── Sub-modal: Assign Package ────── */}
      {showAssignPkg && selected && (
        <Modal onClose={() => setShowAssignPkg(false)} title="إسناد باقة">
          <div className="space-y-3 mb-5">
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>الباقة</label>
              <select value={pkgToAssign} onChange={e => setPkgToAssign(e.target.value)} style={inputStyle()}>
                <option value="">اختر باقة...</option>
                {packages.filter(p => p.isActive !== false).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.sessions === 999 ? '∞' : `${p.sessions} جلسة`} · {p.durationDays} يوم
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>تاريخ البدء</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle()} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAssignPkg(false)} className="flex-1 py-2.5 rounded-xl" style={{ fontSize: '0.85rem', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}>
              إلغاء
            </button>
            <button
              onClick={async () => {
                if (!pkgToAssign || !startDate) return;
                const res = await assignPackage(selected.id, pkgToAssign, startDate);
                if (res.ok) {
                  setShowAssignPkg(false);
                  flash('تم إسناد الباقة');
                } else {
                  flash(res.reason ?? 'تعذّر إسناد الباقة');
                }
              }}
              disabled={!pkgToAssign || !startDate}
              className="flex-1 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50"
              style={{ fontSize: '0.85rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            >
              تأكيد الإسناد
            </button>
          </div>
        </Modal>
      )}

      {/* Add trainee modal */}
      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} title="إضافة متدربة جديدة">
          <div className="space-y-3 mb-5">
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>الاسم الكامل *</label>
              <input type="text" value={addDraft.name} onChange={e => setAddDraft(d => ({ ...d, name: e.target.value }))} placeholder="اسم المتدربة" style={inputStyle()} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>رقم الهاتف</label>
              <input type="tel" value={addDraft.phone} onChange={e => setAddDraft(d => ({ ...d, phone: e.target.value }))} placeholder="05xxxxxxxx" style={inputStyle()} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>اسم المستخدم *</label>
              <input type="text" value={addDraft.username} onChange={e => setAddDraft(d => ({ ...d, username: e.target.value }))} placeholder="3 أحرف على الأقل" style={inputStyle()} />
              <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '3px' }}>يُستخدم لتسجيل الدخول</p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>كلمة المرور *</label>
              <input type="text" value={addDraft.password} onChange={e => setAddDraft(d => ({ ...d, password: e.target.value }))} placeholder="6 أحرف على الأقل" style={inputStyle()} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>البريد الإلكتروني (اختياري)</label>
              <input type="email" value={addDraft.email} onChange={e => setAddDraft(d => ({ ...d, email: e.target.value }))} placeholder="email@example.com" style={inputStyle()} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>الجنس</label>
                <select value={addDraft.gender} onChange={e => setAddDraft(d => ({ ...d, gender: e.target.value as 'male'|'female' }))} style={inputStyle()}>
                  <option value="female">أنثى</option>
                  <option value="male">ذكر</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>الفرع</label>
                <select value={addDraft.branch_id} onChange={e => setAddDraft(d => ({ ...d, branch_id: e.target.value }))} style={inputStyle()}>
                  <option value="">اختر...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>المستوى</label>
                <select value={addDraft.level} onChange={e => setAddDraft(d => ({ ...d, level: e.target.value as typeof addDraft.level }))} style={inputStyle()}>
                  <option value="beginner">مبتدئة</option>
                  <option value="intermediate">متوسطة</option>
                  <option value="advanced">متقدمة</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>الباقة (اختياري — يمكن إسنادها لاحقاً)</label>
              <select value={addDraft.package_id} onChange={e => setAddDraft(d => ({ ...d, package_id: e.target.value }))} style={inputStyle()}>
                <option value="">— بدون باقة —</option>
                {packages.filter(p => p.isActive !== false).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl" style={{ fontSize: '0.85rem', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}>
              إلغاء
            </button>
            <button
              disabled={isSubmitting}
              onClick={async () => {
                if (!addDraft.name.trim() || !addDraft.username.trim() || !addDraft.password) {
                  flash('الاسم واليوزر نيم والباسورد مطلوبة');
                  return;
                }
                if (addDraft.username.trim().length < 3) {
                  flash('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
                  return;
                }
                if (addDraft.password.length < 6) {
                  flash('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
                  return;
                }
                setIsSubmitting(true);
                try {
                  const res = await createTrainee({
                    name: addDraft.name.trim(),
                    username: addDraft.username.trim(),
                    password: addDraft.password,
                    phone: addDraft.phone.trim() || undefined,
                    email: addDraft.email.trim() || undefined,
                    gender: addDraft.gender,
                    branch_id: addDraft.branch_id || undefined,
                    level: addDraft.level,
                  });
                  if (!res.ok) {
                    flash(res.reason ?? 'تعذّر إنشاء الحساب');
                    return;
                  }
                  if (addDraft.package_id) {
                    const newT = useDataStore.getState().trainees.find(t => t.username === addDraft.username.trim());
                    if (newT) {
                      await assignPackageRpc(newT.id, addDraft.package_id, today());
                    }
                  }
                  setShowAdd(false);
                  setAddDraft({
                    name: '', phone: '', username: '', password: 'pass1234', email: '',
                    gender: 'female', branch_id: '', level: 'beginner', package_id: '',
                  });
                  flash('تم إنشاء الحساب بنجاح');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="flex-1 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50"
              style={{ fontSize: '0.85rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Action feedback toast ── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
          style={{ background: '#0f172a', color: '#ffffff' }}
        >
          <CheckCircle2 className="w-4 h-4" />
          <p style={{ fontSize: '0.83rem', fontWeight: 500 }}>{toast}</p>
        </div>
      )}
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl p-6 shadow-2xl"
        style={{ background: '#ffffff', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{title || 'التفاصيل'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
            <X className="w-4 h-4" style={{ color: '#64748b' }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
