'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import Modal from './Modal';

interface ShoppingItem {
  id: string;
  name: string;
  isPurchased: boolean;
  createdAt: string;
  addedBy: {
    id: string;
    name: string;
  };
}

export default function ShoppingList() {
  const { token } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (token) {
      fetchItems();
    }
  }, [token]);

  const fetchItems = async () => {
    try {
      const response = await apiRequest('/api/shopping', { method: 'GET' }, token);
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch shopping items:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePurchased = async (itemId: string, currentStatus: boolean) => {
    try {
      await apiRequest(
        `/api/shopping/${itemId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ isPurchased: !currentStatus }),
        },
        token
      );
      fetchItems();
    } catch (error) {
      console.error('Failed to update item:', error);
      setErrorMessage('Failed to update item');
      setErrorModalOpen(true);
    }
  };

  const confirmDelete = (itemId: string) => {
    setItemToDelete(itemId);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await apiRequest(`/api/shopping/${itemToDelete}`, { method: 'DELETE' }, token);
      fetchItems();
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Failed to delete item:', error);
      setErrorMessage('Failed to delete item');
      setErrorModalOpen(true);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-sage-800">Shopping List</h2>
        <p className="text-warm-gray">Loading...</p>
      </div>
    );
  }

  const purchasedItems = items.filter((item) => item.isPurchased);
  const unpurchasedItems = items.filter((item) => !item.isPurchased);

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
        <h2 className="text-xl font-display font-semibold mb-6 text-sage-800">Shopping List</h2>
        {items.length === 0 ? (
          <p className="text-warm-gray text-center py-8">No items yet. Add something to get started!</p>
        ) : (
          <div className="space-y-6">
            {unpurchasedItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-sage-700 mb-3">To Buy</h3>
                <ul className="space-y-2">
                  {unpurchasedItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-cream-50 to-sage-50 rounded-xl border border-warm-stone hover:shadow-soft transition-all"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <input
                          type="checkbox"
                          checked={item.isPurchased}
                          onChange={() => togglePurchased(item.id, item.isPurchased)}
                          className="h-5 w-5 text-terracotta-500 focus:ring-terracotta-300 border-warm-stone rounded cursor-pointer"
                        />
                        <span className="text-sage-800 font-medium">{item.name}</span>
                        <span className="text-xs text-sage-600">by {item.addedBy.name}</span>
                      </div>
                      <button
                        onClick={() => confirmDelete(item.id)}
                        className="ml-4 px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-all shadow-soft font-medium"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {purchasedItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-sage-700 mb-3">Purchased</h3>
                <ul className="space-y-2">
                  {purchasedItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-warm-stone/30 rounded-xl border border-warm-stone"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <input
                          type="checkbox"
                          checked={item.isPurchased}
                          onChange={() => togglePurchased(item.id, item.isPurchased)}
                          className="h-5 w-5 text-terracotta-500 focus:ring-terracotta-300 border-warm-stone rounded cursor-pointer"
                        />
                        <span className="text-warm-gray line-through">{item.name}</span>
                        <span className="text-xs text-warm-gray">by {item.addedBy.name}</span>
                      </div>
                      <button
                        onClick={() => confirmDelete(item.id)}
                        className="ml-4 px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-all shadow-soft font-medium"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Item"
        actions={
          <>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-soft"
            >
              Delete
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete this item?</p>
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

