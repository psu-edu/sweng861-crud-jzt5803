'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * Watches the NextAuth session and ensures a JWT token is always stored
 * in localStorage for the centralized apiClient. This is required for
 * users who signed in via Google OAuth (they never pass through
 * /api/auth/login, so no JWT is stored automatically).
 */
function JwtSynchronizer() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') return;

    const existing = localStorage.getItem('jwt');
    if (existing) return; // credentials login already stored a token

    // OAuth user has a session but no JWT — fetch one from the server
    fetch('/api/auth/token')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.token) {
          localStorage.setItem('jwt', data.token);
        }
      })
      .catch(() => {});
  }, [status, session]);

  return null;
}

export default function AuthProvider({ children }) {
  return (
    <SessionProvider>
      <JwtSynchronizer />
      {children}
    </SessionProvider>
  );
}
