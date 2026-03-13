'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function VendorProductDetailsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
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

    fetchProduct();
  }, [user, id]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<Product>(`/products/${id}`);
      setProduct(data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Failed to load product details');
      router.push('/vendor/products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product || !confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await api.delete(`/products/${product.id}`);
      toast.success('Product deleted successfully');
      router.push('/vendor/products');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  if (!user || user.role !== 'VENDOR') return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Product not found</p>
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
                href="/vendor/products"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Link>
              <h1 className="text-2xl font-bold">Product Details</h1>
            </div>
            <div className="flex space-x-2">
              <Link href={`/vendor/products/${product.id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Image Gallery */}
            <div className="p-4 border-r">
              <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-24 w-24 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 mt-4">
                {product.images?.slice(1).map((image, i) => (
                  <div
                    key={i}
                    className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden"
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${i + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <CardContent className="p-8">
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge
                  variant={product.stock > 0 ? 'default' : 'destructive'}
                  className="text-sm px-3 py-1"
                >
                  {product.stock > 0
                    ? `${product.stock} in stock`
                    : 'Out of stock'}
                </Badge>
                {product.category && (
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {product.category.name}
                  </Badge>
                )}
              </div>

              <h2 className="text-3xl font-bold mb-4">{product.name}</h2>
              <div className="text-3xl font-bold text-blue-600 mb-8">
                ${product.price.toFixed(2)}
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Store</span>
                      <span className="font-medium">
                        {product.store?.name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Created At</span>
                      <span className="font-medium">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Product ID</span>
                      <span className="font-medium text-xs break-all">
                        {product.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </main>
    </div>
  );
}
