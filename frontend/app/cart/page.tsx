'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, ShoppingCart, Package, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function CartPage() {
  const router = useRouter();

  const { cart, fetchCart, updateQuantity, removeFromCart, clearCart } =
    useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchCart();
  }, [user, fetchCart, router]);

  const handleUpdateQuantity = async (
    productId: string,
    newQuantity: number,
  ) => {
    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      await removeFromCart(productId);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return;

    try {
      await clearCart();
      toast.success('Cart cleared');
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  };

  if (!user) return null;

  if (!cart) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
           <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">Accessing Vault...</p>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/10 blur-[120px] rounded-full" />

        <header className="px-4 md:px-8 py-6">
          <div className="max-w-7xl mx-auto glass shadow-2xl rounded-3xl p-4 md:px-8 flex items-center justify-between border-white/10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white">MarketHub</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-32 flex flex-col items-center">
          <div className="glass-dark p-16 rounded-[4rem] text-center max-w-lg border-white/5 relative group">
             <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-colors" />
             <div className="relative z-10">
                <div className="h-24 w-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-inner">
                   <ShoppingBag className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">Your Bag is Empty</h2>
                <p className="text-muted-foreground font-medium mb-10 max-w-xs mx-auto">
                  Your luxury digital assets are waiting. Start building your collection today.
                </p>
                <Link href="/">
                  <Button variant="neon" size="lg" className="rounded-2xl px-10 h-14 font-black uppercase text-xs tracking-[0.2em]">
                    <ArrowLeft className="h-4 w-4 mr-3" />
                    Begin Exploring
                  </Button>
                </Link>
             </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-20 overflow-x-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[150px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[150px] rounded-full -z-10" />

      {/* Header */}
      <header className="px-4 md:px-8 py-6">
        <div className="max-w-7xl mx-auto glass shadow-2xl rounded-3xl p-4 md:px-8 flex items-center justify-between border-white/10">
          <div className="flex items-center gap-6">
            <Link href="/" className="group p-2 rounded-xl border border-white/5 hover:bg-white/5 transition-all">
              <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-white transition-colors" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white">MarketHub</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === 'ADMIN' && (
              <Link href="/admin" className="hidden sm:block">
                <Button variant="glass" size="sm" className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Dashboard</Button>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 md:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h1 className="text-4xl font-black text-white tracking-tighter mb-1">Your <span className="text-primary italic">Selection</span></h1>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {cart.itemCount} {cart.itemCount === 1 ? 'Asset' : 'Assets'} Reserved
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                className="text-red-500 hover:text-red-400 font-bold uppercase tracking-widest text-[10px] h-8 rounded-lg hover:bg-red-500/10"
              >
                Flush Bag
              </Button>
            </div>

            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="glass-dark p-4 md:p-6 rounded-[2.5rem] border-white/5 hover:border-white/10 transition-all group relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                   
                   <div className="flex flex-col sm:flex-row gap-6 items-center relative z-10">
                    {/* Product Image */}
                    <div className="relative w-32 h-32 bg-white/5 rounded-3xl overflow-hidden border border-white/10 group-hover:border-primary/30 transition-colors">
                      {item.product.images[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-8 w-8 text-white/10" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <Link
                        href={`/products/${item.product.id}`}
                        className="text-xl font-black text-white hover:text-primary transition-colors block leading-tight mb-2"
                      >
                        {item.product.name}
                      </Link>
                      <div className="flex items-center justify-center sm:justify-start gap-3">
                         <span className="text-sm font-bold text-muted-foreground">${item.product.price.toLocaleString()} unit cost</span>
                         {item.product.stock < 10 && item.product.stock > 0 && (
                           <Badge className="bg-orange-500/10 text-orange-500 border-none font-black text-[9px] rounded-md px-2">LOW STOCK</Badge>
                         )}
                      </div>
                    </div>

                    {/* Controls & Price */}
                    <div className="flex flex-col items-center sm:items-end gap-4">
                      <div className="flex items-center glass p-1 rounded-xl border-white/5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-8 w-8 rounded-lg hover:bg-white/5"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="px-4 font-black text-white">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="h-8 w-8 rounded-lg hover:bg-white/5"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="text-center sm:text-right">
                        <p className="text-2xl font-black text-primary tracking-tighter">
                          ${(item.product.price * item.quantity).toLocaleString()}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="text-red-500/60 hover:text-red-500 p-0 h-auto mt-1 uppercase text-[9px] font-black tracking-widest"
                        >
                          Discard
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-32">
            <div className="glass border-primary/20 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10" />
               <h2 className="text-2xl font-black text-white mb-8 tracking-tighter">Investment <span className="text-secondary italic">Summary</span></h2>
               
               <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Subtotal</span>
                    <span className="font-black text-white">${cart.subtotal.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center px-4">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Protocol Fee</span>
                    <span className="text-xs font-bold text-green-500 uppercase">Waived</span>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

                  <div className="flex justify-between items-end px-4 mb-8">
                    <span className="text-xs font-black text-white uppercase tracking-widest">Total Valuation</span>
                    <span className="text-4xl font-black text-white tracking-tighter shadow-primary/20 drop-shadow-lg">
                      ${cart.subtotal.toLocaleString()}
                    </span>
                  </div>

                  <Link href="/checkout">
                    <Button variant="neon" className="w-full h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-[0_0_30px_rgba(168,85,247,0.4)] group" size="lg">
                      Complete Acquisition
                    </Button>
                  </Link>

                  <div className="flex items-center justify-center gap-2 pt-4">
                     <CheckCircle2 className="h-4 w-4 text-primary opacity-50" />
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Secured by MarketHub Protocol</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
