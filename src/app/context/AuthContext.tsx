import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { AuthUser } from '../data/types';
import { supabase } from '../lib/supabase';
import { resolveLoginEmail } from '../api/rpc';
import { useDataStore } from '../store/useDataStore';

interface LoginResult {
  ok: boolean;
  reason?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  /** true أثناء فحص الجلسة الأولى عند تحميل التطبيق. */
  loading: boolean;
  /** خطأ في تحميل بيانات المستخدم بعد مصادقة ناجحة. */
  authError: string | null;
  /** يقبل username أو email. */
  login: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** يقرأ profile الكامل من DB ويحوِّله إلى AuthUser للواجهة. */
async function loadAuthUser(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, name, email, phone, username')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    role: data.role,
    username: data.username ?? '',
    email: data.email,
    phone: data.phone ?? '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  /** تحميل بيانات المستخدم مع حماية من التنفيذ المزدوج. */
  async function safeLoadAuthUser(userId: string) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const authUser = await loadAuthUser(userId);
      if (authUser) {
        setUser(authUser);
        setAuthError(null);
        useDataStore.getState().initialize().catch(console.error);
      } else {
        // مصادقة ناجحة لكن فشل تحميل الملف الشخصي
        setAuthError('تعذّر تحميل بيانات الملف الشخصي. يرجى المحاولة مرة أخرى.');
      }
    } catch (err) {
      console.error('Failed to load auth user:', err);
      setAuthError('حدث خطأ أثناء تحميل بيانات المستخدم.');
    } finally {
      loadingRef.current = false;
    }
  }

  useEffect(() => {
    // 1) Load the existing session on mount (Supabase persists it in localStorage)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await safeLoadAuthUser(session.user.id);
      }
      setLoading(false);
    });

    // 2) Listen to auth state changes (login/logout from other tabs, refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await safeLoadAuthUser(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAuthError(null);
        useDataStore.getState().reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(identifier: string, password: string): Promise<LoginResult> {
    let email = identifier.trim();

    // إذا ليست email، نحلّها من username
    // resolve_login_email تُرجع دائماً قيمة (بريد وهمي إن لم يُوجد) لمنع تعداد المستخدمين
    if (!email.includes('@')) {
      const resolved = await resolveLoginEmail(email);
      if (resolved) email = resolved;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { ok: false, reason: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }
    // onAuthStateChange سيضبط user و يبدأ initialize
    return { ok: true };
  }

  async function logout() {
    await supabase.auth.signOut();
    // onAuthStateChange سيُصفِّي user والـ store
  }

  if (authError) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-xl font-bold text-gray-900 mb-2">خطأ في المصادقة</h1>
          <p className="text-gray-500 mb-4 text-sm">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
