'use client';

/**
 * Capa de eventos. Los nombres son los estándar de Meta, así que al pegar el
 * pixel empiezan a viajar sin tocar los componentes. Para la Conversions API,
 * reenvía el mismo evento desde /api con el token del servidor.
 */
type FB = (...args: unknown[]) => void;
declare global { interface Window { fbq?: FB; vendemiaEvents?: unknown[] } }

export function track(name: string, data: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  window.vendemiaEvents ??= [];
  window.vendemiaEvents.push({ name, data, ts: new Date().toISOString() });
  window.fbq?.('track', name, data);
  if (process.env.NODE_ENV === 'development') console.log('[evento]', name, data);
}
