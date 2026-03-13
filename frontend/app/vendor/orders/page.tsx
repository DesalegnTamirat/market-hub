'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Order, OrderItem } from '@/types';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  PAID: 'bg-blue-100 text-blue-800 border-blue-300',
  PROCESSING: 'bg-purple-100 text-purple-800 border-purple-300',
  SHIPPED: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  DELIVERED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
  REFUNDED: 'bg-gray-100 text-gray-800 border-gray-300',
};

export default function VendorOrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'VENDOR') {
      router.push('/');
      return;
    }

    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<OrderItem[]>('/orders/vendor/my-orders');
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders(); // Refresh list
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  // Group order items by order
  const groupedOrders = orders.reduce(
    (acc, item) => {
      const orderId = item.orderId;
      if (!acc[orderId]) {
        acc[orderId] = {
          order: item.order,
          items: [],
          total: 0,
        };
      }
      acc[orderId].items.push(item);
      acc[orderId].total += item.subtotal;
      return acc;
    },
    {} as Record<
      string,
      {
        order: Order;
        items: OrderItem[];
        total: number;
      }
    >,
  );

  if (!user || user.role !== 'VENDOR') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/vendor/dashboard"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold">My Orders</h1>
              <p className="text-sm text-gray-600 mt-1">
                Orders containing your products
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {Object.keys(groupedOrders).length === 0 ? (
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
              <p className="text-gray-600 mb-6">
                Orders will appear here when customers buy your products
              </p>
              <Link href="/vendor/products">
                <Button>View My Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.values(groupedOrders).map((group) => (
              <Card key={group.order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{group.order.orderNumber}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Placed on{' '}
                        {new Date(group.order.createdAt).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          },
                        )}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        statusColors[
                          group.order.status as keyof typeof statusColors
                        ]
                      }
                    >
                      {group.order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {group.items.map((item: OrderItem) => (
                      <div key={item.id} className="flex justify-between">
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Store: {item.storeName}
                          </p>
                        </div>
                        <p className="font-semibold">
                          ${item.subtotal.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Shipping Address */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-sm mb-2">
                        Shipping Address
                      </h3>
                      <p className="text-sm text-gray-600">
                        {group.order.shippingAddress.street}
                        <br />
                        {group.order.shippingAddress.city},{' '}
                        {group.order.shippingAddress.state}{' '}
                        {group.order.shippingAddress.zipCode}
                        <br />
                        {group.order.shippingAddress.country}
                        <br />
                        Phone: {group.order.shippingAddress.phone}
                      </p>
                    </div>

                    {/* Update Status */}
                    <div>
                      <h3 className="font-semibold text-sm mb-2">
                        Update Order Status
                      </h3>
                      <Select
                        value={group.order.status}
                        onValueChange={(value) =>
                          handleStatusUpdate(group.order.id, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="PAID">Paid</SelectItem>
                          <SelectItem value="PROCESSING">Processing</SelectItem>
                          <SelectItem value="SHIPPED">Shipped</SelectItem>
                          <SelectItem value="DELIVERED">Delivered</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          <SelectItem value="REFUNDED">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Your Earnings */}
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold">Your Items Total</span>
                    <span className="font-bold text-xl">
                      ${group.total.toFixed(2)}
                    </span>
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
