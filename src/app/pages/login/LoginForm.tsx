import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import type { Role } from './roles.config';

interface LoginFormProps {
  role: Role;
  onSubmit: (username: string, password: string) => Promise<{ ok: boolean; reason?: string }>;
}

export default function LoginForm({ role, onSubmit }: LoginFormProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear error when role changes (preserves original behavior)
  useEffect(() => {
    setError('');
  }, [role.key]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await onSubmit(username.trim(), password);
    setLoading(false);
    if (!result.ok) setError(result.reason ?? 'اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
            اسم المستخدم
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="اسم المستخدم"
            required
            className="w-full px-4 py-2.5 rounded-xl border text-slate-700 placeholder-slate-300 outline-none transition-all duration-200"
            style={{
              fontSize: '0.875rem',
              background: '#ffffff',
              borderColor: '#e2e8f0',
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = role.inputFocus;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${role.inputFocus}22`;
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.04)';
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
            كلمة المرور
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              required
              className="w-full px-4 py-2.5 pl-10 rounded-xl border text-slate-700 placeholder-slate-300 outline-none transition-all duration-200"
              style={{
                fontSize: '0.875rem',
                background: '#ffffff',
                borderColor: '#e2e8f0',
                boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = role.inputFocus;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${role.inputFocus}22`;
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.04)';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: '#cbd5e1' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = role.accentText}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#cbd5e1'}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div
            className="px-4 py-2.5 rounded-xl"
            style={{ background: '#fef2f2', border: '1px solid #fecaca', fontSize: '0.8rem', color: '#ef4444' }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-white transition-all duration-300 mt-2"
          style={{
            fontWeight: 700,
            fontSize: '0.875rem',
            background: role.btnBg,
            boxShadow: `0 4px 16px ${role.btnBg}33`,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = role.btnHover; }}
          onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = role.btnBg; }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              جارٍ الدخول...
            </span>
          ) : 'دخول'}
        </button>
      </form>

      {/* Forgot password */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => navigate('/reset-password')}
          style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
          className="hover:underline transition-all"
        >
          نسيت كلمة المرور؟
        </button>
      </div>
    </>
  );
}
