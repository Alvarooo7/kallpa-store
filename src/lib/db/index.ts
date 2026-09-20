import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de servidor con la service key: salta RLS, por eso NUNCA debe
 * importarse desde un componente de cliente ni llevar prefijo NEXT_PUBLIC_.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const db =
  url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;

/** true cuando hay base configurada. Las rutas lo consultan antes de escribir. */
export const hasDb = db !== null;
