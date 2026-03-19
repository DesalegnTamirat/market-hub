'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Clock, Truck, CheckCircle2, ShoppingBag } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchOrders();
    }
  }, [user, isHydrated]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<Order[]>('/orders/my-orders');
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHydrated || isLoading) {
    return <div className="min-h-screen flex items-center justify-center p-4 text-gray-400">Loading your orders...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-20">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10 transition-colors">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold italic tracking-tight text-blue-600 dark:text-blue-400">MarketHub</h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'ADMIN' && (
              <Link href="/admin">
                <Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800">Admin Panel</Button>
              </Link>
            )}
            <h1 className="text-lg font-bold mr-2">My Orders</h1>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Looks like you haven't made any purchases yet.</p>
            <Link href="/">
              <Button className="rounded-full px-8">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="border-none shadow-sm overflow-hidden bg-white dark:bg-gray-900 hover:ring-2 hover:ring-blue-100 dark:hover:ring-blue-900/40 transition-all cursor-pointer" onClick={() => router.push(`/orders/${order.orderNumber}`)}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Package className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">#{order.orderNumber}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest">Amount</p>
                        <p className="text-lg font-black">${order.totalAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <Badge className={`${order.status === 'PAID' ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500'} rounded-full px-4 py-1`}>
                          {order.status}
                        </Badge>
                      </div>
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
