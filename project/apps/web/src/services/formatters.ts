export function shortHash(value?: string | null, head = 10, tail = 8): string {
  if (!value) return "—";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  return iso.replace("T", " ").slice(0, 16);
}
