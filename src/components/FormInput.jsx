export default function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  min,
  step,
  disabled = false,
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
        disabled={disabled}
        className="rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </label>
  );
}
