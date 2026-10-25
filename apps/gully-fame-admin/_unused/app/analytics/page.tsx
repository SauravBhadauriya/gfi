'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { mockSponsorAnalytics } from '@/lib/mockData';
import { formatNumber } from '@/lib/utils';
import { Eye, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { getUserRole } from '@/lib/auth';

export default function AnalyticsPage() {
  const analytics = mockSponsorAnalytics;
  const [userRole, setUserRole] = useState<'admin' | 'sponsor'>('admin');

  useEffect(() => {
    const role = getUserRole();
    if (role) setUserRole(role);
  }, []);

  if (userRole !== 'sponsor') {
    return <div>Access Denied</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sponsor Analytics</h1>
          <p className="mt-2 text-gray-600">Track your competition performance and brand visibility</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(analytics.totalViews)}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reach</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(analytics.totalReach)}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(analytics.totalEntries)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(analytics.totalEngagement)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Brand Visibility</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{analytics.brandVisibility}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Competition Performance</h2>
          <div className="space-y-4">
            {analytics.competitions.map((comp) => (
              <div key={comp.id} className="border-b pb-4 last:border-0">
                <h3 className="font-semibold text-gray-900 mb-2">{comp.title}</h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Views: </span>
                    <span className="font-medium">{formatNumber(comp.views)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Reach: </span>
                    <span className="font-medium">{formatNumber(comp.reach)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Entries: </span>
                    <span className="font-medium">{formatNumber(comp.entries)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Engagement: </span>
                    <span className="font-medium">{formatNumber(comp.engagement)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Analytics Chart</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Chart placeholder - Connect Recharts here</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

