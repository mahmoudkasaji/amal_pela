import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Flower2, Menu, X } from 'lucide-react';
import { navLinks } from './data';

export default function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center pt-5 px-6 pointer-events-none">
      <div
        className="pointer-events-auto w-full transition-all duration-500"
        style={{ maxWidth: scrolled ? '780px' : '1100px' }}
      >
        <div
          className="flex items-center justify-between px-5 h-14 transition-all duration-500"
          style={
            scrolled
              ? {
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.55)',
                  borderRadius: '9999px',
                  boxShadow: '0 8px 32px rgba(15,10,20,0.10), 0 1px 0 rgba(255,255,255,0.8) inset',
                }
              : {
                  background: 'transparent',
                  borderRadius: '9999px',
                }
          }
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500"
              style={{
                background: scrolled ? '#0f172a' : 'rgba(255,255,255,0.15)',
                border: scrolled ? 'none' : '1px solid rgba(255,255,255,0.3)',
                backdropFilter: scrolled ? 'none' : 'blur(8px)',
              }}
            >
              <Flower2 className="w-4 h-4 text-white" />
            </div>
            <span
              className="transition-colors duration-500"
              style={{
                fontWeight: 700,
                fontSize: '0.95rem',
                letterSpacing: '-0.01em',
                color: scrolled ? '#0f172a' : 'rgba(255,255,255,0.92)',
              }}
            >
              استوديو سيرين
            </span>
          </div>

          {/* Desktop nav — centered */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <a
                key={l.label}
                href={l.href}
                className="px-4 py-1.5 rounded-full transition-all duration-300"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: scrolled ? '#475569' : 'rgba(255,255,255,0.75)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = scrolled
                    ? 'rgba(15,23,42,0.06)'
                    : 'rgba(255,255,255,0.12)';
                  (e.currentTarget as HTMLElement).style.color = scrolled
                    ? '#0f172a'
                    : 'rgba(255,255,255,1)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = scrolled
                    ? '#475569'
                    : 'rgba(255,255,255,0.75)';
                }}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTA + Mobile toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="hidden md:inline-flex items-center px-5 py-2 rounded-full transition-all duration-300"
              style={{
                fontSize: '0.82rem',
                fontWeight: 650,
                background: scrolled ? '#0f172a' : 'rgba(255,255,255,0.18)',
                color: 'rgba(255,255,255,0.95)',
                border: scrolled ? 'none' : '1px solid rgba(255,255,255,0.3)',
                backdropFilter: scrolled ? 'none' : 'blur(8px)',
                letterSpacing: '0.005em',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = scrolled
                  ? '#1e293b'
                  : 'rgba(255,255,255,0.28)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = scrolled
                  ? '#0f172a'
                  : 'rgba(255,255,255,0.18)';
              }}
            >
              تسجيل الدخول
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                background: scrolled ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.15)',
                border: scrolled ? '1px solid rgba(15,23,42,0.08)' : '1px solid rgba(255,255,255,0.3)',
              }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen
                ? <X className="w-4 h-4" style={{ color: scrolled ? '#0f172a' : 'white' }} />
                : <Menu className="w-4 h-4" style={{ color: scrolled ? '#0f172a' : 'white' }} />
              }
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            className="md:hidden mt-2 mx-2 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 12px 40px rgba(15,10,20,0.12)',
            }}
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {navLinks.map(l => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                  style={{ fontSize: '0.9rem', fontWeight: 500 }}
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-2 pb-1 border-t border-slate-100 mt-1">
                <button
                  onClick={() => { navigate('/login'); setMenuOpen(false); }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white transition-all"
                  style={{ fontSize: '0.875rem', fontWeight: 600 }}
                >
                  تسجيل الدخول
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
