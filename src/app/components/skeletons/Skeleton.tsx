/**
 * Reusable skeleton primitives for loading states.
 * Replaces the plain spinner with content-shaped placeholders.
 */
import type { CSSProperties } from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  rounded?: number | string;
  className?: string;
  style?: CSSProperties;
}

/** Single shimmer bar. */
export function Skeleton({ width = '100%', height = 16, rounded = 6, className = '', style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse ${className}`}
      style={{
        width,
        height,
        borderRadius: rounded,
        background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)',
        backgroundSize: '200% 100%',
        ...style,
      }}
    />
  );
}

/** KPI card placeholder (for dashboards). */
export function SkeletonKpiCard() {
  return (
    <div className="rounded-2xl p-5 bg-white border border-slate-200">
      <Skeleton width={80} height={12} />
      <div style={{ height: 12 }} />
      <Skeleton width={120} height={28} />
      <div style={{ height: 10 }} />
      <Skeleton width="60%" height={10} />
    </div>
  );
}

/** Table row placeholder. */
export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} width={`${100 / columns}%`} height={14} />
      ))}
    </div>
  );
}

/** List of KPI cards + rows — common dashboard layout. */
export function SkeletonDashboard() {
  return (
    <div dir="rtl" className="p-6" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKpiCard key={i} />
        ))}
      </div>
      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <Skeleton width={180} height={16} />
        <div style={{ height: 20 }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>
    </div>
  );
}

/** Simple full-screen loading fallback (replaces spinner). */
export function SkeletonPage() {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}
    >
      <div className="text-center">
        <div
          className="w-8 h-8 rounded-full border-4 mx-auto mb-3 animate-spin"
          style={{ borderColor: '#e2e8f0', borderTopColor: '#0f172a' }}
        />
        <p style={{ fontSize: '0.83rem', color: '#94a3b8' }}>جاري التحميل...</p>
      </div>
    </div>
  );
}
