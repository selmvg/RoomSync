'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import Modal from './Modal';

export default function AddShoppingItem() {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter an item name');
      setErrorModalOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest(
        '/api/shopping',
        {
          method: 'POST',
          body: JSON.stringify({ name }),
        },
        token
      );
      setName('');
      setSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Failed to add item:', error);
      setErrorMessage(error.message || 'Failed to add item');
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
        <h2 className="text-xl font-display font-semibold mb-6 text-sage-800">Add Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-sage-700 mb-2">
              Item Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-warm-stone rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 transition-all text-sage-900"
              placeholder="e.g., Milk, Bread, Eggs"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full gradient-primary text-white py-3 px-4 rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-terracotta-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft font-medium"
          >
            {submitting ? 'Adding...' : 'Add Item'}
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
        <p>Item added successfully!</p>
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

