'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: {
    id: string;
    name: string;
  };
  shares: Array<{
    id: string;
    amount: number;
    isSettled: boolean;
    user: {
      id: string;
      name: string;
    };
  }>;
}

export default function FinancialSummary() {
  const { token, user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [youOwe, setYouOwe] = useState(0);
  const [youAreOwed, setYouAreOwed] = useState(0);

  useEffect(() => {
    if (token && user) {
      fetchExpenses();
    }
  }, [token, user]);

  const fetchExpenses = async () => {
    try {
      const response = await apiRequest('/api/expenses', { method: 'GET' }, token);
      const data = await response.json();
      setExpenses(data.expenses || []);
      calculateBalance(data.expenses || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBalance = (expensesList: Expense[]) => {
    if (!user) return;

    let owe = 0;
    let owed = 0;

    expensesList.forEach((expense) => {
      // Find user's share in this expense
      const userShare = expense.shares.find((share) => share.user.id === user.id);
      
      if (userShare) {
        const shareAmount = parseFloat(userShare.amount.toString());
        
        // If user paid for this expense, they are owed by others
        if (expense.paidBy.id === user.id) {
          // User paid the full amount, but others owe their shares (only count unsettled shares)
          const unsettledOthersShares = expense.shares
            .filter((s) => s.user.id !== user.id && !s.isSettled)
            .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
          owed += unsettledOthersShares;
        } else {
          // User owes their share (only if not settled)
          if (!userShare.isSettled) {
            owe += shareAmount;
          }
        }
      }
    });

    setYouOwe(owe);
    setYouAreOwed(owed);
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-sage-800">Financial Summary</h2>
        <p className="text-warm-gray">Loading...</p>
      </div>
    );
  }

  const netBalance = youAreOwed - youOwe;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
      <h2 className="text-xl font-display font-semibold mb-6 text-sage-800">Financial Summary</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
          <span className="text-sage-700 font-medium">You Owe:</span>
          <span className="text-3xl font-bold text-red-600">₱{youOwe.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
          <span className="text-sage-700 font-medium">You Are Owed:</span>
          <span className="text-3xl font-bold text-green-600">₱{youAreOwed.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-sage-50 to-lavender-50 rounded-xl border-2 border-sage-200">
          <span className="text-sage-800 font-semibold">Net Balance:</span>
          <span className={`text-3xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₱{netBalance.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

