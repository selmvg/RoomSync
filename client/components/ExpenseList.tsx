'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import Modal from './Modal';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category?: string | null;
  receiptUrl?: string | null;
  createdAt: string;
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

export default function ExpenseList() {
  const { token, user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingShare, setSettlingShare] = useState<string | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleSettleUp = async (expenseId: string, shareId: string, currentStatus: boolean) => {
    setSettlingShare(shareId);
    try {
      await apiRequest(
        `/api/expenses/${expenseId}/shares/${shareId}/settle`,
        {
          method: 'PATCH',
          body: JSON.stringify({ isSettled: !currentStatus }),
        },
        token
      );
      fetchExpenses();
    } catch (error) {
      console.error('Failed to settle share:', error);
      setErrorMessage('Failed to update settlement status');
      setErrorModalOpen(true);
    } finally {
      setSettlingShare(null);
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
    <>
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
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h3 className="font-semibold text-sage-800 text-lg">{expense.description}</h3>
                      {expense.category && (
                        <span className="text-xs bg-sage-100 text-sage-700 px-2 py-1 rounded-full font-medium">
                          {expense.category}
                        </span>
                      )}
                      {expense.receiptUrl && (
                        <a
                          href={expense.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium hover:bg-blue-200 transition-colors"
                        >
                          📄 Receipt
                        </a>
                      )}
                    </div>
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
                  <div className="space-y-2">
                    {expense.shares.map((share) => {
                      const isUserShare = share.user.id === user?.id;
                      const isSettled = share.isSettled;

                      return (
                        <div
                          key={share.id}
                          className={`flex items-center justify-between p-2 rounded-lg ${isSettled ? 'bg-green-50 border border-green-200' : 'bg-white border border-warm-stone'
                            }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${isSettled ? 'text-green-700 line-through' : 'text-sage-800'
                              }`}>
                              {share.user.name}: ₱{parseFloat(share.amount.toString()).toFixed(2)}
                            </span>
                            {isSettled && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                ✓ Settled
                              </span>
                            )}
                          </div>
                          {!isSettled && isUserShare && (
                            <button
                              onClick={() => handleSettleUp(expense.id, share.id, share.isSettled)}
                              disabled={settlingShare === share.id}
                              className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                              {settlingShare === share.id ? '...' : 'Settle Up'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
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

