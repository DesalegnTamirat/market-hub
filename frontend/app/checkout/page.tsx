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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CreditCard, Ship, CheckCircle2 } from 'lucide-react';
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
        // 1. Create Order (Draft/Pending)
        const { data: order } = await api.post('/orders', {
          shippingAddress,
        });
        currentOrderId = order.id;
        currentOrderNumber = order.orderNumber;

        // 2. Create Payment Intent
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

      // 3. Confirm Payment
      const result = await stripe.confirmCardPayment(currentClientSecret!, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            address: {
              line1: shippingAddress.street,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.zipCode,
              country: 'US', // Mapping might be needed
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
          toast.success('Payment successful! Your order is being processed.');
          // Cart is cleared by backend webhook, but we clear it locally to sync
          await clearCart();
          router.push(`/orders/${currentOrderNumber}`);
        }
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Checkout failed');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg bg-gray-50/50">
        <Label className="text-sm font-medium mb-2 block">Card Details</Label>
        <div className="bg-white dark:bg-gray-950 p-3 border dark:border-gray-800 rounded-md">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#9ca3af', // Gray-400 for consistency in dark/light (adaptive would be better but this is safe)
                  '::placeholder': { color: '#6b7280' },
                },
                invalid: { color: '#ef4444' },
              },
            }}
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full py-6 text-lg"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
      </Button>
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
  }, [user, authHydrated]);

  useEffect(() => {
    if (cart && cart.items.length > 0 && checkoutItems.length === 0) {
      setCheckoutItems(cart.items);
      setCheckoutSubtotal(cart.subtotal);
    }
  }, [cart]);

  if (!authHydrated || isCartLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (checkoutItems.length === 0 && !isCartLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link href="/">
          <Button>Start Shopping</Button>
        </Link>
      </div>
    );
  }

  const onShippingSubmit = (data: ShippingFormData) => {
    setShippingData(data);
    setStep('payment');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors pb-20">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/cart" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold italic tracking-tight text-blue-600 dark:text-blue-400">
              MarketHub
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4">
              <div
                className={`flex items-center gap-2 transition-colors ${step === 'shipping' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}
              >
                <Ship className="h-4 w-4" />
                <span className="text-sm font-medium">Shipping</span>
              </div>
              <div className="w-8 h-px bg-gray-200 dark:bg-gray-800" />
              <div
                className={`flex items-center gap-2 transition-colors ${step === 'payment' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}
              >
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">Payment</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'ADMIN' && (
                <Link href="/admin">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-sm font-bold">Admin</Button>
                </Link>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {step === 'shipping' ? (
              <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-gray-900">
                <CardHeader className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                  <CardTitle className="text-lg">
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form
                    onSubmit={handleSubmit(onShippingSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Input
                          id="street"
                          {...register('street')}
                          placeholder="123 Main St"
                        />
                        {errors.street && (
                          <p className="text-xs text-red-500">
                            {errors.street.message}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            {...register('city')}
                            placeholder="New York"
                          />
                          {errors.city && (
                            <p className="text-xs text-red-500">
                              {errors.city.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State / Province</Label>
                          <Input
                            id="state"
                            {...register('state')}
                            placeholder="NY"
                          />
                          {errors.state && (
                            <p className="text-xs text-red-500">
                              {errors.state.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="zipCode">Zip / Postal Code</Label>
                          <Input
                            id="zipCode"
                            {...register('zipCode')}
                            placeholder="10001"
                          />
                          {errors.zipCode && (
                            <p className="text-xs text-red-500">
                              {errors.zipCode.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            {...register('country')}
                            placeholder="United States"
                          />
                          {errors.country && (
                            <p className="text-xs text-red-500">
                              {errors.country.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        {...register('phone')}
                        placeholder="+1 234 567 8900"
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-500">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full mt-6">
                      Continue to Payment
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 bg-white dark:bg-gray-900">
                <CardHeader className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Payment Method</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('shipping')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Edit Shipping
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
                    <Ship className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                        Shipping to:
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-400">
                        {shippingData?.street}, {shippingData?.city},{' '}
                        {shippingData?.state} {shippingData?.zipCode},{' '}
                        {shippingData?.country}
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-400 font-medium mt-1">
                        Phone: {shippingData?.phone}
                      </p>
                    </div>
                  </div>
                  <Elements stripe={stripePromise}>
                    <CheckoutForm
                      shippingAddress={shippingData!}
                      totalAmount={checkoutSubtotal}
                    />
                  </Elements>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4">
            <Card className="border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden sticky top-24">
              <CardHeader className="border-b border-gray-50 dark:border-gray-800 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[40vh] overflow-y-auto px-6 py-4 space-y-4">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="h-16 w-16 rounded overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-50 dark:border-gray-700">
                        {item.product.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            ?
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Qty: {item.quantity}
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 space-y-3">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>${checkoutSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Shipping</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">Free</span>
                  </div>
                  <Separator className="my-2 bg-gray-200 dark:bg-gray-800" />
                  <div className="flex justify-between items-end">
                    <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Total
                    </span>
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      ${checkoutSubtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 flex items-center gap-2 justify-center text-xs text-gray-400 dark:text-gray-500">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Secure Checkout • Powered by Stripe
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
