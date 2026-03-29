'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Clock, ShoppingBag, CreditCard, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, isHydrated, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [ordersRes, statsRes] = await Promise.all([
        api.get('/orders/my-orders'),
        api.get('/stats/customer')
      ]);
      setOrders(ordersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] animate-pulse">Retrieving History...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-24 relative overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[150px] rounded-full -z-10" />
      <div className="absolute bottom-0 right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[150px] rounded-full -z-10" />

      <header className="px-4 md:px-8 py-6 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto glass shadow-2xl rounded-3xl p-4 md:px-8 flex items-center justify-between border-white/10">
          <div className="flex items-center gap-6">
            <Link href="/" className="group p-2 rounded-xl border border-white/5 hover:bg-white/5 transition-all">
              <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-white transition-colors" />
            </Link>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white">Purchase <span className="text-primary italic">History</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === 'ADMIN' && (
              <Link href="/admin" className="hidden sm:block">
                <Button variant="glass" size="sm" className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Dashboard</Button>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-12">
        {/* Customer Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-dark p-6 rounded-[2.5rem] border-white/5 flex items-center justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-3xl -z-10 group-hover:bg-green-500/20 transition-colors" />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Vault Value</p>
              <p className="text-4xl font-black text-white tracking-tighter">${stats?.totalSpent?.toLocaleString() || '0.00'}</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
              <CreditCard className="h-7 w-7" />
            </div>
          </div>

          <div className="glass-dark p-6 rounded-[2.5rem] border-white/5 flex items-center justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-3xl -z-10 group-hover:bg-primary/20 transition-colors" />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Assets Acquired</p>
              <p className="text-4xl font-black text-white tracking-tighter">{stats?.totalOrders || 0}</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
              <Package className="h-7 w-7" />
            </div>
          </div>

          <div className="glass-dark p-6 rounded-[2.5rem] border-white/5 lg:col-span-1 md:col-span-2 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 blur-3xl -z-10 group-hover:bg-secondary/20 transition-colors" />
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-secondary" />
              Investment Momentum
            </h3>
            <div className="h-[60px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.spendingTrend || []}>
                  <defs>
                     <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    fill="url(#colorSpent)"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '10px', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                    labelStyle={{ display: 'none' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-2 pl-2">
          <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
          <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">Purchase Log</h2>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-32 glass-dark rounded-[4rem] border-dashed border-white/5 relative group overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="h-24 w-24 mx-auto bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/5">
                <ShoppingBag className="h-10 w-10 text-white/10" />
              </div>
              <h2 className="text-3xl font-black text-white mb-3 tracking-tighter">Your history is clear</h2>
              <p className="text-muted-foreground font-medium mb-10 max-w-sm mx-auto">Build your luxury collection with world-class digital assets.</p>
              <Link href="/">
                <Button variant="neon" className="rounded-2xl px-12 h-14 font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                  Begin Collection
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="glass-dark border-white/5 hover:border-white/10 transition-all rounded-[2.5rem] overflow-hidden cursor-pointer group hover:bg-white/[0.02]" 
                onClick={() => router.push(`/orders/${order.orderNumber}`)}
              >
                  <div className="flex flex-col md:flex-row">
                    <div className="p-8 flex-1">
                      <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-5">
                          <div className="h-16 w-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all group-hover:border-primary/20">
                            <Package className="h-8 w-8" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Nexus Node ID</p>
                            <h3 className="text-2xl font-black text-white font-mono tracking-tight">#{order.orderNumber}</h3>
                          </div>
                        </div>
                        <Badge className={`${
                          order.status === 'PAID' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                          order.status === 'SHIPPED' ? 'bg-primary/10 text-primary border-primary/20' :
                          'bg-white/5 text-muted-foreground border-white/10'
                        } border rounded-xl px-4 py-1.5 font-black text-[10px] uppercase tracking-widest shadow-inner`}>
                          {order.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-white/20" />
                          <div>
                            <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Acquired On</p>
                            <p className="text-sm font-bold text-white/80">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-white/20" />
                          <div>
                            <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Composition</p>
                            <p className="text-sm font-bold text-white/80">{order.items?.length || 0} premium assets</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 md:col-span-1 col-span-2">
                          <CreditCard className="h-4 w-4 text-white/20" />
                          <div>
                            <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Verification</p>
                            <p className="text-sm font-bold text-white/80">{order.payment?.status || 'VALIDATED'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 dark:bg-white/[0.03] p-8 md:w-72 flex flex-col items-center justify-center text-center border-t md:border-t-0 md:border-l border-white/5 group-hover:bg-white/[0.05] transition-colors">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Total Net Valuation</p>
                      <p className="text-4xl font-black text-primary tracking-tighter shadow-primary/20 drop-shadow-md">
                        ${order.totalAmount.toLocaleString()}
                      </p>
                      <Button variant="ghost" size="sm" className="mt-6 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-white transition-colors hover:bg-white/5 border border-transparent group-hover:border-white/10">
                        Inspect Asset Receipt
                        <ChevronRight className="h-3 w-3 ml-2" />
                      </Button>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
