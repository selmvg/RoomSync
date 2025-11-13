'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-warm-beige via-cream-50 to-sage-50">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold mb-4 bg-gradient-to-r from-terracotta-500 to-lavender-500 bg-clip-text text-transparent">
            RoomSync
          </h1>
          <p className="text-warm-gray">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

