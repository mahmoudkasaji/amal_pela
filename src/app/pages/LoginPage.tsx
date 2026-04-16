import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Flower2, ArrowRight } from 'lucide-react';
import { ROLES, type Role, type RoleKey } from './login/roles.config';
import VisualPanel from './login/VisualPanel';
import RoleSelector from './login/RoleSelector';
import LoginForm from './login/LoginForm';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<RoleKey>('trainee');
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'trainer') navigate('/trainer', { replace: true });
      else navigate('/trainee', { replace: true });
    }
  }, [user]);

  const role = ROLES.find(r => r.key === selectedRole)!;

  function handleRoleSelect(r: Role) {
    if (r.key === selectedRole) return;
    setTransitioning(true);
    setTimeout(() => {
      setSelectedRole(r.key);
      setTransitioning(false);
    }, 220);
  }

  async function handleLogin(username: string, password: string) {
    return await login(username, password);
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }} className="min-h-screen flex overflow-hidden bg-white">

      {/* ── Left Panel: Dynamic Visual ── */}
      <VisualPanel
        role={role}
        selectedRole={selectedRole}
        transitioning={transitioning}
        onSelectRole={handleRoleSelect}
      />

      {/* ── Right Panel: Login Form ── */}
      <div
        className="flex flex-col justify-center w-full lg:w-[420px] xl:w-[460px] flex-shrink-0 px-8 py-10 overflow-y-auto"
        style={{ background: '#fafafa' }}
      >
        <div className="w-full max-w-[340px] mx-auto">

          {/* Back to home */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 mb-10 transition-all group"
            style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}
          >
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            الرئيسية
          </button>

          {/* Header */}
          <div className="mb-8">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center">
                <Flower2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>استوديو سيرين</span>
            </div>

            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8' }} className="uppercase mb-2">
              تسجيل الدخول
            </p>
            <h2
              style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', lineHeight: 1.2 }}
              className="transition-all duration-400"
            >
              {selectedRole === 'admin' ? 'مرحباً بك' : selectedRole === 'trainer' ? 'أهلاً بكِ' : 'ابدئي رحلتك'}
            </h2>
            <p style={{ fontSize: '0.83rem', color: '#94a3b8', marginTop: '0.4rem' }}>
              {selectedRole === 'admin'
                ? 'ادخل إلى لوحة الإدارة'
                : selectedRole === 'trainer'
                ? 'ادخلي إلى واجهتك المهنية'
                : 'ادخلي إلى مساحتك الخاصة'}
            </p>
          </div>

          {/* Role Selector */}
          <RoleSelector
            selectedRole={selectedRole}
            onSelect={handleRoleSelect}
            role={role}
          />

          {/* Form + Forgot password */}
          <LoginForm role={role} onSubmit={handleLogin} />

          {/* Footer dots */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-center gap-2">
              {ROLES.map(r => (
                <div
                  key={r.key}
                  className="transition-all duration-300"
                  style={{
                    width: r.key === selectedRole ? '20px' : '6px',
                    height: '6px',
                    borderRadius: '9999px',
                    background: r.key === selectedRole ? role.btnBg : '#e2e8f0',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
