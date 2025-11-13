'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';

interface Expense {
  id: string;
  description: string;
  amount: number;
  createdAt: string;
  paidBy: {
    id: string;
    name: string;
  };
  shares: Array<{
    id: string;
    amount: number;
    user: {
      id: string;
      name: string;
    };
  }>;
}

export default function ExpenseList() {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchExpenses();
    }
  }, [token]);

  const fetchExpenses = async () => {
    try {
      const response = await apiRequest('/api/expenses', { method: 'GET' }, token);
      const data = await response.json();
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-sage-800">All Expenses</h2>
        <p className="text-warm-gray">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
      <h2 className="text-xl font-display font-semibold mb-6 text-sage-800">All Expenses</h2>
      {expenses.length === 0 ? (
        <p className="text-warm-gray text-center py-8">No expenses yet. Add one to get started!</p>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="border border-warm-stone rounded-xl p-5 bg-gradient-to-r from-cream-50 to-sage-50 hover:shadow-soft transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-sage-800 text-lg">{expense.description}</h3>
                  <p className="text-sm text-sage-600 mt-1">
                    Paid by: <span className="font-medium">{expense.paidBy.name}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-sage-800">
                    ₱{parseFloat(expense.amount.toString()).toFixed(2)}
                  </p>
                  <p className="text-xs text-warm-gray mt-1">
                    {new Date(expense.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-warm-stone">
                <p className="text-sm text-sage-700 mb-2 font-medium">Split between:</p>
                <div className="flex flex-wrap gap-2">
                  {expense.shares.map((share) => (
                    <span
                      key={share.id}
                      className="inline-block bg-lavender-100 text-lavender-700 text-xs px-3 py-1.5 rounded-full font-medium"
                    >
                      {share.user.name}: ₱{parseFloat(share.amount.toString()).toFixed(2)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

