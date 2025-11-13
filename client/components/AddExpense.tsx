'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';

interface Member {
  id: string;
  name: string;
  email: string;
}

export default function AddExpense() {
  const { token } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
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
        // Pre-select all members by default
        setSelectedMembers(data.household.members.map((m: Member) => m.id));
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (selectedMembers.length === 0) {
      alert('Please select at least one person to split the expense with');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest(
        '/api/expenses',
        {
          method: 'POST',
          body: JSON.stringify({
            description,
            amount: parseFloat(amount),
            splitBetween: selectedMembers,
          }),
        },
        token
      );
      setDescription('');
      setAmount('');
      setSelectedMembers(members.map((m) => m.id));
      alert('Expense added successfully!');
      // Trigger a page refresh to show the new expense
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to add expense:', error);
      alert(error.message || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
      <h2 className="text-xl font-display font-semibold mb-6 text-sage-800">Add Expense</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-sage-700 mb-2">
            Description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border border-warm-stone rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all text-sage-900"
            placeholder="e.g., Groceries"
            required
          />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-sage-700 mb-2">
            Amount (₱)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 border border-warm-stone rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all text-sage-900"
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-sage-700 mb-2">
            Split Between
          </label>
          {loading ? (
            <p className="text-sm text-warm-gray">Loading members...</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-warm-stone rounded-xl p-3 bg-white">
              {members.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-cream-50 p-2 rounded-lg transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => toggleMember(member.id)}
                    className="h-4 w-4 text-terracotta-500 focus:ring-terracotta-300 border-warm-stone rounded cursor-pointer"
                  />
                  <span className="text-sm text-sage-700">{member.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full gradient-primary text-white py-3 px-4 rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-terracotta-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft font-medium"
        >
          {submitting ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
}

