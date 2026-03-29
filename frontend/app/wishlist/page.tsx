'use client';

import { useEffect, useState } from 'react';
import Link from 'next/image';
import NextLink from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeartOff, ShoppingCart, ArrowLeft, Package, Trash2, Heart } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

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
  }, [user, isHydrated, router]);

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] animate-pulse">Synchronizing Desire...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-24 relative overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[150px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[150px] rounded-full -z-10" />

      <header className="px-4 md:px-8 py-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto glass shadow-2xl rounded-3xl p-4 md:px-8 flex items-center justify-between border-white/10">
          <div className="flex items-center gap-6">
            <NextLink href="/" className="group p-2 rounded-xl border border-white/5 hover:bg-white/5 transition-all">
              <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-white transition-colors" />
            </NextLink>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white">Curated <span className="text-primary italic">Favorites</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === 'ADMIN' && (
              <NextLink href="/admin" className="hidden sm:block">
                <Button variant="glass" size="sm" className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Dashboard</Button>
              </NextLink>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12">
        {wishlistItems.length === 0 ? (
          <div className="text-center py-32 glass-dark rounded-[4rem] border-dashed border-white/5 relative group overflow-hidden max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="h-24 w-24 mx-auto bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/5">
                <HeartOff className="h-10 w-10 text-white/10" />
              </div>
              <h2 className="text-3xl font-black text-white mb-3 tracking-tighter">Your wishlist is empty</h2>
              <p className="text-muted-foreground font-medium mb-10 max-w-sm mx-auto">Found something that sparks inspiration? Save it here for later.</p>
              <NextLink href="/">
                <Button variant="neon" className="rounded-2xl px-12 h-14 font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                  Discover Assets
                </Button>
              </NextLink>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlistItems.map((item) => (
              <div key={item.id} className="glass-dark border-white/5 rounded-[2.5rem] overflow-hidden group flex flex-col hover:border-white/10 transition-all hover:bg-white/[0.02]">
                <div className="aspect-square relative bg-white/5 overflow-hidden">
                  <NextLink href={`/products/${item.product.id}`}>
                    {item.product.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-12 w-12 text-white/5" />
                      </div>
                    )}
                  </NextLink>
                  <button 
                    onClick={() => handleRemoveFromWishlist(item.product.id)}
                    className="absolute top-4 right-4 h-10 w-10 glass-dark rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all border border-white/10 shadow-xl"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <NextLink href={`/products/${item.product.id}`} className="flex-1">
                      <h3 className="font-black text-white text-lg hover:text-primary transition-colors line-clamp-1 tracking-tight">
                        {item.product.name}
                      </h3>
                    </NextLink>
                  </div>
                  
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-xl font-black text-white tracking-tighter">
                      ${item.product.price.toLocaleString()}
                    </p>
                    {item.product.stock > 0 ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-black text-[9px] uppercase tracking-widest">
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="font-black text-[9px] uppercase tracking-widest">
                        Sold Out
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mt-auto">
                    <Button
                      className="w-full h-12 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-primary/10 group-hover:shadow-primary/30 transition-all"
                      onClick={() => handleAddToCart(item.product)}
                      disabled={item.product.stock === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Acquire Asset
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
