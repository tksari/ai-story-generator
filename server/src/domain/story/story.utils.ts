export function getConfigValue<T = any>(story: Record<string, any>, path: string): T | null {
  const [rootKey, innerKey] = path.split(".");
  return story?.[rootKey]?.[innerKey] ?? null;
}

export function applySettingsPatch(current: any, patch: any): any {
  if (patch === null || patch === undefined) return current;
  if ((current === null || current === undefined) && typeof patch === "object") return { ...patch };

  const updated = { ...current };
  for (const key in patch) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      const value = patch[key];
      if (value === null) {
        updated[key] = null;
      } else if (typeof value === "object" && !Array.isArray(value) && value !== null) {
        const currentValue = updated[key];
        updated[key] =
          typeof currentValue === "object" && !Array.isArray(currentValue) && currentValue !== null
            ? applySettingsPatch(currentValue, value)
            : { ...value };
      } else {
        updated[key] = value;
      }
    }
  }
  return updated;
}
