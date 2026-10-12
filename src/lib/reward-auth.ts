import { db } from '@/lib/db';
export async function verifiedAccount(req: Request) {
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!db || !token) return null;
  const { data, error } = await db.auth.getUser(token);
  return !error && data.user?.email_confirmed_at && data.user.email ? data.user : null;
}
