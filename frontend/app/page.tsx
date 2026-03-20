'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product, Category } from '@/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  
  // Filtering and Sorting state
  const [sortBy, setSortBy] = useState<string>('newest');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const { addToCart } = useCartStore();
  const { user, checkAuth, logout } = useAuthStore();

  useEffect(() => {
    checkAuth();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchWishlist();
    }
  }, [selectedCategory, user?.id, sortBy, minPrice, maxPrice]);

  const fetchWishlist = async () => {
    try {
      const { data } = await api.get<any[]>('/wishlist');
      setWishlistedIds(new Set(data.map((item) => item.product.id)));
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (selectedCategory) params.categoryId = selectedCategory;
      if (sortBy) params.sortBy = sortBy;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const { data } = await api.get<Product[]>('/products', { params });
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get<Category[]>('/categories');
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    try {
      await addToCart({ productId, quantity: 1 });
      toast.success('Added to cart!');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      window.location.href = '/login';
      return;
    }
    
    try {
      const { data } = await api.post<{ added: boolean }>('/wishlist/toggle', { productId });
      setWishlistedIds((prev) => {
        const next = new Set(prev);
        if (data.added) next.add(productId);
        else next.delete(productId);
        return next;
      });
      toast.success(data.added ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm transition-colors">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">MarketHub</h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Discover premium products from verified stores</p>
            </div>
            <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all">
              <ThemeToggle />
              <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1" />
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-sm text-gray-500 font-medium">
                    {user.name}
                  </span>
                  <Link href="/wishlist">
                    <Button variant="ghost" size="icon" className="relative">
                      <Heart className={`h-5 w-5 ${wishlistedIds.size > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </Link>
                  <Link href="/cart">
                    <Button variant="ghost" size="icon">
                      <ShoppingCart className="h-5 w-5" />
                    </Button>
                  </Link>
                  {user.role === 'VENDOR' && (
                    <Link href="/vendor/dashboard">
                      <Button size="sm" variant="outline">Dashboard</Button>
                    </Link>
                  )}
                  {user.role === 'ADMIN' && (
                    <Link href="/admin">
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-sm font-bold">Admin</Button>
                    </Link>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">Join</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800 sticky top-0 z-20 transition-colors">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
            <Button
              variant={selectedCategory === null ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-6 font-bold transition-all ${selectedCategory === null ? 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20' : ''}`}
            >
              All Products
            </Button>
            {categories
              .filter(cat => (cat as any)._count?.products > 0)
              .map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`rounded-full px-6 font-bold transition-all whitespace-nowrap ${selectedCategory === category.id ? 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20' : ''}`}
              >
                {category.name}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Price Range:</span>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-24 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-blue-500/20 transition-all"
                />
                <span className="text-gray-400">-</span>
                <input 
                  type="number" 
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-24 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-blue-500/20 transition-all"
                />
              </div>
              {(minPrice || maxPrice) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 mt-8">
            <div className="h-20 w-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-black mb-2">No matches found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">Try adjusting your filters or price range to find what you're looking for.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedCategory(null);
                setSortBy('newest');
                setMinPrice('');
                setMaxPrice('');
              }}
              className="rounded-full px-8 font-bold"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <Link href={`/products/${product.id}`}>
                  <div className="aspect-square relative bg-gray-200">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400">No image</p>
                      </div>
                    )}
                    <button
                      onClick={(e) => handleToggleWishlist(e, product.id)}
                      className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          wishlistedIds.has(product.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="font-semibold text-lg hover:text-blue-600">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xl font-bold">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {product.stock > 0 ? (
                        <Badge variant="outline">In Stock</Badge>
                      ) : (
                        <Badge variant="destructive">Out of Stock</Badge>
                      )}
                    </span>
                  </div>
                  {product.store && (
                    <p className="text-xs text-gray-500 mt-2">
                      by {product.store.name}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    className="w-full"
                    onClick={() => handleAddToCart(product.id)}
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
