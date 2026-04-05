export function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) {
    return "No date";
  }

  const date = value?.toDate ? value.toDate() : new Date(value);
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function toIsoDate(value = new Date()) {
  return new Date(value).toISOString().slice(0, 10);
}
