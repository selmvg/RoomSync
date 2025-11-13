'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';

interface Chore {
  id: string;
  title: string;
  isComplete: boolean;
  assignedTo: {
    id: string;
    name: string;
  } | null;
}

export default function ChoreList() {
  const { token } = useAuth();
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchChores();
    }
  }, [token]);

  const fetchChores = async () => {
    try {
      const response = await apiRequest('/api/chores', { method: 'GET' }, token);
      const data = await response.json();
      setChores(data.chores || []);
    } catch (error) {
      console.error('Failed to fetch chores:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (choreId: string, currentStatus: boolean) => {
    try {
      await apiRequest(
        `/api/chores/${choreId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ isComplete: !currentStatus }),
        },
        token
      );
      fetchChores();
    } catch (error) {
      console.error('Failed to update chore:', error);
      alert('Failed to update chore');
    }
  };

  const deleteChore = async (choreId: string) => {
    if (!confirm('Are you sure you want to delete this chore?')) {
      return;
    }

    try {
      await apiRequest(`/api/chores/${choreId}`, { method: 'DELETE' }, token);
      fetchChores();
    } catch (error) {
      console.error('Failed to delete chore:', error);
      alert('Failed to delete chore');
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-sage-800">All Chores</h2>
        <p className="text-warm-gray">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
      <h2 className="text-xl font-display font-semibold mb-6 text-sage-800">All Chores</h2>
      {chores.length === 0 ? (
        <p className="text-warm-gray text-center py-8">No chores yet. Create one to get started!</p>
      ) : (
        <ul className="space-y-3">
          {chores.map((chore) => (
            <li
              key={chore.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                chore.isComplete 
                  ? 'bg-warm-stone/30 border-warm-stone' 
                  : 'bg-gradient-to-r from-cream-50 to-sage-50 border-warm-stone hover:shadow-soft'
              }`}
            >
              <div className="flex items-center space-x-4 flex-1">
                <input
                  type="checkbox"
                  checked={chore.isComplete}
                  onChange={() => toggleComplete(chore.id, chore.isComplete)}
                  className="h-5 w-5 text-terracotta-500 focus:ring-terracotta-300 border-warm-stone rounded cursor-pointer"
                />
                <span
                  className={`flex-1 ${
                    chore.isComplete ? 'line-through text-warm-gray' : 'text-sage-800 font-medium'
                  }`}
                >
                  {chore.title}
                </span>
                {chore.assignedTo && (
                  <span className="text-sm text-sage-600 bg-sage-100 px-3 py-1 rounded-full">
                    {chore.assignedTo.name}
                  </span>
                )}
              </div>
              <button
                onClick={() => deleteChore(chore.id)}
                className="ml-4 px-4 py-2 bg-red-500 text-white text-sm rounded-xl hover:bg-red-600 transition-all shadow-soft font-medium"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

