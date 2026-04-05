export default function SectionCard({ title, subtitle, children }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}
