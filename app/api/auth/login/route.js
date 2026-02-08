import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ensureDb, User } from '@/lib/models';
import { signToken } from '@/lib/auth';
import { handleApiError } from '@/lib/apiErrors';
import { authLimiter } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const rateLimitResult = authLimiter(request);
    if (rateLimitResult.limited) {
      return NextResponse.json(
        {
          error: 'Too many authentication attempts',
          message:
            'You have made too many authentication attempts. Please try again later.',
          retryAfter: '15 minutes',
        },
        { status: 429 }
      );
    }

    await ensureDb();
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Username and password are required',
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          error: 'Invalid credentials',
          message: 'This account uses OAuth authentication',
        },
        { status: 401 }
      );
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log(`[Auth] Failed login attempt for user: ${username}`);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = signToken(user);
    console.log(`[Auth] User logged in: ${username}`);

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
