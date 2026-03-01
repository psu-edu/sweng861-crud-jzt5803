import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ensureDb, User } from '@/lib/models';
import { signToken } from '@/lib/auth';

/**
 * GET /api/auth/token
 *
 * Exchanges an active NextAuth session for a JWT Bearer token.
 * Used by OAuth (Google) users who don't go through /api/auth/login
 * and therefore have no JWT stored in localStorage.
 *
 * Requires: valid NextAuth session cookie.
 * Returns: { token: "<jwt>" }
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureDb();
  const user = await User.findByPk(session.user.id);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const token = signToken({
    id: user.id,
    username: user.username || user.email,
    role: user.role,
  });

  return NextResponse.json({ token });
}
