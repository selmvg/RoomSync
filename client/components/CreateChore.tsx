'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import Modal from './Modal';

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
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('');
  const [recurrenceDayOfWeek, setRecurrenceDayOfWeek] = useState<number | null>(null);
  const [useRotation, setUseRotation] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      setErrorMessage('Please enter a chore title');
      setErrorModalOpen(true);
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
            isRecurring,
            recurrencePattern: isRecurring ? recurrencePattern : undefined,
            recurrenceDayOfWeek: isRecurring && recurrencePattern === 'weekly' ? recurrenceDayOfWeek : undefined,
            useRotation,
            dueDate: dueDate || undefined,
          }),
        },
        token
      );
      setTitle('');
      setAssignedToId('');
      setIsRecurring(false);
      setRecurrencePattern('');
      setRecurrenceDayOfWeek(null);
      setUseRotation(false);
      setDueDate('');
      setSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Failed to create chore:', error);
      setErrorMessage(error.message || 'Failed to create chore');
      setErrorModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalOpen(false);
    window.location.reload();
  };

  return (
    <>
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
              disabled={useRotation}
              className="w-full px-4 py-3 border border-warm-stone rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all text-sage-900 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-sage-700 mb-2">
              Due Date (Optional)
            </label>
            <input
              id="dueDate"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 border border-warm-stone rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all text-sage-900 bg-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isRecurring"
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => {
                setIsRecurring(e.target.checked);
                if (!e.target.checked) {
                  setRecurrencePattern('');
                  setRecurrenceDayOfWeek(null);
                }
              }}
              className="h-4 w-4 text-terracotta-500 focus:ring-terracotta-300 border-warm-stone rounded cursor-pointer"
            />
            <label htmlFor="isRecurring" className="text-sm font-medium text-sage-700 cursor-pointer">
              Recurring Chore
            </label>
          </div>

          {isRecurring && (
            <div className="space-y-3 pl-6 border-l-2 border-terracotta-200">
              <div>
                <label htmlFor="recurrencePattern" className="block text-sm font-medium text-sage-700 mb-2">
                  Repeat Frequency
                </label>
                <select
                  id="recurrencePattern"
                  value={recurrencePattern}
                  onChange={(e) => {
                    setRecurrencePattern(e.target.value);
                    if (e.target.value !== 'weekly') {
                      setRecurrenceDayOfWeek(null);
                    }
                  }}
                  className="w-full px-4 py-3 border border-warm-stone rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all text-sage-900 bg-white"
                >
                  <option value="">Select frequency</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {recurrencePattern === 'weekly' && (
                <div>
                  <label htmlFor="recurrenceDayOfWeek" className="block text-sm font-medium text-sage-700 mb-2">
                    Day of Week
                  </label>
                  <select
                    id="recurrenceDayOfWeek"
                    value={recurrenceDayOfWeek || ''}
                    onChange={(e) => setRecurrenceDayOfWeek(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 border border-warm-stone rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all text-sage-900 bg-white"
                  >
                    <option value="">Select day</option>
                    <option value="0">Sunday</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                  </select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  id="useRotation"
                  type="checkbox"
                  checked={useRotation}
                  onChange={(e) => {
                    setUseRotation(e.target.checked);
                    if (e.target.checked) {
                      setAssignedToId('');
                    }
                  }}
                  className="h-4 w-4 text-terracotta-500 focus:ring-terracotta-300 border-warm-stone rounded cursor-pointer"
                />
                <label htmlFor="useRotation" className="text-sm font-medium text-sage-700 cursor-pointer">
                  Rotate assignment between members
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full gradient-primary text-white py-3 px-4 rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-terracotta-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft font-medium"
          >
            {submitting ? 'Creating...' : 'Create Chore'}
          </button>
        </form>
      </div>

      <Modal
        isOpen={successModalOpen}
        onClose={handleSuccessClose}
        title="Success"
        actions={
          <button
            onClick={handleSuccessClose}
            className="px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors shadow-soft"
          >
            OK
          </button>
        }
      >
        <p>Chore created successfully!</p>
      </Modal>

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

