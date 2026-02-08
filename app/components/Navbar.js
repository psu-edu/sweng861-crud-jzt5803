'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { getJwtUser } from '@/lib/apiClient';

export default function Navbar() {
  const { data: session } = useSession();
  const [jwtUser, setJwtUser] = useState(null);

  useEffect(() => {
    if (!session) {
      setJwtUser(getJwtUser());
    }
  }, [session]);

  const currentUser = session?.user || jwtUser;

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt');
    }
    setJwtUser(null);
    signOut({ callbackUrl: '/login' });
  };

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-blue-400">
              Campus Analytics
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link
                href="/"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/metrics"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Metrics
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <span className="text-gray-300 text-sm">
                  {currentUser.name || currentUser.username}
                  {currentUser.role === 'admin' && (
                    <span className="ml-1 text-xs bg-blue-600 px-2 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
