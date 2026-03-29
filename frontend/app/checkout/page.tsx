'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Ship, CheckCircle2, ShoppingCart, Lock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
);

const shippingSchema = z.object({
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'Zip code is required'),
  country: z.string().min(2, 'Country is required'),
  phone: z.string().min(10, 'Phone number is required'),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

function CheckoutForm({
  shippingAddress,
  totalAmount,
}: {
  shippingAddress: ShippingFormData;
  totalAmount: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderDetails, setOrderDetails] = useState<{
    id: string;
    orderNumber: string;
    clientSecret: string;
  } | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      let currentOrderId = orderDetails?.id;
      let currentOrderNumber = orderDetails?.orderNumber;
      let currentClientSecret = orderDetails?.clientSecret;

      if (!orderDetails) {
        const { data: order } = await api.post('/orders', {
          shippingAddress,
        });
        currentOrderId = order.id;
        currentOrderNumber = order.orderNumber;

        const {
          data: { clientSecret },
        } = await api.post('/payments/create-intent', {
          orderId: order.id,
        });
        currentClientSecret = clientSecret;

        setOrderDetails({
          id: order.id,
          orderNumber: order.orderNumber,
          clientSecret: clientSecret,
        });
      }

      const result = await stripe.confirmCardPayment(currentClientSecret!, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            address: {
              line1: shippingAddress.street,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.zipCode,
              country: 'US',
            },
            phone: shippingAddress.phone,
          },
        },
      });

      if (result.error) {
        toast.error(result.error.message);
        setIsProcessing(false);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          toast.success('Transaction secure. Assets verified.');
          await clearCart();
          router.push(`/orders/${currentOrderNumber}`);
        }
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Transaction failed');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="p-6 glass-dark border-white/10 rounded-3xl">
        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 block ml-1">Secure Card Input</Label>
        <div className="bg-white/5 p-4 border border-white/10 rounded-2xl focus-within:border-primary/50 transition-colors">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': { color: 'rgba(255,255,255,0.3)' },
                  fontFamily: 'Inter, sans-serif',
                },
                invalid: { color: '#ef4444' },
              },
            }}
          />
        </div>
      </div>
      <Button
        type="submit"
        variant="neon"
        className="w-full h-16 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_0_30px_rgba(168,85,247,0.4)]"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Verifying...' : `Finalize Valuation - $${totalAmount.toLocaleString()}`}
      </Button>
      
      <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
         <Lock className="h-3 w-3 text-primary" />
         Encrypted by MarketHub Security Protocol
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading: isCartLoading } = useCartStore();
  const { user, isHydrated: authHydrated } = useAuthStore();
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(
    null,
  );
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [checkoutSubtotal, setCheckoutSubtotal] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
  });

  useEffect(() => {
    if (authHydrated && !user) {
      router.push('/login');
    }
  }, [user, authHydrated, router]);

  useEffect(() => {
    if (cart && cart.items.length > 0 && checkoutItems.length === 0) {
      setCheckoutItems(cart.items);
      setCheckoutSubtotal(cart.subtotal);
    }
  }, [cart, checkoutItems.length]);

  if (!authHydrated || isCartLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] animate-pulse">Initializing Protocol...</p>
      </div>
    );
  }

  if (checkoutItems.length === 0 && !isCartLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-black text-white mb-6">Nexus Bag Empty</h2>
        <Link href="/">
          <Button variant="neon">Discover Assets</Button>
        </Link>
      </div>
    );
  }

  const onShippingSubmit = (data: ShippingFormData) => {
    setShippingData(data);
    setStep('payment');
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-20 relative overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[150px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[150px] rounded-full -z-10" />

      <header className="px-4 md:px-8 py-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto glass shadow-2xl rounded-3xl p-4 md:px-8 flex items-center justify-between border-white/10">
          <div className="flex items-center gap-6">
            <Link href="/cart" className="group p-2 rounded-xl border border-white/5 hover:bg-white/5 transition-all">
              <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-white transition-colors" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white">MarketHub</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 bg-white/5 px-6 py-2 rounded-2xl border border-white/5">
            <div className={cn("flex items-center gap-2 transition-all duration-500", step === 'shipping' ? 'text-primary scale-105' : 'text-muted-foreground opacity-50')}>
              <Ship className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Protocol</span>
            </div>
            <div className="w-8 h-px bg-white/10" />
            <div className={cn("flex items-center gap-2 transition-all duration-500", step === 'payment' ? 'text-primary scale-105' : 'text-muted-foreground opacity-50')}>
              <CreditCard className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Verification</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 md:px-8 py-12">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Main Action Area */}
          <div className="lg:col-span-7">
            {step === 'shipping' ? (
              <div className="glass-dark p-8 md:p-12 rounded-[3rem] border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl -z-10" />
                <div className="mb-10">
                   <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Acquisition <span className="text-primary italic">Protocol</span></h2>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stake your delivery credentials</p>
                </div>
                
                <form onSubmit={handleSubmit(onShippingSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="street" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Neural Street Address</Label>
                    <Input id="street" {...register('street')} placeholder="123 Galactic Way" className="bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-primary/20" />
                    {errors.street && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.street.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">City Sector</Label>
                      <Input id="city" {...register('city')} placeholder="New Avalon" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                      {errors.city && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.city.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">State/Domain</Label>
                      <Input id="state" {...register('state')} placeholder="NX" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                      {errors.state && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.state.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Zip/Node Code</Label>
                      <Input id="zipCode" {...register('zipCode')} placeholder="10001" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                      {errors.zipCode && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.zipCode.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Planetary Body</Label>
                      <Input id="country" {...register('country')} placeholder="Earth" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                      {errors.country && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.country.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Comms Link</Label>
                    <Input id="phone" {...register('phone')} placeholder="+1 234 567 8900" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                    {errors.phone && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.phone.message}</p>}
                  </div>

                  <Button type="submit" variant="neon" className="w-full h-16 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-primary/20 mt-4">
                    Continue to Verification
                  </Button>
                </form>
              </div>
            ) : (
              <div className="glass-dark p-8 md:p-12 rounded-[4rem] border-white/5 relative overflow-hidden group animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 blur-3xl -z-10" />
                <div className="flex items-center justify-between mb-10">
                   <div>
                      <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Vault <span className="text-secondary italic">Verification</span></h2>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Finalize asset acquisition</p>
                   </div>
                   <Button variant="ghost" size="sm" onClick={() => setStep('shipping')} className="text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-xl">Reconfigure Protocol</Button>
                </div>

                <div className="mb-10 bg-white/5 p-6 rounded-3xl border border-white/5 flex items-start gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                     <Ship className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Staged Location</p>
                    <p className="text-sm font-bold text-white leading-relaxed">
                      {shippingData?.street}, {shippingData?.city}, {shippingData?.state} {shippingData?.zipCode}
                    </p>
                  </div>
                </div>

                <Elements stripe={stripePromise}>
                  <CheckoutForm shippingAddress={shippingData!} totalAmount={checkoutSubtotal} />
                </Elements>
              </div>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="glass border-primary/20 p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10" />
               <h2 className="text-2xl font-black text-white mb-8 tracking-tighter">Acquisition <span className="text-primary italic">Ledger</span></h2>
               
               <div className="max-h-[35vh] overflow-y-auto pr-2 space-y-4 mb-8 custom-scrollbar">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 glass-dark rounded-2xl border-white/5 group hover:bg-white/5 transition-colors">
                      <div className="h-20 w-20 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="h-6 w-6 text-white/5" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate mb-1">{item.product.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quantity: {item.quantity}</p>
                        <p className="text-lg font-black text-primary tracking-tighter mt-1">${(item.product.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
               </div>

                <div className="space-y-4 border-t border-white/5 pt-6">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sub-Valuation</span>
                    <span className="font-bold text-white">${checkoutSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Protocol Fee</span>
                    <span className="text-[10px] font-black text-green-500 uppercase">Waived</span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />
                  <div className="flex justify-between items-end px-2">
                    <span className="text-xs font-black text-white uppercase tracking-widest">Total Net Asset</span>
                    <span className="text-4xl font-black text-white tracking-tighter drop-shadow-lg shadow-primary/20">
                      ${checkoutSubtotal.toLocaleString()}
                    </span>
                  </div>
                </div>
            </div>
            
            <div className="mt-8 flex flex-col items-center gap-2">
               <div className="flex items-center gap-2 px-6 py-2 glass rounded-full border-green-500/20">
                  <CheckCircle2 className="h-3 w-3 text-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">Stripe Protocol Active</span>
               </div>
               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">Authorized acquisition encrypted</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
