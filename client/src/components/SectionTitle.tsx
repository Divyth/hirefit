export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-black tracking-tight text-slate-950">{title}</h2>
      {subtitle ? <p className="mt-1 max-w-2xl text-sm text-slate-600">{subtitle}</p> : null}
    </div>
  );
}
