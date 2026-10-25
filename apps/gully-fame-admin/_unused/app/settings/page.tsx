'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Settings as SettingsIcon, Users, Shield, FileText } from 'lucide-react';
import { getUserRole } from '@/lib/auth';

export default function SettingsPage() {
  const [userRole, setUserRole] = useState<'admin' | 'sponsor'>('admin');

  useEffect(() => {
    const role = getUserRole();
    if (role) setUserRole(role);
  }, []);

  if (userRole !== 'admin') {
    return <div>Access Denied</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage platform settings and configurations</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <Users className="h-5 w-5 text-primary-600 mr-2" />
              <h2 className="text-sm font-semibold text-gray-900">Roles & Permissions</h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">Manage user roles and access permissions</p>
            <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">Configure →</button>
          </div>

          <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <Shield className="h-5 w-5 text-primary-600 mr-2" />
              <h2 className="text-sm font-semibold text-gray-900">Security Settings</h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">Configure security and authentication</p>
            <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">Configure →</button>
          </div>

          <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <SettingsIcon className="h-5 w-5 text-primary-600 mr-2" />
              <h2 className="text-sm font-semibold text-gray-900">Platform Configurations</h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">General platform settings and preferences</p>
            <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">Configure →</button>
          </div>

          <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <FileText className="h-5 w-5 text-primary-600 mr-2" />
              <h2 className="text-sm font-semibold text-gray-900">Platform Policies</h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">Manage terms, privacy, and community guidelines</p>
            <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">Manage →</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
