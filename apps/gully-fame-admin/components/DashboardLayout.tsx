'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { usePathname } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { getUserRole, UserRole } from '@/lib/auth';

// Sections whose admin API does not exist on the backend yet.
const PENDING_ROUTES = ['/competitions', '/users', '/tips', '/reports', '/sponsors'];

const MobileMenuContext = createContext<{
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}>({
  mobileMenuOpen: false,
  setMobileMenuOpen: () => {},
});

export const useMobileMenu = () => useContext(MobileMenuContext);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isPending = PENDING_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));

  useEffect(() => {
    setIsMounted(true);
    const role = getUserRole();
    if (role) {
      setUserRole(role);
    }
  }, []);

  
  
  return (
    <MobileMenuContext.Provider value={{ mobileMenuOpen, setMobileMenuOpen }}>
      <div className="flex h-screen bg-app-bg">
        {isMounted ? (
          <Sidebar userRole={userRole} />
        ) : (
          <div className="hidden md:block w-56 bg-app-sidebar"></div>
        )}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-app-bg" suppressHydrationWarning>
            {isPending && (
              <div className="mb-4 flex items-start space-x-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-400">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  The backend does not expose admin endpoints for this section yet, so data may fail to load. Content management
                  (App Content) is fully connected.
                </p>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </MobileMenuContext.Provider>
  );
}

