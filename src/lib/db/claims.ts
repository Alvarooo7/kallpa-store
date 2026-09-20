import { db } from './index';

export type NewClaim = {
  kind: 'reclamo' | 'queja';
  name: string; docId: string; email: string; phone: string;
  address?: string; guardian?: string;
  product: string; orderNumber?: string; amountCents?: number;
  detail: string; request: string;
};

/** 15 días hábiles, sin contar sábados ni domingos. */
export function dueInBusinessDays(days = 15, from = new Date()): Date {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) left--;
  }
  return d;
}

/**
 * Registra la hoja con numeración CORRELATIVA (función `create_claim`,
 * supabase/migrations/0003). No es una preferencia técnica: el D.S.
 * 011-2011-PCM lo exige, igual que conservar el registro.
 */
export async function createClaim(input: NewClaim) {
  if (!db) throw new Error('Supabase no está configurado');

  const { data, error } = await db.rpc('create_claim', {
    p: {
      kind: input.kind,
      name: input.name,
      doc_id: input.docId,
      email: input.email,
      phone: input.phone,
      address: input.address ?? null,
      guardian: input.guardian ?? null,
      product: input.product,
      order_number: input.orderNumber ?? null,
      amount_cents: input.amountCents ?? null,
      detail: input.detail,
      request: input.request,
      due_at: dueInBusinessDays(15).toISOString(),
    },
  });
  if (error) throw new Error(error.message);

  const r = data as { id: number; sheet_number: string; due_at: string };
  return { id: r.id, sheetNumber: r.sheet_number, dueAt: new Date(r.due_at) };
}
