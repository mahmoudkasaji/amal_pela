import { useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import type { Trainee } from '../../data/types';
import { Plus, CheckCircle2 } from 'lucide-react';
import { TraineesFilters } from './trainees/TraineesFilters';
import { TraineesTable } from './trainees/TraineesTable';
import { TraineesCards } from './trainees/TraineesCards';
import { AddTraineeModal } from './trainees/AddTraineeModal';
import { AssignPackageModal } from './trainees/AssignPackageModal';
import { TraineeDetailModal } from './trainees/TraineeDetailModal';
import { useTraineeFilters } from './trainees/hooks/useTraineeFilters';
import { usePagination } from '../../lib/usePagination';
import { PagerBar } from '../../components/ui/PagerBar';

export default function AdminTrainees() {
  const initialized         = useDataStore(s => s.initialized);
  const trainees            = useDataStore(s => s.trainees);
  const packages            = useDataStore(s => s.packages);
  const toggleTraineeStatus = useDataStore(s => s.toggleTraineeStatus);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAssignPkg, setShowAssignPkg] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { search, setSearch, statusFilter, setStatusFilter, filtered, filterTabs } = useTraineeFilters(trainees);

  // Phase X4: pagination — 10 per page
  const { pageItems, page, setPage, totalPages, showingFrom, showingTo, total } = usePagination(filtered, 10);

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

  async function toggleStatus(id: string) {
    await toggleTraineeStatus(id);
  }

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

        <TraineesFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          filterTabs={filterTabs}
          search={search}
          setSearch={setSearch}
        />
      </div>

      <div className="px-5 py-4 max-w-5xl mx-auto">
        <TraineesTable
          trainees={pageItems}
          onSelect={t => setSelectedId(t.id)}
          onToggleStatus={toggleStatus}
        />
        <TraineesCards
          trainees={pageItems}
          onSelect={t => setSelectedId(t.id)}
        />
        <PagerBar
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          showingFrom={showingFrom}
          showingTo={showingTo}
          total={total}
        />
      </div>

      {/* Trainee detail modal */}
      {selected && (
        <TraineeDetailModal
          trainee={selected}
          onClose={() => setSelectedId(null)}
          onToggleStatus={async () => {
            const was = selected.status;
            await toggleStatus(selected.id);
            flash(was === 'active' ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب');
          }}
          onAssignPackageClick={() => setShowAssignPkg(true)}
          onFlash={flash}
        />
      )}

      {/* Sub-modal: Assign Package */}
      {selected && (
        <AssignPackageModal
          open={showAssignPkg}
          onClose={() => setShowAssignPkg(false)}
          trainee={selected}
          packages={packages}
          onFlash={flash}
        />
      )}

      {/* Add trainee modal */}
      <AddTraineeModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onFlash={flash}
        packages={packages}
      />

      {/* Action feedback toast */}
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
