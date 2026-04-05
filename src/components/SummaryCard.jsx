export default function SummaryCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-brand-900">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}
