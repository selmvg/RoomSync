'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import FinancialSummary from '@/components/FinancialSummary';
import MyChores from '@/components/MyChores';

interface Household {
  id: string;
  name: string;
  members: Array<{ id: string; name: string; email: string }>;
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchHousehold();
    }
  }, [token]);

  const fetchHousehold = async () => {
    try {
      const response = await apiRequest('/api/households/me', { method: 'GET' }, token);
      const data = await response.json();
      setHousehold(data.household);
    } catch (error) {
      console.error('Failed to fetch household:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-warm-beige via-cream-50 to-sage-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-4xl font-display font-bold text-sage-800 mb-8">Dashboard</h1>
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-warm-gray">Loading...</p>
              </div>
            ) : !household ? (
              <div className="bg-gradient-to-r from-cream-100 to-lavender-50 border-l-4 border-terracotta-400 rounded-r-2xl p-6 mb-6 shadow-soft">
                <h2 className="text-xl font-display font-semibold text-sage-800 mb-2">
                  No Household Found
                </h2>
                <p className="text-sage-700 mb-4">
                  You need to create or join a household to get started.
                </p>
                <a
                  href="/household"
                  className="inline-block gradient-primary text-white px-6 py-2 rounded-xl hover:opacity-90 transition-all shadow-soft font-medium"
                >
                  Go to Household
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FinancialSummary />
                <MyChores />
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

