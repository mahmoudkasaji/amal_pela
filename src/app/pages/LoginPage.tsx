import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Flower2, ArrowRight, LayoutDashboard, Dumbbell, Sparkles } from 'lucide-react';

// ─── Role Definitions ───────────────────────────────────────────────────────
const ROLES = [
  {
    key: 'admin',
    label: 'مدير',
    icon: LayoutDashboard,
    image: 'https://images.unsplash.com/photo-1761971975724-31001b4de0bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
    overlay: 'rgba(15, 23, 42, 0.72)',
    accent: '#64748b',
    accentLight: '#f1f5f9',
    accentText: '#475569',
    badge: 'لوحة الإدارة',
    headline: 'مرحباً بك في\nمركز القيادة',
    sub: 'إدارة المركز، المدربات، والمتدربات من مكان واحد بكفاءة تامة.',
    tag: 'Admin Dashboard',
    cardBorder: '#e2e8f0',
    btnBg: '#0f172a',
    btnHover: '#1e293b',
    inputFocus: '#94a3b8',
  },
  {
    key: 'trainer',
    label: 'مدربة',
    icon: Dumbbell,
    image: 'https://images.unsplash.com/photo-1756367201409-8a05f0d9aed4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
    overlay: 'rgba(15, 30, 25, 0.65)',
    accent: '#6b7e74',
    accentLight: '#f0f4f2',
    accentText: '#4a6358',
    badge: 'واجهة المدربة',
    headline: 'أهلاً بكِ\nمدربتنا المتميزة',
    sub: 'تابعي جلساتك، متدرباتك وجدولك اليومي بكل سهولة ويسر.',
    tag: 'Trainer Portal',
    cardBorder: '#e2e8e4',
    btnBg: '#2d4a3e',
    btnHover: '#3a5f51',
    inputFocus: '#8aad9e',
  },
  {
    key: 'trainee',
    label: 'متدربة',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1676496962536-d8ef110ff6f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
    overlay: 'rgba(30, 20, 35, 0.60)',
    accent: '#8b7e9e',
    accentLight: '#f4f2f7',
    accentText: '#6b5f7e',
    badge: 'بوابة المتدربة',
    headline: 'رحلتك نحو\nالتوازن تبدأ هنا',
    sub: 'احجزي جلساتك، تابعي تقدمك واستمتعي بتجربتك في استوديو سيرين.',
    tag: 'Trainee Space',
    cardBorder: '#e8e4ed',
    btnBg: '#4a3d5e',
    btnHover: '#5c4d72',
    inputFocus: '#b0a0c8',
  },
] as const;

type RoleKey = typeof ROLES[number]['key'];

// ─── Component ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<RoleKey>('trainee');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'trainer') navigate('/trainer', { replace: true });
      else navigate('/trainee', { replace: true });
    }
  }, [user]);

  const role = ROLES.find(r => r.key === selectedRole)!;

  function handleRoleSelect(r: typeof ROLES[number]) {
    if (r.key === selectedRole) return;
    setTransitioning(true);
    setImgLoaded(false);
    setTimeout(() => {
      setSelectedRole(r.key);
      setError('');
      setTransitioning(false);
    }, 220);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);
    if (!result.ok) setError(result.reason ?? 'اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }} className="min-h-screen flex overflow-hidden bg-white">

      {/* ── Left Panel: Dynamic Visual ── */}
      <div className="hidden lg:flex relative flex-1 overflow-hidden">
        {/* Background Image */}
        <img
          key={role.image}
          src={role.image}
          alt=""
          loading="eager"
          decoding="async"
          // @ts-expect-error fetchpriority is a valid HTML attr not yet in React types
          fetchpriority="high"
          onLoad={() => setImgLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
          style={{ opacity: imgLoaded && !transitioning ? 1 : 0 }}
        />

        {/* Dark overlay */}
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{ background: role.overlay }}
        />

        {/* Subtle grain texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Top: Logo + Back */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                <Flower2 className="w-4 h-4 text-white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                استوديو سيرين
              </span>
            </div>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
              }}
            >
              {role.tag}
            </span>
          </div>

          {/* Center: Main content */}
          <div
            className="transition-all duration-500"
            style={{ opacity: transitioning ? 0 : 1, transform: transitioning ? 'translateY(12px)' : 'translateY(0)' }}
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <role.icon className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.7)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>
                {role.badge}
              </span>
            </div>

            {/* Headline */}
            <h1
              className="text-white"
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
                fontWeight: 800,
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                whiteSpace: 'pre-line',
              }}
            >
              {role.headline}
            </h1>

            {/* Separator */}
            <div className="flex items-center gap-3 my-6">
              <div className="h-px w-10" style={{ background: 'rgba(255,255,255,0.3)' }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.4)' }} />
            </div>

            {/* Sub */}
            <p style={{ fontSize: '0.92rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.6)', maxWidth: '38ch' }}>
              {role.sub}
            </p>
          </div>

          {/* Bottom: Role Switcher Dots */}
          <div className="flex items-center gap-2">
            {ROLES.map(r => (
              <button
                key={r.key}
                onClick={() => handleRoleSelect(r)}
                className="transition-all duration-300"
                style={{
                  width: r.key === selectedRole ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  background: r.key === selectedRole ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
      </div>

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
          <div
            className="flex gap-1.5 p-1 rounded-xl mb-7"
            style={{ background: '#f1f5f9' }}
          >
            {ROLES.map(r => {
              const isActive = r.key === selectedRole;
              return (
                <button
                  key={r.key}
                  onClick={() => handleRoleSelect(r)}
                  className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg transition-all duration-250"
                  style={{
                    background: isActive ? '#ffffff' : 'transparent',
                    boxShadow: isActive ? '0 1px 6px rgba(15,23,42,0.08)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <r.icon
                    className="w-4 h-4 transition-all duration-250"
                    style={{ color: isActive ? role.btnBg : '#94a3b8' }}
                  />
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#0f172a' : '#94a3b8',
                      transition: 'all 0.25s',
                    }}
                  >
                    {r.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Form */}
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
