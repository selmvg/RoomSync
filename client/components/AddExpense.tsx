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

const EXPENSE_CATEGORIES = [
  'Groceries',
  'Utilities',
  'Rent',
  'Transportation',
  'Entertainment',
  'Dining Out',
  'Household Items',
  'Other',
];

export default function AddExpense() {
  const { token } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [splitType, setSplitType] = useState<'equal' | 'exact' | 'percentage'>('equal');
  const [splitDetails, setSplitDetails] = useState<{ [key: string]: string }>({});
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
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
    setSelectedMembers((prev) => {
      const newSelection = prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId];

      // Reset split details when members change
      if (splitType !== 'equal') {
        setSplitDetails({});
      }

      return newSelection;
    });
  };

  const updateSplitDetail = (memberId: string, value: string) => {
    setSplitDetails((prev) => ({
      ...prev,
      [memberId]: value,
    }));
  };

  const calculateRemaining = () => {
    if (splitType === 'equal') return null;

    const totalAmount = parseFloat(amount) || 0;
    if (splitType === 'exact') {
      const totalSpecified = Object.values(splitDetails).reduce(
        (sum, val) => sum + (parseFloat(val) || 0),
        0
      );
      return totalAmount - totalSpecified;
    } else if (splitType === 'percentage') {
      const totalPercentage = Object.values(splitDetails).reduce(
        (sum, val) => sum + (parseFloat(val) || 0),
        0
      );
      return 100 - totalPercentage;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Please enter a description');
      setErrorModalOpen(true);
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage('Please enter a valid amount');
      setErrorModalOpen(true);
      return;
    }
    if (selectedMembers.length === 0) {
      setErrorMessage('Please select at least one person to split the expense with');
      setErrorModalOpen(true);
      return;
    }

    // Validate split details
    if (splitType === 'exact') {
      const totalSpecified = Object.values(splitDetails).reduce(
        (sum, val) => sum + (parseFloat(val) || 0),
        0
      );
      const totalAmount = parseFloat(amount);
      if (Math.abs(totalSpecified - totalAmount) > 0.01) {
        setErrorMessage(`Exact split amounts (₱${totalSpecified.toFixed(2)}) must equal total amount (₱${totalAmount.toFixed(2)})`);
        setErrorModalOpen(true);
        return;
      }
    } else if (splitType === 'percentage') {
      const totalPercentage = Object.values(splitDetails).reduce(
        (sum, val) => sum + (parseFloat(val) || 0),
        0
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        setErrorMessage(`Percentages must sum to 100% (currently ${totalPercentage.toFixed(2)}%)`);
        setErrorModalOpen(true);
        return;
      }
    }

    setSubmitting(true);
    try {
      // For now, receipt upload is just storing the file name/URL
      // In production, you'd upload to cloud storage (S3, Cloudinary, etc.) first
      let receiptUrl = null;
      if (receiptFile) {
        // TODO: Implement actual file upload to cloud storage
        // For now, we'll just store a placeholder
        receiptUrl = `receipt_${Date.now()}_${receiptFile.name}`;
      }

      const requestBody: any = {
        description,
        amount: parseFloat(amount),
        splitBetween: selectedMembers,
        category: category || undefined,
        receiptUrl: receiptUrl || undefined,
      };

      if (splitType !== 'equal') {
        requestBody.splitType = splitType;
        requestBody.splitDetails = splitDetails;
      }

      await apiRequest(
        '/api/expenses',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        },
        token
      );

      // Reset form
      setDescription('');
      setAmount('');
      setCategory('');
      setSelectedMembers(members.map((m) => m.id));
      setSplitType('equal');
      setSplitDetails({});
      setReceiptFile(null);
      setSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Failed to add expense:', error);
      setErrorMessage(error.message || 'Failed to add expense');
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
              onChange={(e) => {
                setAmount(e.target.value);
                // Reset split details when amount changes
                if (splitType !== 'equal') {
                  setSplitDetails({});
                }
              }}
              className="w-full px-4 py-3 border border-warm-stone rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all text-sage-900"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-sage-700 mb-2">
              Category (Optional)
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-warm-stone rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all text-sage-900 bg-white"
            >
              <option value="">Select category</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-2">
              Split Type
            </label>
            <div className="flex space-x-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  setSplitType('equal');
                  setSplitDetails({});
                }}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${splitType === 'equal'
                    ? 'bg-terracotta-500 text-white'
                    : 'bg-gray-100 text-sage-700 hover:bg-gray-200'
                  }`}
              >
                Equal
              </button>
              <button
                type="button"
                onClick={() => setSplitType('exact')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${splitType === 'exact'
                    ? 'bg-terracotta-500 text-white'
                    : 'bg-gray-100 text-sage-700 hover:bg-gray-200'
                  }`}
              >
                Exact Amount
              </button>
              <button
                type="button"
                onClick={() => setSplitType('percentage')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${splitType === 'percentage'
                    ? 'bg-terracotta-500 text-white'
                    : 'bg-gray-100 text-sage-700 hover:bg-gray-200'
                  }`}
              >
                Percentage
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-sage-700 mb-2">
              Split Between
            </label>
            {loading ? (
              <p className="text-sm text-warm-gray">Loading members...</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto border border-warm-stone rounded-xl p-3 bg-white">
                {members.map((member) => {
                  const isSelected = selectedMembers.includes(member.id);
                  return (
                    <div key={member.id} className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer hover:bg-cream-50 p-2 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMember(member.id)}
                          className="h-4 w-4 text-terracotta-500 focus:ring-terracotta-300 border-warm-stone rounded cursor-pointer"
                        />
                        <span className="text-sm text-sage-700 flex-1">{member.name}</span>
                        {isSelected && splitType === 'exact' && (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={splitDetails[member.id] || ''}
                            onChange={(e) => updateSplitDetail(member.id, e.target.value)}
                            placeholder="₱0.00"
                            className="w-24 px-2 py-1 text-sm border border-warm-stone rounded focus:outline-none focus:ring-1 focus:ring-terracotta-300"
                          />
                        )}
                        {isSelected && splitType === 'percentage' && (
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={splitDetails[member.id] || ''}
                              onChange={(e) => updateSplitDetail(member.id, e.target.value)}
                              placeholder="0"
                              className="w-16 px-2 py-1 text-sm border border-warm-stone rounded focus:outline-none focus:ring-1 focus:ring-terracotta-300"
                            />
                            <span className="text-xs text-sage-600">%</span>
                          </div>
                        )}
                      </label>
                    </div>
                  );
                })}
                {splitType !== 'equal' && selectedMembers.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-warm-stone">
                    <p className="text-xs text-sage-600">
                      {splitType === 'exact' ? 'Remaining: ' : 'Remaining: '}
                      <span className={`font-medium ${Math.abs(calculateRemaining() || 0) < 0.01
                          ? 'text-green-600'
                          : 'text-red-600'
                        }`}>
                        {splitType === 'exact'
                          ? `₱${(calculateRemaining() || 0).toFixed(2)}`
                          : `${(calculateRemaining() || 0).toFixed(2)}%`
                        }
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="receipt" className="block text-sm font-medium text-sage-700 mb-2">
              Receipt (Optional)
            </label>
            <input
              id="receipt"
              type="file"
              accept="image/*"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 border border-warm-stone rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all text-sage-900 bg-white text-sm"
            />
            {receiptFile && (
              <p className="text-xs text-sage-600 mt-1">Selected: {receiptFile.name}</p>
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
        <p>Expense added successfully!</p>
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

