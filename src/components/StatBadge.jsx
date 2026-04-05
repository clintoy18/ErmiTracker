export default function StatBadge({ label, value }) {
  return (
    <div className="rounded-2xl bg-brand-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-brand-600">{label}</p>
      <p className="mt-1 text-xl font-semibold text-brand-900">{value}</p>
    </div>
  );
}
