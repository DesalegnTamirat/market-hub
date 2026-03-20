'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  Users,
  Package,
  Layers,
  DollarSign,
  TrendingUp,
  ShoppingBag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/stats/admin');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Admin Overview</h1>
          <p className="text-gray-500 font-medium">Real-time platform metrics and management</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        <StatsCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          icon={<Package className="h-5 w-5" />}
          color="purple"
        />
        <StatsCard
          title="Categories"
          value={stats?.totalCategories || 0}
          icon={<Layers className="h-5 w-5" />}
          color="indigo"
        />
        <StatsCard
          title="Total Revenue"
          value={`$${stats?.totalRevenue?.toFixed(2) || '0.00'}`}
          icon={<DollarSign className="h-5 w-5" />}
          color="green"
        />
      </div>

      {/* Revenue Chart */}
      <div className="mb-8">
        <Card className="border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
          <CardHeader className="border-b border-gray-50 dark:border-gray-800 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-black">Revenue Trend (Last 7 Days)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.revenueTrend || []}>
                  <defs>
                    <linearGradient id="colorRevenueAdmin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    tickFormatter={(str) => {
                      const d = new Date(str);
                      return d.toLocaleDateString('en-US', { weekday: 'short' });
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
                      borderRadius: '12px',
                      color: '#fff',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorRevenueAdmin)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
          <Link href="/admin/users">
            <Card className="hover:shadow-md transition-all cursor-pointer border-none bg-white dark:bg-gray-900 group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Manage Users</h3>
                  <p className="text-sm text-gray-500">Update roles and view activity</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/categories">
            <Card className="hover:shadow-md transition-all cursor-pointer border-none bg-white dark:bg-gray-900 group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Categories</h3>
                  <p className="text-sm text-gray-500">Create and organize categories</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Order Distribution */}
        <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
          <CardHeader className="border-b border-gray-50 dark:border-gray-800">
            <CardTitle className="text-lg font-black">Order Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {stats?.ordersByStatus?.map((item: any) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      item.status === 'DELIVERED' ? 'bg-green-500' :
                      item.status === 'PENDING' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-tighter">
                      {item.status}
                    </span>
                  </div>
                  <span className="text-sm font-black">{item._count}</span>
                </div>
              ))}
              {(!stats?.ordersByStatus || stats.ordersByStatus.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-8">No order data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  };

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-300">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-black mt-2">{value}</p>
        </div>
        <div className={`p-4 rounded-2xl ${colorClasses[color] || colorClasses.blue}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
