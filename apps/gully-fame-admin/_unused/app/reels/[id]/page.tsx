'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Ban, Eye, Heart, MessageCircle, Download } from 'lucide-react';
import { getUserRole } from '@/lib/auth';

const mockReelDetail = {
  id: '1',
  thumbnail: 'https://via.placeholder.com/400',
  userName: 'Dancer Pro',
  userId: 'u1',
  title: 'Amazing Dance Performance',
  likes: 1250,
  comments: 89,
  views: 12500,
  saves: 234,
  status: 'pending',
  reports: 0,
  createdAt: '2024-01-15',
  description: 'Check out this amazing dance performance!',
};

export default function ReelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userRole = getUserRole();
  const reel = mockReelDetail;

  if (userRole !== 'admin') {
    return <div>Access Denied</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Reels</span>
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
              <div className="relative">
                <img src={reel.thumbnail} alt={reel.title} className="w-full h-96 object-cover" />
              </div>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{reel.title}</h1>
                <p className="text-gray-600 mb-4">{reel.description}</p>
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4" />
                    <span>{reel.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{reel.comments}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{reel.views}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Download className="h-4 w-4" />
                    <span>{reel.saves}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">User Info</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">User Name</p>
                  <p className="font-medium text-gray-900">{reel.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    reel.status === 'approved' ? 'bg-green-100 text-green-800' :
                    reel.status === 'reported' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {reel.status}
                  </span>
                </div>
                {reel.reports > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Reports</p>
                    <p className="font-medium text-red-600">{reel.reports} reports</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    alert('Reel approved successfully!');
                    router.push('/reels');
                  }}
                  className="w-full flex items-center justify-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Approve Reel</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to reject this reel?')) {
                      alert('Reel rejected!');
                      router.push('/reels');
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  <XCircle className="h-5 w-5" />
                  <span>Reject Reel</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Block this user?')) {
                      alert('User blocked!');
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                >
                  <Ban className="h-5 w-5" />
                  <span>Block User</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

