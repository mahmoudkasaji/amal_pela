import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function inputStyle(): React.CSSProperties {
  return {
    width: '100%', padding: '10px 14px', fontSize: '0.85rem',
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
    color: '#334155', outline: 'none',
  };
}
