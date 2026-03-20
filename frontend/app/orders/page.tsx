'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Clock, Truck, CheckCircle2, ShoppingBag, CreditCard, TrendingUp, Calendar } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  _count: {
    items: number;
  };
}

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
  }, [user, isHydrated]);

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 flex flex-col items-center justify-center space-y-4">
        <ShoppingBag className="h-12 w-12 text-blue-500 animate-bounce" />
        <p className="text-xl font-medium animate-pulse">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors pb-24">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20 transition-all shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="group p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft className="h-6 w-6 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Purchase History</h1>
              <p className="text-sm text-gray-500 font-medium">Manage your orders and tracked payments</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' && (
              <Link href="/admin">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-sm font-bold">Admin</Button>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Customer Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-tighter mb-1">Total Spending</p>
              <p className="text-4xl font-black">${stats?.totalSpent?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center">
              <CreditCard className="h-8 w-8" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-tighter mb-1">Orders Placed</p>
              <p className="text-4xl font-black">{stats?.totalOrders || 0}</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
              <Package className="h-8 w-8" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-50 dark:border-gray-800 lg:col-span-1 md:col-span-2">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-tighter mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              30-Day Spending Trend
            </h3>
            <div className="h-[80px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.spendingTrend || []}>
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="#3b82f6"
                    fillOpacity={0.1}
                  />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                    labelStyle={{ display: 'none' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-2">
          <ShoppingBag className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-black">Your Orders</h2>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="h-24 w-24 mx-auto bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="h-12 w-12 text-gray-300 dark:text-gray-600" />
            </div>
            <h2 className="text-2xl font-black mb-2">No orders yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">Discover amazing products and start building your first purchase today.</p>
            <Link href="/">
              <Button className="rounded-full px-10 py-6 h-auto text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                Explore Market
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <Card 
                key={order.id} 
                className="group border-none shadow-sm hover:shadow-xl hover:translate-y-[-2px] transition-all bg-white dark:bg-gray-900 rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98]" 
                onClick={() => router.push(`/orders/${order.orderNumber}`)}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-6 flex-1 border-r border-gray-50 dark:border-gray-800">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 transition-colors">
                            <Package className="h-7 w-7" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Order Number</p>
                            <h3 className="text-xl font-black font-mono">#{order.orderNumber}</h3>
                          </div>
                        </div>
                        <Badge className={`${
                          order.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 
                          order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800'
                        } border-none rounded-full px-4 py-1.5 font-bold`}>
                          {order.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-gray-300" />
                          <div>
                            <p className="text-[10px] uppercase font-black text-gray-400">Date Placed</p>
                            <p className="text-sm font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-gray-300" />
                          <div>
                            <p className="text-[10px] uppercase font-black text-gray-400">Items Count</p>
                            <p className="text-sm font-bold">{order.items?.length || 0} product(s)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 md:col-span-1 col-span-2">
                          <CreditCard className="h-5 w-5 text-gray-300" />
                          <div>
                            <p className="text-[10px] uppercase font-black text-gray-400">Payment Status</p>
                            <p className="text-sm font-bold">{order.payment?.status || 'PENDING'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50/50 dark:bg-gray-800/20 p-8 md:w-64 flex flex-col items-center justify-center text-center">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Paid</p>
                      <p className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">${order.totalAmount.toFixed(2)}</p>
                      <Button variant="ghost" size="sm" className="mt-4 text-xs font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
                        View Details & Receipt
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
