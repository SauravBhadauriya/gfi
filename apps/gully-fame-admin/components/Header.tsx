'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useMobileMenu } from './DashboardLayout';

const getPageTitle = (pathname: string): string => {
  const routeMap: { [key: string]: string } = {
    '/': 'Dashboard',
    '/app-content': 'App Content',
    '/competitions': 'Competitions',
    '/competitions/create': 'Create Competition',
    '/users': 'Users',
    '/tips': 'Tips & Earnings',
    '/reports': 'Reports',
    '/sponsors': 'Sponsors',
  };

  
  if (routeMap[pathname]) {
    return routeMap[pathname];
  }

  
  for (const [route, title] of Object.entries(routeMap)) {
    if (pathname.startsWith(route) && route !== '/') {
      return title;
    }
  }

  
  return 'Dashboard';
};

export default function Header() {
  const { setMobileMenuOpen } = useMobileMenu();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-center border-b border-app-border bg-app-surface px-3 sm:px-4 md:px-5 shadow-sm relative">
      {}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden absolute left-3 sm:left-4 p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>
      
      {}
      <h1 className="text-base sm:text-lg font-semibold text-gray-900 text-center">{pageTitle}</h1>
    </header>
  );
}
