'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import Modal from './Modal';

interface Chore {
  id: string;
  title: string;
  isComplete: boolean;
  assignedTo: {
    id: string;
    name: string;
  } | null;
}

export default function MyChores() {
  const { token, user } = useAuth();
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (token && user) {
      fetchChores();
    }
  }, [token, user]);

  const fetchChores = async () => {
    try {
      const response = await apiRequest('/api/chores', { method: 'GET' }, token);
      const data = await response.json();
      // Filter to show only incomplete chores assigned to the current user
      const myChores = (data.chores || []).filter(
        (chore: Chore) =>
          !chore.isComplete &&
          chore.assignedTo?.id === user?.id
      );
      setChores(myChores);
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
      fetchChores(); // Refresh the list
    } catch (error) {
      console.error('Failed to update chore:', error);
      setErrorMessage('Failed to update chore');
      setErrorModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-sage-800">My Chores</h2>
        <p className="text-warm-gray">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
        <h2 className="text-xl font-display font-semibold mb-6 text-sage-800">My Chores</h2>
        {chores.length === 0 ? (
          <p className="text-warm-gray text-center py-8">No pending chores assigned to you. 🎉</p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto pr-2">
            <ul className="space-y-3">
              {chores.map((chore) => (
                <li
                  key={chore.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-cream-50 to-sage-50 rounded-xl border border-warm-stone hover:shadow-soft transition-all"
                >
                  <span className="text-sage-800 font-medium">{chore.title}</span>
                  <button
                    onClick={() => toggleComplete(chore.id, chore.isComplete)}
                    className="ml-4 px-4 py-2 gradient-primary text-white text-sm rounded-xl hover:opacity-90 transition-all shadow-soft font-medium"
                  >
                    Mark Complete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Modal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Error"
        actions={
          <button
            onClick={() => setErrorModalOpen(false)}
            className="px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors shadow-soft"
          >
            OK
          </button>
        }
      >
        <p>{errorMessage}</p>
      </Modal>
    </>
  );
}

