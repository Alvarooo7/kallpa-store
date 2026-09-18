import { sql } from 'drizzle-orm';
import { db } from './index';
import { claimEvents, claims } from './schema';

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
 * Registra la hoja con numeración CORRELATIVA. No es una preferencia técnica:
 * el D.S. 011-2011-PCM lo exige, igual que conservar el registro.
 */
export async function createClaim(input: NewClaim) {
  if (!db) throw new Error('DATABASE_URL no está configurada');

  return db.transaction(async (tx) => {
    const [{ sheet }] = await tx.execute<{ sheet: string }>(
      sql`select 'LR-' || to_char(now() at time zone 'America/Lima', 'YYYY') || '-' ||
                 lpad(nextval('claim_seq')::text, 6, '0') as sheet`,
    );

    const [claim] = await tx
      .insert(claims)
      .values({ ...input, sheetNumber: sheet, dueAt: dueInBusinessDays(15) })
      .returning({ id: claims.id, sheetNumber: claims.sheetNumber, dueAt: claims.dueAt });

    await tx.insert(claimEvents).values({ claimId: claim.id, event: 'recibido' });

    return claim;
  });
}
