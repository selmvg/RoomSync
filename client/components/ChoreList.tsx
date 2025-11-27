'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import Modal from './Modal';

interface ChoreComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface Chore {
  id: string;
  title: string;
  isComplete: boolean;
  assignedTo: {
    id: string;
    name: string;
  } | null;
  isRecurring?: boolean;
  recurrencePattern?: string | null;
  recurrenceDayOfWeek?: number | null;
  useRotation?: boolean;
  dueDate?: string | null;
  comments?: ChoreComment[];
}

export default function ChoreList() {
  const { token } = useAuth();
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChore, setExpandedChore] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [choreToDelete, setChoreToDelete] = useState<string | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (token) {
      fetchChores();
    }
  }, [token]);

  const fetchChores = async () => {
    try {
      const response = await apiRequest('/api/chores', { method: 'GET' }, token);
      const data = await response.json();
      setChores(data.chores || []);
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
      fetchChores();
    } catch (error) {
      console.error('Failed to update chore:', error);
      setErrorMessage('Failed to update chore');
      setErrorModalOpen(true);
    }
  };

  const confirmDelete = (choreId: string) => {
    setChoreToDelete(choreId);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!choreToDelete) return;

    try {
      await apiRequest(`/api/chores/${choreToDelete}`, { method: 'DELETE' }, token);
      fetchChores();
      setIsDeleteModalOpen(false);
      setChoreToDelete(null);
    } catch (error) {
      console.error('Failed to delete chore:', error);
      setErrorMessage('Failed to delete chore');
      setErrorModalOpen(true);
      setIsDeleteModalOpen(false);
    }
  };

  const addComment = async (choreId: string) => {
    const content = commentText[choreId]?.trim();
    if (!content) return;

    setSubmittingComment(choreId);
    try {
      await apiRequest(
        `/api/chores/${choreId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ content }),
        },
        token
      );
      setCommentText({ ...commentText, [choreId]: '' });
      fetchChores();
    } catch (error) {
      console.error('Failed to add comment:', error);
      setErrorMessage('Failed to add comment');
      setErrorModalOpen(true);
    } finally {
      setSubmittingComment(null);
    }
  };

  const formatDueDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)} day(s)`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: 'Due today', isOverdue: false, isToday: true };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', isOverdue: false };
    } else {
      return { text: `Due in ${diffDays} days`, isOverdue: false };
    }
  };

  const getRecurrenceText = (chore: Chore) => {
    if (!chore.isRecurring) return null;
    if (chore.recurrencePattern === 'daily') return 'Repeats daily';
    if (chore.recurrencePattern === 'weekly' && chore.recurrenceDayOfWeek !== null && chore.recurrenceDayOfWeek !== undefined) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `Repeats every ${days[chore.recurrenceDayOfWeek]}`;
    }
    if (chore.recurrencePattern === 'monthly') return 'Repeats monthly';
    return 'Recurring';
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-sage-800">All Chores</h2>
        <p className="text-warm-gray">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
        <h2 className="text-xl font-display font-semibold mb-6 text-sage-800">All Chores</h2>
        {chores.length === 0 ? (
          <p className="text-warm-gray text-center py-8">No chores yet. Create one to get started!</p>
        ) : (
          <ul className="space-y-3">
            {chores.map((chore) => {
              const dueDateInfo = formatDueDate(chore.dueDate);
              const recurrenceText = getRecurrenceText(chore);
              const isExpanded = expandedChore === chore.id;

              return (
                <li
                  key={chore.id}
                  className={`rounded-xl border transition-all ${chore.isComplete
                    ? 'bg-warm-stone/30 border-warm-stone'
                    : 'bg-gradient-to-r from-cream-50 to-sage-50 border-warm-stone hover:shadow-soft'
                    }`}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4 flex-1">
                      <input
                        type="checkbox"
                        checked={chore.isComplete}
                        onChange={() => toggleComplete(chore.id, chore.isComplete)}
                        className="h-5 w-5 text-terracotta-500 focus:ring-terracotta-300 border-warm-stone rounded cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span
                            className={`${chore.isComplete ? 'line-through text-warm-gray' : 'text-sage-800 font-medium'
                              }`}
                          >
                            {chore.title}
                          </span>
                          {chore.isRecurring && (
                            <span className="text-xs bg-lavender-100 text-lavender-700 px-2 py-1 rounded-full">
                              🔄 {recurrenceText}
                            </span>
                          )}
                          {chore.useRotation && (
                            <span className="text-xs bg-terracotta-100 text-terracotta-700 px-2 py-1 rounded-full">
                              🔁 Rotation
                            </span>
                          )}
                          {dueDateInfo && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${dueDateInfo.isOverdue
                                ? 'bg-red-100 text-red-700'
                                : dueDateInfo.isToday
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                                }`}
                            >
                              {dueDateInfo.text}
                            </span>
                          )}
                        </div>
                        {chore.assignedTo && (
                          <p className="text-sm text-sage-600 mt-1">
                            Assigned to: <span className="font-medium">{chore.assignedTo.name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setExpandedChore(isExpanded ? null : chore.id)}
                        className="px-3 py-2 text-sm text-sage-700 hover:text-terracotta-500 transition-colors"
                      >
                        {isExpanded ? '▼' : '▶'} {chore.comments?.length || 0} comments
                      </button>
                      <button
                        onClick={() => confirmDelete(chore.id)}
                        className="px-4 py-2 bg-red-500 text-white text-sm rounded-xl hover:bg-red-600 transition-all shadow-soft font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-warm-stone pt-4 space-y-4">
                      {/* Comments Section */}
                      <div>
                        <h4 className="text-sm font-semibold text-sage-800 mb-2">Comments</h4>
                        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                          {chore.comments && chore.comments.length > 0 ? (
                            chore.comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="bg-white/60 rounded-lg p-3 border border-warm-stone"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-sage-800">
                                    {comment.user.name}
                                  </span>
                                  <span className="text-xs text-warm-gray">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-sage-700">{comment.content}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-warm-gray italic">No comments yet</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={commentText[chore.id] || ''}
                            onChange={(e) =>
                              setCommentText({ ...commentText, [chore.id]: e.target.value })
                            }
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addComment(chore.id);
                              }
                            }}
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-2 border border-warm-stone rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 text-sm"
                          />
                          <button
                            onClick={() => addComment(chore.id)}
                            disabled={submittingComment === chore.id || !commentText[chore.id]?.trim()}
                            className="px-4 py-2 bg-terracotta-500 text-white text-sm rounded-lg hover:bg-terracotta-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submittingComment === chore.id ? '...' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Chore"
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
        <p>Are you sure you want to delete this chore?</p>
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

