'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ListTree, Users, ArrowLeft, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isHydrated, logout } = useAuthStore();

  useEffect(() => {
    if (isHydrated && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, isHydrated, router]);

  if (!isHydrated || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Loading admin panel...</p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl">Admin Panel</span>
          </Link>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/categories">
            <Button variant="ghost" className="w-full justify-start gap-3 h-12">
              <ListTree className="h-5 w-5" />
              Categories
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="ghost" className="w-full justify-start gap-3 h-12">
              <Users className="h-5 w-5" />
              Users
            </Button>
          </Link>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-gray-500">
                <ArrowLeft className="h-4 w-4" />
                Back to Site
              </Button>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
