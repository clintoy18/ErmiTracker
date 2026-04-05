export default function FormSelect({ label, name, value, onChange, options, required }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-brand-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
