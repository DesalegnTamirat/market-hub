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
import { cn } from '@/lib/utils';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 glass-dark rounded-3xl" />
          ))}
        </div>
        <div className="h-[400px] glass-dark rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Platform <span className="text-primary underline decoration-primary/30 underline-offset-8">Insight</span></h1>
          <p className="text-muted-foreground font-medium mt-2">Monitoring growth and performance metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-white">
        <StatsCard
          title="Revenue"
          value={`$${stats?.totalRevenue?.toLocaleString() || '0'}`}
          icon={<DollarSign className="h-4 w-4" />}
          trend={stats?.revenueTrend || []}
          dataKey="revenue"
          color="purple"
        />
        <StatsCard
          title="Sales"
          value={stats?.totalOrders || 0}
          icon={<ShoppingBag className="h-4 w-4" />}
          trend={stats?.revenueTrend || []} // Using same for demo if specific not avail
          dataKey="revenue"
          color="cyan"
        />
        <StatsCard
          title="Orders"
          value={stats?.totalProducts || 0}
          icon={<Package className="h-4 w-4" />}
          trend={stats?.revenueTrend || []}
          dataKey="revenue"
          color="blue"
        />
        <StatsCard
          title="Growth"
          value="+2.50%"
          icon={<TrendingUp className="h-4 w-4" />}
          trend={stats?.revenueTrend || []}
          dataKey="revenue"
          color="cyan"
        />
      </div>

      {/* Main Chart Section */}
      <Card className="p-0 border-white/5 overflow-hidden">
        <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
           <div>
              <CardTitle className="text-xl font-bold text-white">System Analytics</CardTitle>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Revenue and engagement over time</p>
           </div>
           <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              <span className="text-xs font-bold text-muted-foreground uppercase">Revenue Trend</span>
           </div>
        </CardHeader>
        <CardContent className="p-8">
           <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={stats?.revenueTrend || []}>
                    <defs>
                       <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.65 0.28 300)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="oklch(0.65 0.28 300)" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                       dataKey="date" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }}
                       tickFormatter={(str) => {
                          const d = new Date(str);
                          return d.toLocaleDateString('en-US', { weekday: 'short' });
                       }}
                    />
                    <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }}
                       tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip 
                       contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '16px',
                          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                       }}
                       itemStyle={{ color: 'oklch(0.65 0.28 300)', fontWeight: 'bold' }}
                    />
                    <Area 
                       type="monotone" 
                       dataKey="revenue" 
                       stroke="oklch(0.65 0.28 300)" 
                       strokeWidth={4} 
                       fillOpacity={1} 
                       fill="url(#colorRevenue)" 
                    />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <Card className="p-8 border-white/5">
            <h3 className="text-lg font-bold text-white mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
               <Link href="/admin/users" className="group">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all duration-300">
                     <Users className="h-6 w-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
                     <p className="font-bold text-sm text-white">Users</p>
                     <p className="text-[10px] text-muted-foreground mt-1">Manage accounts</p>
                  </div>
               </Link>
               <Link href="/admin/categories" className="group">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-secondary/10 hover:border-secondary/20 transition-all duration-300">
                     <Layers className="h-6 w-6 text-secondary mb-3 group-hover:scale-110 transition-transform" />
                     <p className="font-bold text-sm text-white">Categories</p>
                     <p className="text-[10px] text-muted-foreground mt-1">Organize shop</p>
                  </div>
               </Link>
            </div>
         </Card>

         <Card className="p-8 border-white/5">
            <h3 className="text-lg font-bold text-white mb-6">Order Summary</h3>
            <div className="space-y-4">
               {stats?.ordersByStatus?.map((item: any) => (
                  <div key={item.status} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className={cn(
                           "h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]",
                           item.status === 'DELIVERED' ? 'text-secondary bg-secondary' :
                           item.status === 'PENDING' ? 'text-orange-500 bg-orange-500' :
                           'text-primary bg-primary'
                        )} />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{item.status}</span>
                     </div>
                     <span className="text-sm font-black text-white">{item._count}</span>
                  </div>
               ))}
            </div>
         </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, trend, dataKey, color }: { title: string, value: string | number, icon: React.ReactNode, trend: any[], dataKey: string, color: 'purple' | 'cyan' | 'blue' }) {
  const chartColor = color === 'purple' ? 'oklch(0.65 0.28 300)' : color === 'cyan' ? 'oklch(0.7 0.18 200)' : 'oklch(0.65 0.25 240)';
  
  return (
    <Card className="p-6 border-white/5 hover:neon-border-purple transition-all duration-500 group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{title}</p>
          <p className="text-2xl font-black mt-1 group-hover:text-glow transition-all">{value}</p>
        </div>
        <div className={cn(
           "p-2 rounded-xl border border-white/10 glass-dark group-hover:scale-110 transition-transform",
           color === 'purple' ? 'text-primary' : 'text-secondary'
        )}>
          {icon}
        </div>
      </div>
      
      <div className="h-16 w-full -mb-2">
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
               <defs>
                  <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor={chartColor} stopOpacity={0.2}/>
                     <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                  </linearGradient>
               </defs>
               <Area 
                  type="monotone" 
                  dataKey={dataKey} 
                  stroke={chartColor} 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill={`url(#grad-${title})`} 
               />
            </AreaChart>
         </ResponsiveContainer>
      </div>
    </Card>
  );
}
