import { Flower2, Phone, Mail, MapPin, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Flower2 className="w-4 h-4 text-white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>استوديو سيرين</span>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.85, color: '#94a3b8', maxWidth: '28ch' }}>
              مركز بيلاتز متخصص يجمع بين الاحترافية والهدوء لمنحك تجربة تدريبية فريدة.
            </p>
            <div className="flex gap-2 mt-6">
              {[
                { Icon: Instagram, label: 'Instagram' },
                { Icon: Twitter,   label: 'Twitter'   },
              ].map(({ Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f1f5f9', letterSpacing: '0.05em' }} className="mb-4">
              روابط
            </h4>
            <div className="space-y-2.5">
              {[
                { label: 'تسجيل الدخول', href: '/login' },
                { label: 'الجلسات',       href: '#sessions' },
                { label: 'الباقات',       href: '#packages' },
                { label: 'عن المركز',     href: '#about' },
              ].map(l => (
                <a
                  key={l.label}
                  href={l.href}
                  style={{ fontSize: '0.83rem', display: 'block', color: '#64748b' }}
                  className="hover:text-slate-300 transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f1f5f9', letterSpacing: '0.05em' }} className="mb-4">
              تواصل
            </h4>
            <div className="space-y-3">
              {[
                { Icon: Phone, text: '+966 50 000 0000' },
                { Icon: Mail,  text: 'info@serine.sa'   },
                { Icon: MapPin,text: 'الرياض، السعودية' },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-7">
          <p style={{ fontSize: '0.78rem', color: '#475569' }}>
            © ٢٠٢٦ استوديو سيرين. جميع الحقوق محفوظة.
          </p>
          <p style={{ fontSize: '0.78rem', color: '#334155' }}>
            صُنع بعناية لصحتك
          </p>
        </div>
      </div>
    </footer>
  );
}
