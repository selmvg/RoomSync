'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';

interface Household {
  id: string;
  name: string;
  inviteCode: string;
  members: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export default function HouseholdPage() {
  const { token, user } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdName.trim()) {
      alert('Please enter a household name');
      return;
    }

    setCreating(true);
    try {
      await apiRequest(
        '/api/households',
        {
          method: 'POST',
          body: JSON.stringify({ name: householdName }),
        },
        token
      );
      fetchHousehold();
      setHouseholdName('');
    } catch (error: any) {
      console.error('Failed to create household:', error);
      alert(error.message || 'Failed to create household');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      alert('Please enter an invite code');
      return;
    }

    setJoining(true);
    try {
      await apiRequest(
        '/api/households/join',
        {
          method: 'POST',
          body: JSON.stringify({ inviteCode }),
        },
        token
      );
      fetchHousehold();
      setInviteCode('');
    } catch (error: any) {
      console.error('Failed to join household:', error);
      alert(error.message || 'Failed to join household');
    } finally {
      setJoining(false);
    }
  };

  const copyInviteCode = () => {
    if (household?.inviteCode) {
      navigator.clipboard.writeText(household.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeaveHousehold = async () => {
    if (!confirm('Are you sure you want to leave this household? You will lose access to all chores and expenses.')) {
      return;
    }

    setLeaving(true);
    try {
      await apiRequest(
        '/api/households/leave',
        {
          method: 'POST',
        },
        token
      );
      setHousehold(null);
      // Update user in localStorage to reflect no household
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.householdId = null;
        localStorage.setItem('user', JSON.stringify(userData));
      }
      alert('You have successfully left the household');
      // Reload the page to update all components and context
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to leave household:', error);
      alert(error.message || 'Failed to leave household');
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-warm-beige via-cream-50 to-sage-50">
          <Navbar />
          <div className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <p className="text-warm-gray">Loading...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-warm-beige via-cream-50 to-sage-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-4xl font-display font-bold text-sage-800 mb-8">Household</h1>

            {!household ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
                  <h2 className="text-xl font-display font-semibold mb-4 text-sage-800">Create Household</h2>
                  <form onSubmit={handleCreateHousehold} className="space-y-4">
                    <div>
                      <label htmlFor="householdName" className="block text-sm font-medium text-sage-700 mb-2">
                        Household Name
                      </label>
                      <input
                        id="householdName"
                        type="text"
                        value={householdName}
                        onChange={(e) => setHouseholdName(e.target.value)}
                        className="w-full px-4 py-3 border border-warm-stone rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all text-sage-900"
                        placeholder="e.g., The Cozy Apartment"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={creating}
                      className="w-full gradient-primary text-white py-3 px-4 rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-terracotta-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft font-medium"
                    >
                      {creating ? 'Creating...' : 'Create Household'}
                    </button>
                  </form>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
                  <h2 className="text-xl font-display font-semibold mb-4 text-sage-800">Join Household</h2>
                  <form onSubmit={handleJoinHousehold} className="space-y-4">
                    <div>
                      <label htmlFor="inviteCode" className="block text-sm font-medium text-sage-700 mb-2">
                        Invite Code
                      </label>
                      <input
                        id="inviteCode"
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        className="w-full px-4 py-3 border border-warm-stone rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all text-sage-900"
                        placeholder="Enter invite code"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={joining}
                      className="w-full gradient-sage text-white py-3 px-4 rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft font-medium"
                    >
                      {joining ? 'Joining...' : 'Join Household'}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
                  <h2 className="text-2xl font-display font-semibold mb-2 text-sage-800">{household.name}</h2>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-sage-700 mb-2">Invite Code</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={household.inviteCode}
                        readOnly
                        className="flex-1 px-4 py-3 border border-warm-stone rounded-xl bg-cream-50 text-sage-900 font-mono text-sm"
                      />
                      <button
                        onClick={copyInviteCode}
                        className="px-4 py-3 gradient-primary text-white rounded-xl hover:opacity-90 transition-all shadow-soft font-medium"
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs text-warm-gray mt-2">Share this code with your roommates to invite them</p>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-display font-semibold text-sage-800">Members</h2>
                    <button
                      onClick={handleLeaveHousehold}
                      disabled={leaving}
                      className="px-4 py-2 bg-red-500 text-white text-sm rounded-xl hover:bg-red-600 transition-all shadow-soft font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {leaving ? 'Leaving...' : 'Leave Household'}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {household.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-cream-50 to-sage-50 rounded-xl border border-warm-stone"
                      >
                        <div>
                          <p className="font-medium text-sage-800">{member.name}</p>
                          <p className="text-sm text-sage-600">{member.email}</p>
                        </div>
                        {member.id === user?.id && (
                          <span className="text-xs bg-terracotta-100 text-terracotta-700 px-3 py-1 rounded-full font-medium">
                            You
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

