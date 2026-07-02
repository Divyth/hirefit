import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur ${className}`}>{children}</div>;
}
