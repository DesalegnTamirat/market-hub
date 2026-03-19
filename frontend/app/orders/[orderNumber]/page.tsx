'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CheckCircle2, Package, Clock, Truck, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
  product: {
    name: string;
    images: string[];
  };
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  shippingAddress: any;
  createdAt: string;
  items: OrderItem[];
  payment?: {
    status: string;
  };
}

export default function OrderDetailsPage() {
  const { orderNumber } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && orderNumber) {
      fetchOrder();
    }
  }, [user, orderNumber]);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<Order>(`/orders/${orderNumber}`);
      setOrder(data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center p-4 text-gray-400">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Order not found</h2>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'PROCESSING': return <Clock className="h-5 w-5 text-blue-500" />;
      case 'SHIPPED': return <Truck className="h-5 w-5 text-purple-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors pb-20">
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
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400">My Orders</Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 mb-4 animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-black">Thank you for your order!</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Order <span className="font-mono font-bold text-blue-600 dark:text-blue-400">#{order.orderNumber}</span></p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-gray-900">
              <CardHeader className="bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800">
                <CardTitle className="text-lg">Order Items</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {order.items.map((item, idx) => (
                  <div key={item.id} className={`p-4 flex gap-4 ${idx !== order.items.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}>
                    <div className="h-20 w-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex-shrink-0">
                      {item.product.images?.[0] ? (
                        <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">?</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold">{item.product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Quantity: {item.quantity}</p>
                      <p className="font-black text-blue-600 dark:text-blue-400 mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Shipping To</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{order.shippingAddress.street}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{order.shippingAddress.country}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(order.status)}
                    <span className="text-sm font-bold">{order.status}</span>
                  </div>
                  <Badge variant={order.payment?.status === 'SUCCEEDED' || order.status === 'PAID' ? 'default' : 'secondary'} className="rounded-full px-4">
                    {order.payment?.status === 'SUCCEEDED' || order.status === 'PAID' ? 'Payment Confirmed' : 'Payment Pending'}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden">
              <CardHeader className="border-b border-blue-500/50">
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-blue-100">Price Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-100">Subtotal</span>
                  <span className="font-bold">${order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-100">Shipping</span>
                  <span className="font-bold">Free</span>
                </div>
                <Separator className="bg-blue-500/50" />
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-3xl font-black">${order.totalAmount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <ShieldCheck className="h-10 w-10 text-blue-600 dark:text-blue-400 opacity-50" />
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                Your purchase is protected by <strong>MarketHub Buyer Guarantee</strong>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
