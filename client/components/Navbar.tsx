'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-sm shadow-soft border-b border-warm-stone">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-2xl font-display font-bold bg-gradient-to-r from-terracotta-500 to-lavender-500 bg-clip-text text-transparent">
                RoomSync
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <Link
                href="/dashboard"
                className="text-sage-700 hover:text-terracotta-500 inline-flex items-center px-3 pt-1 border-b-2 border-transparent hover:border-terracotta-300 text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/chores"
                className="text-sage-700 hover:text-terracotta-500 inline-flex items-center px-3 pt-1 border-b-2 border-transparent hover:border-terracotta-300 text-sm font-medium transition-colors"
              >
                Chores
              </Link>
              <Link
                href="/expenses"
                className="text-sage-700 hover:text-terracotta-500 inline-flex items-center px-3 pt-1 border-b-2 border-transparent hover:border-terracotta-300 text-sm font-medium transition-colors"
              >
                Expenses
              </Link>
              <Link
                href="/household"
                className="text-sage-700 hover:text-terracotta-500 inline-flex items-center px-3 pt-1 border-b-2 border-transparent hover:border-terracotta-300 text-sm font-medium transition-colors"
              >
                Household
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-sage-700 font-medium">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-warm-gray hover:text-terracotta-500 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

