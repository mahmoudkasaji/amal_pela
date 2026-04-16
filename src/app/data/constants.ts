/** Shared constants — DRY across admin / trainer / trainee pages. */

export const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  confirmed:             { label: 'مؤكد',         bg: '#eff6ff', color: '#2563eb' },
  attended:              { label: 'حضر',           bg: '#f0fdf4', color: '#16a34a' },
  absent:                { label: 'غياب',          bg: '#f8fafc', color: '#94a3b8' },
  cancelled_with_refund: { label: 'ملغى مسترد',    bg: '#fffbeb', color: '#d97706' },
  cancelled_no_refund:   { label: 'إلغاء متأخر',   bg: '#fef2f2', color: '#dc2626' },
  waitlist:              { label: 'انتظار',         bg: '#faf5ff', color: '#7c3aed' },
};

export const LEVEL_MAP: Record<string, string> = {
  all:          'للجميع',
  beginner:     'مبتدئة',
  intermediate: 'متوسطة',
  advanced:     'متقدمة',
};

export const LEVEL_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  all:          { bg: '#f8fafc', color: '#64748b',  border: '#e2e8f0' },
  beginner:     { bg: '#f0fdf4', color: '#16a34a',  border: '#bbf7d0' },
  intermediate: { bg: '#eff6ff', color: '#2563eb',  border: '#bfdbfe' },
  advanced:     { bg: '#faf5ff', color: '#7c3aed',  border: '#e9d5ff' },
};
