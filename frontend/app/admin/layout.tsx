'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ListTree, Users, ArrowLeft, LogOut, ShoppingCart } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading MarketHub...</p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin', active: true },
    { name: 'Products', icon: ListTree, href: '/admin/categories' },
    { name: 'Orders', icon: ShoppingCart, href: '#' },
    { name: 'Customers', icon: Users, href: '/admin/users' },
    { name: 'Analytics', icon: ListTree, href: '#' },
    { name: 'Marketing', icon: LayoutDashboard, href: '#' },
    { name: 'Settings', icon: ListTree, href: '#' },
    { name: 'Help', icon: ListTree, href: '#' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar - Glassmorphic */}
      <aside className="w-64 glass-dark m-4 mr-0 rounded-3xl hidden md:flex flex-col border-white/5">
        <div className="p-8 flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">Market<span className="text-primary italic">Hub</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full justify-start gap-4 h-12 rounded-xl transition-all duration-300",
                  item.active 
                    ? "bg-primary/20 text-primary border-r-4 border-primary shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5", item.active && "text-primary")} />
                <span className="font-medium">{item.name}</span>
              </Button>
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className="w-full justify-start gap-4 h-12 text-red-500 hover:bg-red-500/10 rounded-xl"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - Glassmorphic */}
        <header className="h-20 flex items-center justify-between px-8 mx-4 mt-4 rounded-3xl glass-dark border-white/5">
          <div className="flex items-center flex-1 max-w-md">
             <div className="relative w-full group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                   <ListTree className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search products, orders..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                />
             </div>
          </div>

          <div className="flex items-center gap-4 ml-4">
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5">
              <ListTree className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5">
              <Users className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className="h-8 w-[1px] bg-white/10 mx-2" />
            <div className="flex items-center gap-3 pl-2">
               <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary p-[1px]">
                  <div className="h-full w-full rounded-xl bg-background flex items-center justify-center overflow-hidden">
                     <span className="text-xs font-bold">{user.name.charAt(0)}</span>
                  </div>
               </div>
               <div className="hidden lg:block">
                  <p className="text-sm font-bold text-white leading-none">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Admin Account</p>
               </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
