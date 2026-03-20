'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Plus,
  Store as StoreIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Order, OrderItem, Product, Store } from '@/types';
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

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  stores: Store[];
  salesTrend: { date: string; revenue: number }[];
}

export default function VendorDashboardPage() {
  const router = useRouter();
  const { user, isHydrated, checkAuth } = useAuthStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wait for hydration before checking auth
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    // Now check auth
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'VENDOR') {
      router.push('/');
      toast.error('Access denied', {
        description: 'Only vendors can access this page',
      });
      return;
    }

    fetchDashboardStats();
  }, [user, isHydrated]); // ← CHANGED: Added isHydrated to dependencies

  // ← NEW: Try to refresh user if we have tokens but no user
  useEffect(() => {
    if (isHydrated && !user) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // We have a token but no user, try to fetch user
        checkAuth();
      }
    }
  }, [isHydrated, user, checkAuth]);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);

      // Fetch stores
      const { data: stores } = await api.get<Store[]>('/stores/my-stores');

      // Fetch products (we'll count them)
      const { data: products } = await api.get<Product[]>('/products');
      const myProducts = products.filter((p) =>
        stores.some((s) => s.id === p.storeId),
      );

      // Fetch vendor orders
      const { data: orders } = await api.get<OrderItem[]>(
        '/orders/vendor/my-orders',
      );

      const { data } = await api.get<DashboardStats>('/stats/vendor');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch vendor stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'VENDOR') {
    return null; // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Welcome back, {user.name}!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="outline">Back to Store</Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Products"
            value={stats?.totalProducts || 0}
            icon={<Package className="h-5 w-5" />}
            color="blue"
          />
          <StatsCard
            title="Total Revenue"
            value={`$${stats?.totalRevenue?.toFixed(2) || '0.00'}`}
            icon={<DollarSign className="h-5 w-5" />}
            color="green"
          />
          <StatsCard
            title="Total Orders"
            value={stats?.totalOrders || 0}
            icon={<ShoppingBag className="h-5 w-5" />}
            color="indigo"
          />
          <StatsCard
            title="Pending Items"
            value={stats?.pendingOrders || 0}
            icon={<TrendingUp className="h-5 w-5" />}
            color="orange"
          />
        </div>

        {/* Sales Chart */}
        <div className="mb-8">
          <Card className="border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
            <CardHeader className="border-b border-gray-50 dark:border-gray-800">
              <CardTitle className="text-lg font-bold">
                Revenue Trend (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.salesTrend || []}>
                    <defs>
                      <linearGradient
                        id="colorRevenueVendor"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                      className="dark:stroke-gray-800"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      tickFormatter={(str) => {
                        const d = new Date(str);
                        return d.toLocaleDateString('en-US', {
                          weekday: 'short',
                        });
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenueVendor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link href="/vendor/stores/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Store
            </Button>
          </Link>
          <Link href="/vendor/products/new">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
          <Link href="/vendor/orders">
            <Button variant="outline" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Manage Orders
            </Button>
          </Link>
        </div>

        {/* Stores Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">My Stores</h2>
            <Link
              href="/vendor/stores"
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>

          {stats?.stores && stats.stores.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.stores.map((store: any) => (
                <Card
                  key={store.id}
                  className="bg-white dark:bg-gray-900 border-none shadow-sm"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                          <StoreIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {store.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={store.isActive ? 'default' : 'secondary'}
                            >
                              {store.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {store.description || 'No description'}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/vendor/stores/${store.id}`}
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          Manage
                        </Button>
                      </Link>
                      <Link href={`/vendor/stores/${store.id}/products`}>
                        <Button variant="ghost" size="sm">
                          Products
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white dark:bg-gray-900 border-none shadow-sm">
              <CardContent className="py-12 text-center">
                <StoreIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No stores yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first store to start selling products
                </p>
                <Link href="/vendor/stores/new">
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Store
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Tips */}
        <Card className="mt-12 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg">💡 Quick Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-black">•</span>
                <span className="font-medium">
                  Keep your inventory updated to avoid order cancellations
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-black">•</span>
                <span className="font-medium">
                  Use detailed descriptions to reduce customer questions
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple:
      'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange:
      'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    green:
      'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    indigo:
      'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  };

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-300">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-black mt-2">{value}</p>
        </div>
        <div
          className={`p-4 rounded-2xl ${colorClasses[color] || colorClasses.blue}`}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
