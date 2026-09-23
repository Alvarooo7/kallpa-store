/** Validación y normalización de datos que llegan del cliente. */

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const isEmail = (v: unknown): v is string =>
  typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v);

/**
 * Celular peruano a E.164. Acepta "907 863 118", "907863118", "+51907863118".
 * Devuelve null si no parece un móvil peruano (9 dígitos empezando en 9).
 */
export function toE164Pe(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const d = raw.replace(/\D/g, '');
  const local = d.startsWith('51') && d.length === 11 ? d.slice(2) : d;
  if (!/^9\d{8}$/.test(local)) return null;
  return `+51${local}`;
}

export const clean = (v: unknown, max = 200): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

export const clampQty = (n: unknown, max = 99): number => {
  const q = Math.floor(Number(n));
  return Number.isFinite(q) ? Math.max(1, Math.min(max, q)) : 1;
};

/** Para logs: nunca el correo completo. */
export const maskEmail = (email: string): string => {
  const [u, d] = email.split('@');
  if (!d) return '***';
  return `${u.slice(0, 2)}***@${d}`;
};
