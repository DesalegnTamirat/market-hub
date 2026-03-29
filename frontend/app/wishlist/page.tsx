'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeartOff, ShoppingCart, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { Product } from '@/types';

interface WishlistItem {
  id: string;
  createdAt: string;
  product: Product;
}

export default function WishlistPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const { addToCart } = useCartStore();

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      router.push('/login');
      return;
    }

    fetchWishlist();
  }, [user, isHydrated]);

  const fetchWishlist = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<WishlistItem[]>('/wishlist');
      setWishlistItems(data);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      const { data } = await api.post<{ added: boolean }>('/wishlist/toggle', { productId });
      if (!data.added) {
        setWishlistItems((prev) => prev.filter((item) => item.product.id !== productId));
        toast.success('Removed from wishlist');
      }
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart({ productId: product.id, quantity: 1 });
      toast.success('Added to cart');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading wishlist...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <header className="shadow dark:shadow-gray-600">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-2xl font-bold">My Wishlist</h1>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'ADMIN' && (
                <Link href="/admin">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-sm">Admin Panel</Button>
                </Link>
              )}
              <Link href="/">
                <Button variant="ghost" size="sm">
                  Continue Shopping
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {wishlistItems.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-800">
            <HeartOff className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Explore our products and find something you like!</p>
            <Link href="/">
              <Button>Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="overflow-hidden flex flex-col">
                <Link href={`/products/${item.product.id}`}>
                  <div className="aspect-square relative bg-gray-200">
                    {item.product.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400">No image</p>
                      </div>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4 flex flex-col flex-1 border-t">
                  <Link href={`/products/${item.product.id}`}>
                    <h3 className="font-semibold text-lg hover:text-blue-600 line-clamp-1">
                      {item.product.name}
                    </h3>
                  </Link>
                  <div className="mt-2 flex items-center justify-between mb-4">
                    <span className="text-xl font-bold">
                      ${item.product.price.toFixed(2)}
                    </span>
                    <span className="text-sm">
                      {item.product.stock > 0 ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          In Stock
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Out of Stock</Badge>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-auto pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 border-red-200 dark:border-red-900/30"
                      onClick={() => handleRemoveFromWishlist(item.product.id)}
                    >
                      <HeartOff className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleAddToCart(item.product)}
                      disabled={item.product.stock === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Cart
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
