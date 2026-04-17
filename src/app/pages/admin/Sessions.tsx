import { useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import type { Session } from '../../data/types';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatShortArabic } from '../../lib/date';
import { SessionsFilters } from './sessions/SessionsFilters';
import { SessionsList, getStatusStyle } from './sessions/SessionsList';
import { AddSessionModal } from './sessions/AddSessionModal';
import { EditSessionModal, type EditDraft } from './sessions/EditSessionModal';
import { useSessionFilters } from './sessions/hooks/useSessionFilters';
import { usePagination } from '../../lib/usePagination';
import { PagerBar } from '../../components/ui/PagerBar';

const formatDate = formatShortArabic;

export default function AdminSessions() {
  const initialized   = useDataStore(s => s.initialized);
  const allSessions   = useDataStore(s => s.sessions);
  const trainers      = useDataStore(s => s.trainers);
  const bookings      = useDataStore(s => s.bookings);
  const cancelSession = useDataStore(s => s.cancelSession);
  const createSession = useDataStore(s => s.createSession);
  const updateSession = useDataStore(s => s.updateSession);

  const {
    search, setSearch,
    trainerFilter, setTrainerFilter,
    typeFilter, setTypeFilter,
    statusFilter, setStatusFilter,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    filtered,
    resetFilters,
    hasActiveFilters,
  } = useSessionFilters(allSessions);

  // Phase X4: pagination — 10 per page
  const { pageItems, page, setPage, totalPages, showingFrom, showingTo, total } = usePagination(filtered, 10);

  const [showAdd, setShowAdd] = useState(false);
  // Phase D: branches + sessionTypes من الـ store (محمّلة مرة واحدة عند التهيئة)
  const branches = useDataStore(s => s.branches);
  const sessionTypes = useDataStore(s => s.sessionTypes);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [showEdit, setShowEdit] = useState(false);
  const [editInitialDraft, setEditInitialDraft] = useState<EditDraft | null>(null);
  const [editSessionId, setEditSessionId] = useState<string | null>(null);

  if (!initialized) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );

  const selected: Session | null = selectedId
    ? allSessions.find(s => s.id === selectedId) ?? null
    : null;

  // عدد المحجوزات النشطة على الجلسة المختارة (لعرضها في تأكيد الإلغاء)
  const activeBookingsCount = selected
    ? bookings.filter(b => b.sessionId === selected.id && b.status === 'confirmed').length
    : 0;

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleCancelSession() {
    if (!selected) return;
    const count = activeBookingsCount;
    const res = await cancelSession(selected.id);
    setConfirmCancel(false);
    setSelectedId(null);
    flash(
      res.ok
        ? (count > 0 ? `تم إلغاء الجلسة وإعادة الرصيد لـ${count} متدربة` : 'تم إلغاء الجلسة')
        : res.reason ?? 'تعذّر إلغاء الجلسة'
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      <SessionsFilters
        search={search}
        onSearchChange={setSearch}
        trainerFilter={trainerFilter}
        onTrainerFilterChange={setTrainerFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        onResetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
        trainers={trainers}
        sessionTypes={sessionTypes}
        totalCount={allSessions.length}
        filteredCount={filtered.length}
        onAddClick={() => setShowAdd(true)}
      />

      <SessionsList sessions={pageItems} onSelect={setSelectedId} />

      <PagerBar
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        showingFrom={showingFrom}
        showingTo={showingTo}
        total={total}
      />

      {/* Session detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedId(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            style={{ background: '#ffffff' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header dark */}
            <div className="p-5" style={{ background: '#0f172a' }}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>{selected.name}</h2>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '3px' }}>مع {selected.trainerName}</p>
                </div>
                <button onClick={() => setSelectedId(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer' }}>
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="space-y-2 mb-5">
                {[
                  { label: 'النوع',    value: selected.type },
                  { label: 'التاريخ', value: formatDate(selected.date) },
                  { label: 'الوقت',   value: `${selected.startTime} – ${selected.endTime}` },
                  { label: 'الفرع',   value: selected.branch },
                  { label: 'السعة',   value: `${selected.enrolled} / ${selected.capacity}` },
                  { label: 'الحالة',  value: getStatusStyle(selected.status).label },
                  { label: 'المستوى', value: selected.level === 'all' ? 'للجميع' : selected.level === 'beginner' ? 'مبتدئات' : selected.level === 'intermediate' ? 'متوسطات' : 'متقدمات' },
                  ...(selected.notes ? [{ label: 'ملاحظات', value: selected.notes }] : []),
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #f8fafc' }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{row.label}</span>
                    <span style={{ fontSize: '0.83rem', fontWeight: 500, color: '#334155' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // look up branch_id and trainer_id from selected session
                    const brId = branches.find(b => b.name === selected.branch)?.id ?? '';
                    setEditInitialDraft({
                      name: selected.name,
                      type: selected.type,
                      trainer_id: selected.trainerId,
                      branch_id: brId,
                      date: selected.date,
                      start_time: selected.startTime,
                      end_time: selected.endTime,
                      capacity: selected.capacity,
                      level: selected.level,
                      notes: selected.notes,
                    });
                    setEditSessionId(selected.id);
                    // branches/sessionTypes متوفران من الـ store بالفعل
                    setSelectedId(null);
                    setShowEdit(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl transition-all" style={{ fontSize: '0.85rem', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}
                >
                  تعديل
                </button>
                <button
                  onClick={() => setConfirmCancel(true)}
                  disabled={selected.status === 'cancelled' || selected.status === 'completed'}
                  className="flex-1 py-2.5 rounded-xl transition-all hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontSize: '0.85rem', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer' }}
                >
                  إلغاء الجلسة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm cancel session modal ── */}
      {confirmCancel && selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirmCancel(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            style={{ background: '#ffffff' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#fef2f2' }}>
                <AlertTriangle className="w-7 h-7" style={{ color: '#dc2626' }} />
              </div>
            </div>
            <h3 className="text-center" style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '8px' }}>
              إلغاء جلسة «{selected.name}»؟
            </h3>
            <p className="text-center mb-5" style={{ fontSize: '0.83rem', color: '#64748b' }}>
              {activeBookingsCount > 0
                ? `سيتم إعادة الرصيد تلقائياً لـ${activeBookingsCount} متدربة محجوزة، ولا يمكن التراجع.`
                : 'لا توجد حجوزات نشطة — ستُوضَع الجلسة في حالة ملغاة.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmCancel(false)}
                className="flex-1 py-2.5 rounded-xl"
                style={{ fontSize: '0.85rem', fontWeight: 500, background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}
              >
                تراجع
              </button>
              <button
                onClick={handleCancelSession}
                className="flex-1 py-2.5 rounded-xl hover:opacity-90"
                style={{ fontSize: '0.85rem', fontWeight: 700, background: '#dc2626', color: '#ffffff', border: 'none', cursor: 'pointer' }}
              >
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <AddSessionModal
          onClose={() => setShowAdd(false)}
          onSubmit={createSession}
          trainers={trainers}
          branches={branches}
          sessionTypes={sessionTypes}
          flash={flash}
        />
      )}

      {showEdit && editSessionId && editInitialDraft && (
        <EditSessionModal
          sessionId={editSessionId}
          initialDraft={editInitialDraft}
          onClose={() => setShowEdit(false)}
          onSubmit={updateSession}
          trainers={trainers}
          branches={branches}
          sessionTypes={sessionTypes}
          flash={flash}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
          style={{ background: '#0f172a', color: '#ffffff' }}
        >
          <CheckCircle2 className="w-4 h-4" />
          <p style={{ fontSize: '0.83rem', fontWeight: 500 }}>{toast}</p>
        </div>
      )}
    </div>
  );
}
