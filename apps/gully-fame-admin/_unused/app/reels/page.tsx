'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useState } from 'react';
import { CheckCircle, XCircle, Eye, Ban, AlertTriangle, Search } from 'lucide-react';
import { getUserRole } from '@/lib/auth';

const mockReels = [
  {
    id: '1',
    thumbnail: 'https://via.placeholder.com/150',
    userName: 'Dancer Pro',
    userId: 'u1',
    likes: 1250,
    comments: 89,
    views: 12500,
    saves: 234,
    status: 'approved',
    reports: 0,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    thumbnail: 'https://via.placeholder.com/150',
    userName: 'Chef Master',
    userId: 'u2',
    likes: 890,
    comments: 45,
    views: 8900,
    saves: 123,
    status: 'pending',
    reports: 0,
    createdAt: '2024-01-14',
  },
  {
    id: '3',
    thumbnail: 'https://via.placeholder.com/150',
    userName: 'Music Star',
    userId: 'u3',
    likes: 2340,
    comments: 156,
    views: 23400,
    saves: 567,
    status: 'reported',
    reports: 3,
    createdAt: '2024-01-13',
  },
];

export default function ReelsPage() {
  const userRole = getUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [reels] = useState(mockReels);

  if (userRole !== 'admin') {
    return <div>Access Denied</div>;
  }

  const filteredReels = reels.filter((reel) => {
    const matchesSearch = reel.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || reel.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gully Reel Moderation</h1>
          <p className="mt-2 text-gray-600">Approve, reject, and manage user content</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="reported">Reported</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReels.map((reel) => (
            <div key={reel.id} className="rounded-lg bg-white border border-gray-200 overflow-hidden shadow-sm">
              <div className="relative">
                <img src={reel.thumbnail} alt={reel.userName} className="w-full h-48 object-cover" />
                {reel.status === 'reported' && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{reel.reports} Reports</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{reel.userName}</h3>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>❤️ {reel.likes}</div>
                  <div>💬 {reel.comments}</div>
                  <div>👁️ {reel.views}</div>
                  <div>💾 {reel.saves}</div>
                </div>
                <div className="mt-3 flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    reel.status === 'approved' ? 'bg-green-100 text-green-800' :
                    reel.status === 'reported' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {reel.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center space-x-2">
                  <button
                    onClick={() => {
                      alert(`Reel ${reel.id} approved successfully!`);
                    }}
                    className="flex-1 flex items-center justify-center space-x-1 rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Reject this reel?')) {
                        alert(`Reel ${reel.id} rejected!`);
                      }
                    }}
                    className="flex-1 flex items-center justify-center space-x-1 rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                  <a
                    href={`/reels/${reel.id}`}
                    className="flex items-center justify-center space-x-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => {
                      if (confirm('Block this user?')) {
                        alert('User blocked!');
                      }
                    }}
                    className="flex items-center justify-center space-x-1 rounded-lg bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-700"
                  >
                    <Ban className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

