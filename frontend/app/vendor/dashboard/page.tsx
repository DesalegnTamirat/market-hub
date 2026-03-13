'use client';

import { useEffect, useState } from 'react';
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

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  stores: Store[];
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

      // Calculate stats
      const totalRevenue = orders.reduce(
        (sum: number, order) => sum + order.subtotal,
        0,
      );

      const pendingOrders = orders.filter(
        (o) => o.order.status === 'PENDING' || o.order.status === 'PAID',
      ).length;

      setStats({
        totalProducts: myProducts.length,
        totalOrders: orders.length,
        totalRevenue,
        pendingOrders,
        stores,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // ← NEW: Show loading while hydrating
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user.name}!
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">Back to Store</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link href="/vendor/products/new">
            <Button className="w-full" size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Add New Product
            </Button>
          </Link>
          <Link href="/vendor/products">
            <Button variant="outline" className="w-full" size="lg">
              <Package className="h-5 w-5 mr-2" />
              Manage Products
            </Button>
          </Link>
          <Link href="/vendor/orders">
            <Button variant="outline" className="w-full" size="lg">
              <ShoppingBag className="h-5 w-5 mr-2" />
              View Orders
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Products
              </CardTitle>
              <Package className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.totalProducts || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Active listings</p>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${stats?.totalRevenue.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-gray-500 mt-1">All time earnings</p>
            </CardContent>
          </Card>

          {/* Total Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Orders
              </CardTitle>
              <ShoppingBag className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.totalOrders || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">All time orders</p>
            </CardContent>
          </Card>

          {/* Pending Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Orders
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.pendingOrders || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        {/* My Stores */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">My Stores</h2>
            <Link href="/vendor/stores/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Store
              </Button>
            </Link>
          </div>

          {stats?.stores && stats.stores.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.stores.map((store) => (
                <Card key={store.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <StoreIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {store.name}
                          </CardTitle>
                          <Badge
                            variant={store.isActive ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {store.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2">
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
                      <Link
                        href={`/vendor/products?storeId=${store.id}`}
                        className="flex-1"
                      >
                        <Button size="sm" className="w-full">
                          Products
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <StoreIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No stores yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first store to start selling products
                </p>
                <Link href="/vendor/stores/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Store
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Tips */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          f
          <CardHeader>
            <CardTitle className="text-lg">💡 Quick Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  Keep your product listings up to date with accurate stock
                  levels
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  Respond to orders promptly to maintain good customer relations
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Upload high-quality images to attract more buyers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>
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
