'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product, Category } from '@/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Package, Search, ChevronDown, Filter } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Filtering and Sorting state
  const [sortBy, setSortBy] = useState<string>('newest');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const { addToCart } = useCartStore();
  const { user, checkAuth, logout } = useAuthStore();

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 100);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 relative">
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10 pointer-events-none" />

      {/* Main Header - Hides on Scroll */}
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 transition-all duration-700 ease-in-out",
          isScrolled ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        <div className="max-w-7xl mx-auto glass shadow-2xl rounded-3xl p-4 md:px-8 flex items-center justify-between border-white/10">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:scale-110 transition-transform duration-500">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-white group-hover:text-glow transition-all">Market<span className="text-primary italic">Hub</span></h1>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/5 rounded-2xl p-1 pr-3 mr-4">
               <ThemeToggle />
               <div className="h-4 w-[1px] bg-white/10 mx-1" />
               <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">Marketplace</span>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/wishlist">
                  <Button variant="ghost" size="icon" className="group rounded-xl hover:bg-white/5">
                    <Heart className={cn("h-5 w-5 transition-all duration-300", wishlistedIds.size > 0 ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover:text-white")} />
                  </Button>
                </Link>
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="group rounded-xl hover:bg-white/5">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground group-hover:text-white" />
                  </Button>
                </Link>
                <div className="h-8 w-[1px] bg-white/10 mx-1" />
                <Link href={user.role === 'ADMIN' ? '/admin' : user.role === 'VENDOR' ? '/vendor/dashboard' : '#'}>
                   <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center hover:bg-primary/40 transition-all cursor-pointer overflow-hidden group/avatar">
                      <span className="text-sm font-black text-primary group-hover:scale-110 transition-transform">{user.name.charAt(0)}</span>
                   </div>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-red-500">Logout</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                   <Button variant="ghost" className="rounded-xl px-6 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white">Login</Button>
                </Link>
                <Link href="/register">
                   <Button className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.4)]">Join Now</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page Content Starts Directly with Filters/Categories */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-32 pb-24">
        {/* Simplified Header for the Page */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div>
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.8] mb-4">
                 DIGITAL <span className="text-primary italic">ASSETS</span>
              </h2>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs ml-1">Verified Global Inventory</p>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="glass px-6 py-3 rounded-2xl flex items-center gap-4 border-white/5 text-muted-foreground">
                 <Search className="h-4 w-4" />
                 <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Search Vault...</span>
              </div>
           </div>
        </div>

        {/* Sticky Filter Bar */}
        <div 
          className={cn(
            "sticky z-40 transition-all duration-500 mb-12",
            isScrolled ? "top-4" : "top-0"
          )}
        >
          <div className="glass shadow-2xl rounded-[2.5rem] p-3 md:px-8 flex flex-wrap items-center justify-between gap-4 border-white/10 backdrop-blur-2xl">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar flex-1 mr-4">
              <Button
                variant={selectedCategory === null ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={cn("rounded-2xl px-8 font-black uppercase text-[10px] tracking-widest transition-all h-10", selectedCategory === null && "shadow-lg shadow-primary/30")}
              >
                All Assets
              </Button>
              {categories
                .filter(cat => (cat as any)._count?.products > 0)
                .map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn("rounded-2xl px-8 font-black uppercase text-[10px] tracking-widest transition-all h-10 whitespace-nowrap", selectedCategory === category.id && "shadow-lg shadow-primary/30")}
                >
                  {category.name}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-4">
                <div className="h-8 w-[1px] bg-white/10 hidden md:block" />
                <div className="flex items-center gap-2 group cursor-pointer">
                   <Filter className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                   <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer"
                   >
                    <option className="bg-background" value="newest">Latest</option>
                    <option className="bg-background" value="price_asc">Price: Low</option>
                    <option className="bg-background" value="price_desc">Price: High</option>
                  </select>
                </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-[450px] glass rounded-[3rem] animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32 glass rounded-[4rem] border-white/5 border-dashed relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="h-24 w-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/10">
                <Package className="h-10 w-10 text-muted-foreground opacity-20" />
              </div>
              <h3 className="text-4xl font-black text-white mb-4 tracking-tighter">No Assets Detected</h3>
              <p className="text-muted-foreground mb-12 max-w-xs mx-auto font-bold uppercase text-[10px] tracking-widest">Adjust protocol settings to find matches</p>
              <Button 
                variant="neon" 
                onClick={() => {
                  setSelectedCategory(null);
                  setSortBy('newest');
                }}
                className="rounded-2xl px-12 h-14 font-black uppercase text-xs tracking-widest"
              >
                Reset Nexus Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <Card key={product.id} className="p-0 border-white/5 glass transition-all duration-700 hover:neon-border-purple hover:-translate-y-2 group overflow-hidden rounded-[2.5rem]">
                 <div className="aspect-[10/11] relative p-4">
                    <div className="absolute inset-4 bg-gradient-to-br from-primary/10 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {product.images[0] ? (
                      <div className="relative h-full w-full rounded-[2rem] overflow-hidden border border-white/5 group-hover:border-primary/20 transition-all">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full w-full glass rounded-[2rem]">
                        <Package className="h-12 w-12 text-white/10" />
                      </div>
                    )}
                    
                    <button
                      onClick={(e) => handleToggleWishlist(e, product.id)}
                      className="absolute top-6 right-6 p-4 glass-dark border-white/10 rounded-2xl shadow-xl hover:bg-white/10 transition-all z-20 group/heart"
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4 transition-all duration-300",
                          wishlistedIds.has(product.id)
                            ? 'fill-red-500 text-red-500 scale-125 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                            : 'text-white/40 group-hover/heart:text-white'
                        )}
                      />
                    </button>

                    <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-20">
                       <Button 
                         variant="neon"
                         className="w-full h-12 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl"
                         onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(product.id)
                         }}
                         disabled={product.stock === 0}
                       >
                         Add to Cart
                       </Button>
                    </div>
                 </div>

                 <CardContent className="p-8 pt-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                       <h3 className="font-black text-xl text-white group-hover:text-primary transition-colors line-clamp-1 tracking-tight">
                         {product.name}
                       </h3>
                       <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase px-2 tracking-widest">Premium</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest line-clamp-2 min-h-[32px] mb-6 opacity-60 group-hover:opacity-100 transition-opacity">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <span className="text-2xl font-black text-white tracking-tighter shadow-primary/20 drop-shadow-md">
                        ${product.price.toLocaleString()}
                      </span>
                      <Link href={`/products/${product.id}`}>
                        <Button variant="ghost" className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all">Details</Button>
                      </Link>
                    </div>
                 </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      {/* Decorative Bottom Glow */}
      <div className="fixed bottom-[-10%] left-1/2 -translate-x-1/2 w-[60%] h-[30%] bg-primary/5 blur-[150px] rounded-full pointer-events-none -z-10" />
    </div>
  );
}
