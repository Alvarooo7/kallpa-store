import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  // Las migraciones se escriben a mano en supabase/migrations y se aplican
  // desde el SQL editor de Supabase o con `supabase db push`.
  strict: true,
} satisfies Config;
