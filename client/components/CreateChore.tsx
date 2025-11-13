'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';

interface Member {
  id: string;
  name: string;
  email: string;
}

export default function CreateChore() {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      fetchMembers();
    }
  }, [token]);

  const fetchMembers = async () => {
    try {
      const response = await apiRequest('/api/households/me', { method: 'GET' }, token);
      const data = await response.json();
      if (data.household?.members) {
        setMembers(data.household.members);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a chore title');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest(
        '/api/chores',
        {
          method: 'POST',
          body: JSON.stringify({
            title,
            assignedToId: assignedToId || undefined,
          }),
        },
        token
      );
      setTitle('');
      setAssignedToId('');
      alert('Chore created successfully!');
      // Trigger a page refresh to show the new chore
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to create chore:', error);
      alert(error.message || 'Failed to create chore');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
      <h2 className="text-xl font-display font-semibold mb-6 text-sage-800">Create Chore</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-sage-700 mb-2">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-warm-stone rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all text-sage-900"
            placeholder="e.g., Take out trash"
            required
          />
        </div>
        <div>
          <label htmlFor="assignedTo" className="block text-sm font-medium text-sage-700 mb-2">
            Assign To (Optional)
          </label>
          <select
            id="assignedTo"
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="w-full px-4 py-3 border border-warm-stone rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all text-sage-900 bg-white"
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full gradient-primary text-white py-3 px-4 rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-terracotta-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft font-medium"
        >
          {submitting ? 'Creating...' : 'Create Chore'}
        </button>
      </form>
    </div>
  );
}

