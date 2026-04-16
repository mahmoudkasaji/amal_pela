import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { Flower2, ArrowRight, Mail } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + '/login',
    });
    setLoading(false);
    if (err) {
      setError('حدث خطأ أثناء إرسال رابط إعادة التعيين. حاول مرة أخرى.');
    } else {
      setSent(true);
    }
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }} className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
      <div className="w-full max-w-[380px]">

        {/* Back to login */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 mb-8 transition-all group"
          style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}
        >
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          العودة لتسجيل الدخول
        </button>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: '#ffffff', border: '1px solid #eef0f3', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>

          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
              <Flower2 className="w-4 h-4 text-white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>استوديو سيرين</span>
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '0.3rem' }}>
            إعادة تعيين كلمة المرور
          </h2>
          <p style={{ fontSize: '0.83rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
          </p>

          {sent ? (
            <div className="rounded-xl px-4 py-4 text-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <Mail className="w-8 h-8 mx-auto mb-2" style={{ color: '#16a34a' }} />
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#16a34a', marginBottom: '0.3rem' }}>
                تم الإرسال بنجاح
              </p>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                تحقق من بريدك الإلكتروني واتبع الرابط لإعادة تعيين كلمة المرور.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border text-slate-700 placeholder-slate-300 outline-none transition-all duration-200"
                  style={{
                    fontSize: '0.875rem',
                    background: '#ffffff',
                    borderColor: '#e2e8f0',
                    boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#94a3b8';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(148,163,184,0.13)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.04)';
                  }}
                />
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
                className="w-full py-3 rounded-xl text-white transition-all duration-300"
                style={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  background: '#0f172a',
                  boxShadow: '0 4px 16px rgba(15,23,42,0.2)',
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#1e293b'; }}
                onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#0f172a'; }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جارٍ الإرسال...
                  </span>
                ) : 'إرسال رابط إعادة التعيين'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
