import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import Modal from './Modal';

interface WallPost {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
}

interface WallPostListProps {
  readOnly?: boolean;
}

export default function WallPostList({ readOnly = false }: WallPostListProps) {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (token) {
      fetchPosts();
    }
  }, [token]);

  const fetchPosts = async () => {
    try {
      const response = await apiRequest('/api/wall', { method: 'GET' }, token);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (postId: string) => {
    setPostToDelete(postId);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!postToDelete) return;

    try {
      await apiRequest(`/api/wall/${postToDelete}`, { method: 'DELETE' }, token);
      fetchPosts();
      setIsDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Failed to delete post:', error);
      setErrorMessage('Failed to delete post');
      setErrorModalOpen(true);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
        <h2 className="text-xl font-display font-semibold mb-4 text-sage-800">Announcements</h2>
        <p className="text-warm-gray">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-luxe p-6">
        <h2 className="text-xl font-display font-semibold mb-6 text-sage-800">Announcements</h2>
        {posts.length === 0 ? (
          <p className="text-warm-gray text-center py-8">No posts yet. Be the first to post something!</p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto pr-2">
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="border border-warm-stone rounded-xl p-5 bg-gradient-to-r from-cream-50 to-sage-50 hover:shadow-soft transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sage-800 whitespace-pre-wrap">{post.content}</p>
                    </div>
                    {!readOnly && post.author.id === user?.id && (
                      <button
                        onClick={() => confirmDelete(post.id)}
                        className="ml-4 px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-all shadow-soft font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-warm-stone">
                    <span className="text-sm text-sage-600 font-medium">{post.author.name}</span>
                    <span className="text-xs text-warm-gray">
                      {new Date(post.createdAt).toLocaleDateString()} at{' '}
                      {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Post"
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
        <p>Are you sure you want to delete this post? This action cannot be undone.</p>
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

