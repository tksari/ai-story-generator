export function formatJSON(value: any, fallback = "// Invalid JSON"): string {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return fallback;
  }
}
