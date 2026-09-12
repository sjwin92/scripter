export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `el_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
