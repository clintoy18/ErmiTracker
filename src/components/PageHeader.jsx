export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-card">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-semibold text-brand-900">{title}</h2>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
