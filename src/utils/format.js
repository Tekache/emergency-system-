export function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function passwordError(p) {
  if (p.length < 8) return "Password must be at least 8 characters";
  if (p.length > 72) return "Password must be at most 72 characters";
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return "Password must contain a letter and a number";
  return "";
}

export function eventLabel(u) {
  if (u.kind === "created") return "Report submitted";
  if (u.kind === "assignment") return "Responder assigned";
  if (u.kind === "note") return "Response note";
  const f = (s) => (s || "").replace("_", " ");
  return `Status: ${u.from_status ? f(u.from_status) + " to " : ""}${f(u.to_status)}`;
}
