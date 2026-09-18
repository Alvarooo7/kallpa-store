import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Supabase detrás de Supavisor en modo transacción (puerto 6543).
 * `prepare: false` es obligatorio ahí: el pooler no mantiene sentencias
 * preparadas entre conexiones.
 */
const url = process.env.DATABASE_URL;

const client = url
  ? postgres(url, { prepare: false, max: 1, idle_timeout: 20 })
  : null;

export const db = client ? drizzle(client, { schema }) : null;

/** true cuando hay base configurada. Las rutas lo consultan antes de escribir. */
export const hasDb = db !== null;

export { schema };
