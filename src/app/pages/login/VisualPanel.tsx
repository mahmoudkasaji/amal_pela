import { useState, useEffect } from 'react';
import { Flower2 } from 'lucide-react';
import { ROLES, type Role, type RoleKey } from './roles.config';

interface VisualPanelProps {
  role: Role;
  selectedRole: RoleKey;
  transitioning: boolean;
  onSelectRole: (r: Role) => void;
}

export default function VisualPanel({ role, selectedRole, transitioning, onSelectRole }: VisualPanelProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
  }, [role.image]);

  return (
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
              onClick={() => onSelectRole(r)}
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
  );
}
