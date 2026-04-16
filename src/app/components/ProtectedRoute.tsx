import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../data/types';

interface Props {
  /** الأدوار المسموح لها بدخول هذا المسار. */
  allow: UserRole;
}

/**
 * حارس المسارات:
 * - أثناء فحص الجلسة: شاشة تحميل بسيطة.
 * - بدون مستخدم → /login
 * - مستخدم بدور مختلف → إعادة توجيه إلى لوحته الصحيحة
 */
export default function ProtectedRoute({ allow }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}
      >
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-full border-4 mx-auto mb-3 animate-spin"
            style={{ borderColor: '#e2e8f0', borderTopColor: '#0f172a' }}
          />
          <p style={{ fontSize: '0.83rem', color: '#94a3b8' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allow) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <Outlet />;
}
