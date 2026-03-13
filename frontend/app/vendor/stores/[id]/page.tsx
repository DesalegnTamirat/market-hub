'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Store, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface StoreWithDetails extends Store {
  products: Product[];
  _count: {
    products: number;
    orders?: number;
  };
}

export default function VendorStoreDetailsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { id } = useParams();
  const [store, setStore] = useState<StoreWithDetails | null>(null);
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

    fetchStoreDetails();
  }, [user, id]);

  const fetchStoreDetails = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<StoreWithDetails>(`/stores/${id}`);
      setStore(data);
    } catch (error) {
      console.error('Failed to fetch store details:', error);
      toast.error('Failed to load store details');
      router.push('/vendor/stores');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${productId}`);
      toast.success('Product deleted');
      fetchStoreDetails();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  if (!user || user.role !== 'VENDOR') return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading store details...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Store not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/vendor/stores"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Stores
              </Link>
              <h1 className="text-2xl font-bold">{store.name} Dashboard</h1>
            </div>
            <Link href="/vendor/products/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Store Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Total Products
              </h3>
              <div className="text-3xl font-bold">{store._count.products}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <div className="mt-2">
                <Badge
                  variant={store.isActive ? 'default' : 'secondary'}
                  className="text-sm px-3 py-1"
                >
                  {store.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Created At
              </h3>
              <div className="text-xl font-medium">
                {new Date(store.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Store Specific Products */}
        <h2 className="text-xl font-bold mb-4 border-b pb-2">
          Products in {store.name}
        </h2>

        {store.products.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">
                You have no products in this store yet.
              </p>
              <Link href="/vendor/products/new">
                <Button variant="outline">Add First Product</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {store.products.map((product) => (
              <Card key={product.id} className="overflow-hidden flex flex-col">
                <div className="aspect-square relative bg-gray-100">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <h3
                    className="font-semibold truncate mb-1"
                    title={product.name}
                  >
                    {product.name}
                  </h3>
                  <div className="text-lg font-bold text-blue-600 mb-2">
                    ${product.price.toFixed(2)}
                  </div>

                  <div className="mb-4">
                    <Badge
                      variant={product.stock > 0 ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {product.stock > 0
                        ? `${product.stock} in statck`
                        : 'Out of stock'}
                    </Badge>
                  </div>

                  <div className="flex gap-2 mt-auto pt-4 border-t">
                    <Link
                      href={`/vendor/products/${product.id}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                      >
                        View
                      </Button>
                    </Link>
                    <Link
                      href={`/vendor/products/${product.id}/edit`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
