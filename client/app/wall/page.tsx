'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import WallPostList from '@/components/WallPostList';
import CreateWallPost from '@/components/CreateWallPost';

export default function WallPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-warm-beige via-cream-50 to-sage-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-4xl font-display font-bold text-sage-800 mb-8">Household Wall</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <WallPostList />
              </div>
              <div>
                <CreateWallPost />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

