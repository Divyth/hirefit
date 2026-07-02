import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
};

const base = 'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700',
  secondary: 'bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100'
};

export function Button({ children, className = '', variant = 'primary', ...props }: Props) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
