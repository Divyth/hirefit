import type { TextareaHTMLAttributes } from 'react';

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-36 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 ${className}`}
      {...props}
    />
  );
}
