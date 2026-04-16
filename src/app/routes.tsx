import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';

// Wrapper components — تُنفَّذ داخل React tree (داخل AuthProvider)
// بدل `element: <ProtectedRoute />` الذي يُنشئ JSX عند تحميل الملف (خارج AuthProvider)
// كل guard ملفوف بـ RouteErrorBoundary ليحصر أي خطأ داخل هذا الـ role فقط.
function TraineeGuard() {
  return <RouteErrorBoundary scope="trainee"><ProtectedRoute allow="trainee" /></RouteErrorBoundary>;
}
function TrainerGuard() {
  return <RouteErrorBoundary scope="trainer"><ProtectedRoute allow="trainer" /></RouteErrorBoundary>;
}
function AdminGuard() {
  return <RouteErrorBoundary scope="admin"><ProtectedRoute allow="admin" /></RouteErrorBoundary>;
}

// Layouts (eager — shared chrome loaded once)
import TraineeLayout from './layouts/TraineeLayout';
import TrainerLayout from './layouts/TrainerLayout';
import AdminLayout from './layouts/AdminLayout';

// Lazy-loaded page components
const TraineeDashboard    = lazy(() => import('./pages/trainee/Dashboard'));
const TraineeSessions     = lazy(() => import('./pages/trainee/Sessions'));
const TraineeBookings     = lazy(() => import('./pages/trainee/Bookings'));
const TraineeSubscription = lazy(() => import('./pages/trainee/Subscription'));
const TraineeProfile      = lazy(() => import('./pages/trainee/Profile'));

const TrainerDashboard    = lazy(() => import('./pages/trainer/Dashboard'));
const TrainerSchedule     = lazy(() => import('./pages/trainer/Schedule'));
const TrainerTraineesList = lazy(() => import('./pages/trainer/TraineesList'));
const TrainerAttendance   = lazy(() => import('./pages/trainer/Attendance'));
const TrainerProfile      = lazy(() => import('./pages/trainer/Profile'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminTrainees  = lazy(() => import('./pages/admin/Trainees'));
const AdminTrainers  = lazy(() => import('./pages/admin/Trainers'));
const AdminSessions  = lazy(() => import('./pages/admin/Sessions'));
const AdminPackages  = lazy(() => import('./pages/admin/Packages'));
const AdminBookings  = lazy(() => import('./pages/admin/Bookings'));
const AdminReports   = lazy(() => import('./pages/admin/Reports'));
const AdminSettings  = lazy(() => import('./pages/admin/Settings'));
const ResetPassword  = lazy(() => import('./pages/ResetPasswordPage'));

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f8fa' }}>
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-4 mx-auto mb-3 animate-spin" style={{ borderColor: '#e2e8f0', borderTopColor: '#0f172a' }} />
        <p style={{ fontSize: '0.83rem', color: '#94a3b8', fontFamily: "'Cairo', sans-serif" }}>جاري التحميل...</p>
      </div>
    </div>
  );
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-50">
      <div className="text-center">
        <p className="text-rose-400" style={{ fontSize: '4rem', fontWeight: 700 }}>404</p>
        <p className="text-slate-500">الصفحة غير موجودة</p>
        <a href="/" className="text-rose-500 underline mt-2 inline-block" style={{ fontSize: '0.875rem' }}>العودة للرئيسية</a>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LandingPage,
  },
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/reset-password',
    element: <S><ResetPassword /></S>,
  },
  {
    path: '/trainee',
    Component: TraineeGuard,
    children: [
      {
        path: '',
        Component: TraineeLayout,
        children: [
          { index: true, element: <S><TraineeDashboard /></S> },
          { path: 'sessions', element: <S><TraineeSessions /></S> },
          { path: 'bookings', element: <S><TraineeBookings /></S> },
          { path: 'subscription', element: <S><TraineeSubscription /></S> },
          { path: 'profile', element: <S><TraineeProfile /></S> },
        ],
      },
    ],
  },
  {
    path: '/trainer',
    Component: TrainerGuard,
    children: [
      {
        path: '',
        Component: TrainerLayout,
        children: [
          { index: true, element: <S><TrainerDashboard /></S> },
          { path: 'schedule', element: <S><TrainerSchedule /></S> },
          { path: 'trainees', element: <S><TrainerTraineesList /></S> },
          { path: 'attendance', element: <S><TrainerAttendance /></S> },
          { path: 'profile', element: <S><TrainerProfile /></S> },
        ],
      },
    ],
  },
  {
    path: '/admin',
    Component: AdminGuard,
    children: [
      {
        path: '',
        Component: AdminLayout,
        children: [
          { index: true, element: <S><AdminDashboard /></S> },
          { path: 'trainees', element: <S><AdminTrainees /></S> },
          { path: 'trainers', element: <S><AdminTrainers /></S> },
          { path: 'sessions', element: <S><AdminSessions /></S> },
          { path: 'packages', element: <S><AdminPackages /></S> },
          { path: 'bookings', element: <S><AdminBookings /></S> },
          { path: 'reports', element: <S><AdminReports /></S> },
          { path: 'settings', element: <S><AdminSettings /></S> },
        ],
      },
    ],
  },
  {
    path: '*',
    Component: NotFound,
  },
]);
