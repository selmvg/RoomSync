'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-beige via-cream-50 to-sage-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-display font-bold mb-2 bg-gradient-to-r from-terracotta-500 to-lavender-500 bg-clip-text text-transparent">
            RoomSync
          </h1>
          <h2 className="mt-6 text-2xl font-display font-semibold text-sage-800">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-warm-gray">
            Or{' '}
            <Link href="/login" className="font-medium text-terracotta-500 hover:text-terracotta-600 transition-colors">
              sign in to your existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r-lg shadow-soft">
              {error}
            </div>
          )}
          <div className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-luxe p-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-sage-700 mb-2">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-warm-stone rounded-xl placeholder-warm-gray text-sage-900 focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-sage-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-warm-stone rounded-xl placeholder-warm-gray text-sage-900 focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-sage-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-warm-stone rounded-xl placeholder-warm-gray text-sage-900 focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white gradient-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-terracotta-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

