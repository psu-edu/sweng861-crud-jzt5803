import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ensureDb, User } from '@/lib/models';
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
          details: [{ message: 'Username and password are required' }],
        },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [
            { message: 'Username must be between 3 and 50 characters' },
          ],
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ message: 'Password must be at least 6 characters' }],
        },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Username already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      username,
      password: hashedPassword,
      role: 'user',
    });

    console.log(`[Auth] New user registered: ${username}`);

    return NextResponse.json(
      { message: 'User registered successfully', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
