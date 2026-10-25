'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, CreditCard, TrendingUp, Download } from 'lucide-react';
import { getUserRole } from '@/lib/auth';

const mockTransactions = [
  {
    id: 't1',
    userId: 'u1',
    userName: 'Dancer Pro',
    competitionName: 'Dance Battle 2024',
    coinsWon: 50000,
    position: 1,
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 't2',
    userId: 'u2',
    userName: 'Chef Master',
    competitionName: 'Cooking Challenge',
    coinsWon: 30000,
    position: 2,
    createdAt: '2024-01-14T15:20:00Z',
  },
  {
    id: 't3',
    userId: 'u3',
    userName: 'Music Star',
    competitionName: 'Music Contest',
    coinsWon: 20000,
    position: 3,
    createdAt: '2024-01-13T09:15:00Z',
  },
];

export default function MonetizationPage() {
  const [transactions] = useState(mockTransactions);
  const userRole = getUserRole();

  if (userRole !== 'admin') {
    return <div>Access Denied</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Earnings & Coins</h1>
            <p className="mt-2 text-gray-600">Track coins earned by users in competitions and top earners</p>
          </div>
          <button className="flex items-center space-x-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
            <Download className="h-5 w-5" />
            <span>Export Report</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Coins Earned</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">1,250,000</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Earner</p>
                <p className="mt-2 text-xl font-bold text-gray-900">Dancer Pro</p>
                <p className="text-xs text-gray-500 mt-1">500,000 coins</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Competitions Completed</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">45</p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Winners</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">135</p>
              </div>
              <Download className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Competition</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Coins Won</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.userName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{tx.competitionName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600">
                    {tx.coinsWon.toLocaleString()} coins
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      tx.position === 1 ? 'bg-yellow-100 text-yellow-800' :
                      tx.position === 2 ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      #{tx.position}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900">View Details</button>
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
