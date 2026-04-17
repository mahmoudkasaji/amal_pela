import { RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConfigError } from './components/ConfigError';
import { router } from './routes';
import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  // Phase I1.4: إذا Supabase غير مُكوَّن، نعرض شاشة تفسيرية بدل محاولة
  // تركيب AuthProvider الذي سيفشل صامتاً داخل useEffect.
  if (!isSupabaseConfigured) {
    return <ConfigError />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  );
}
