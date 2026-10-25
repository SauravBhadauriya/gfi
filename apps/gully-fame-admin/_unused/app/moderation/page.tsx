'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { CheckCircle, XCircle, AlertTriangle, Eye, Ban, Search } from 'lucide-react';
import { getUserRole } from '@/lib/auth';

const mockContentItems = [
  {
    id: '1',
    type: 'reel',
    title: 'Amazing Dance Performance',
    userId: 'u1',
    userName: 'Dancer Pro',
    status: 'pending',
    reports: 0,
    views: 1250,
    likes: 89,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    type: 'video',
    title: 'Cooking Tutorial',
    userId: 'u2',
    userName: 'Chef Master',
    status: 'reported',
    reports: 3,
    views: 3450,
    likes: 234,
    createdAt: '2024-01-14',
  },
  {
    id: '3',
    type: 'reel',
    title: 'Music Performance',
    userId: 'u3',
    userName: 'Music Star',
    status: 'approved',
    reports: 0,
    views: 5670,
    likes: 456,
    createdAt: '2024-01-13',
  },
];

export default function ModerationPage() {
  const [content] = useState(mockContentItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const userRole = getUserRole();

  if (userRole !== 'admin') {
    return <div>Access Denied</div>;
  }

  const filteredContent = content.filter((item) => {
    const matchesSearch = item.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleApprove = (id: string) => {
    alert(`Content ${id} approved successfully!`);
  };

  const handleReject = (id: string) => {
    if (confirm('Are you sure you want to reject this content?')) {
      alert(`Content ${id} rejected!`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gully Reel Moderation</h1>
          <p className="mt-2 text-gray-600">Approve / Reject Content - Review and manage user content</p>
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

        <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Content</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reports</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Stats</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContent.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    <div className="text-sm text-gray-500">{item.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.userName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.status === 'approved' ? 'bg-green-100 text-green-800' :
                      item.status === 'reported' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.reports}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.views} views • {item.likes} likes
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Approve"
                    >
                      <CheckCircle className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Reject"
                    >
                      <XCircle className="h-4 w-4 inline" />
                    </button>
                    <button className="text-blue-600 hover:text-blue-900" title="View Detail">
                      <Eye className="h-4 w-4 inline" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900" title="Block User">
                      <Ban className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

