import { ROLES, type Role, type RoleKey } from './roles.config';

interface RoleSelectorProps {
  selectedRole: RoleKey;
  onSelect: (r: Role) => void;
  role: Role;
}

export default function RoleSelector({ selectedRole, onSelect, role }: RoleSelectorProps) {
  return (
    <div
      className="flex gap-1.5 p-1 rounded-xl mb-7"
      style={{ background: '#f1f5f9' }}
    >
      {ROLES.map(r => {
        const isActive = r.key === selectedRole;
        return (
          <button
            key={r.key}
            onClick={() => onSelect(r)}
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
  );
}
