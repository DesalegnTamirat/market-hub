// src/app/products/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product, Review } from '@/types';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, ArrowLeft, Minus, Plus, Star, Heart, CheckCircle2, Package } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  const { addToCart } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  useEffect(() => {
    if (user && id) {
      checkWishlistStatus();
    }
  }, [user, id]);

  const checkWishlistStatus = async () => {
    try {
      const { data } = await api.get<{ isWishlisted: boolean }>(`/wishlist/check/${id}`);
      setIsWishlisted(data.isWishlisted);
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await api.get<Review[]>(`/reviews/product/${id}`);
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<Product>(`/products/${id}`);
      setProduct(data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await addToCart({ productId: product!.id, quantity });
      toast.success('Added to cart', {
        description: `${quantity} item(s) added successfully`,
      });
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    setIsTogglingWishlist(true);
    try {
      const { data } = await api.post<{ added: boolean }>('/wishlist/toggle', { productId: product!.id });
      setIsWishlisted(data.added);
      toast.success(data.added ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (error) {
      toast.error('Failed to update wishlist');
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }
    
    setIsSubmittingReview(true);
    try {
      await api.post('/reviews', {
        productId: product!.id,
        rating,
        comment
      });
      toast.success('Review submitted successfully');
      setComment('');
      setRating(5);
      fetchReviews();
      fetchProduct(); // to update average rating
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || 'Failed to submit review. You can only review products you have purchased, and only once.';
      toast.error(msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-20 overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[150px] rounded-full -z-10" />
      <div className="absolute bottom-[20%] left-[-10%] w-[30%] h-[50%] bg-secondary/10 blur-[120px] rounded-full -z-10" />

      <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto glass shadow-2xl rounded-3xl p-4 md:px-8 flex items-center justify-between border-white/10">
          <div className="flex items-center gap-6">
            <Link href="/" className="group p-2 rounded-xl border border-white/5 hover:bg-white/5 transition-all">
              <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-white transition-colors" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white">Market<span className="text-primary italic">Hub</span></span>
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
      <div className="pt-28" />

      {/* Product Detail Content */}
      <main className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Image Gallery */}
          <div className="space-y-6 sticky top-32">
            <div className="aspect-square relative glass rounded-[2.5rem] overflow-hidden border-white/10 group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              {product.images[selectedImage] ? (
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="h-20 w-20 text-white/5" />
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "aspect-square relative rounded-2xl overflow-hidden glass transition-all duration-300 border-2",
                      selectedImage === index
                        ? 'border-primary shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-105'
                        : 'border-white/5 hover:border-white/20'
                    )}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8 py-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                {product.category && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1 rounded-full font-bold uppercase tracking-[0.1em] text-[10px]">
                    {product.category.name}
                  </Badge>
                )}
                <Badge className="bg-secondary/20 text-secondary border-none font-black text-[10px] px-3 py-1 rounded-full">PREMIUM ASSET</Badge>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter leading-[0.9] text-white">
                {product.name}
              </h1>

              <div className="flex items-center gap-6 mb-8 group">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                   <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-black text-white">
                      {product.store?.name.charAt(0) || 'S'}
                   </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Store</p>
                  <p className="font-black text-white group-hover:text-primary transition-colors cursor-pointer">{product.store?.name}</p>
                </div>
                <div className="ml-auto flex items-center gap-1 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                   <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                   <span className="font-black text-white">{product.averageRating?.toFixed(1) || '5.0'}</span>
                   <span className="text-xs text-muted-foreground ml-1">({product.reviewCount || 0} reviews)</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 items-end mb-10">
                <div className="p-6 rounded-[2rem] glass-dark border-white/5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Investment</p>
                  <p className="text-5xl font-black tracking-tight text-white flex items-start">
                    <span className="text-2xl mt-1 mr-1 text-primary">$</span>
                    {product.price.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-6 py-4 rounded-[2rem] mb-2 shadow-[0_0_30px_rgba(34,197,94,0.05)]">
                   <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                   <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Available License</span>
                </div>
              </div>

              <div className="glass-dark p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group border border-white/5 mb-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">Documentation</h2>
                <p className="text-sm text-white/70 leading-relaxed font-medium">
                  {product.description || "No detailed description provided for this premium asset."}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center glass-dark border-white/10 rounded-2xl p-2 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="h-10 w-10 rounded-xl hover:bg-white/5"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-8 font-black text-white text-lg">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={incrementQuantity}
                  disabled={quantity >= product.stock}
                  className="h-10 w-10 rounded-xl hover:bg-white/5"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                className="flex-1 w-full h-14 rounded-[1.25rem] font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all"
                size="lg"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="h-5 w-5 mr-3" />
                Add to Cart
              </Button>
              
              <Button
                variant="glass"
                size="icon"
                onClick={handleToggleWishlist}
                disabled={isTogglingWishlist}
                className={cn(
                   "h-14 w-14 rounded-[1.25rem] border-white/5",
                   isWishlisted ? 'text-red-500 border-red-500/30 bg-red-500/10' : ''
                )}
              >
                <Heart className={cn("h-6 w-6 transition-all", isWishlisted ? 'fill-current shadow-[0_0_15px_rgba(239,68,68,0.5)]' : '')} />
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-4">
               {[
                  { label: "Secured Pay", icon: CheckCircle2 },
                  { label: "Verified Shop", icon: CheckCircle2 },
                  { label: "Instant Delivery", icon: CheckCircle2 }
               ].map((badge, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-4 glass-dark rounded-2xl border-white/5 text-center">
                     <badge.icon className="h-5 w-5 text-primary opacity-60" />
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{badge.label}</span>
                  </div>
               ))}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-32">
          <div className="flex items-end justify-between mb-12">
             <div>
                <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Consumer <span className="text-primary italic">Feedback</span></h2>
                <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">What creators say about this asset</p>
             </div>
             <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent mx-8 hidden md:block" />
          </div>

          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Reviews List */}
            <div className="lg:col-span-7 space-y-6">
              {reviews.length === 0 ? (
                <div className="glass-dark border-dashed border-white/10 p-20 rounded-[3rem] text-center">
                   <Star className="h-10 w-10 text-white/5 mx-auto mb-4" />
                   <p className="text-muted-foreground font-bold tracking-tight">No consumer feedback yet.<br/>Be the first to share your experience.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="glass-dark p-6 rounded-3xl border-white/5 hover:border-white/10 transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-bold text-xs text-white">
                             {review.user?.name.charAt(0)}
                          </div>
                          <div>
                             <p className="font-black text-sm text-white">{review.user?.name}</p>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/10'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed font-medium pl-1">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write a Review - Glass UI */}
            <div className="lg:col-span-5">
              <div className="sticky top-32 glass border-primary/20 p-8 rounded-[3rem] shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10" />
                <h3 className="text-2xl font-black text-white mb-6">Rate this <span className="text-secondary italic">Asset</span></h3>
                
                {!user ? (
                  <div className="text-center py-10 bg-white/5 rounded-3xl border border-white/5">
                    <p className="text-muted-foreground font-bold mb-6 text-sm">Authenticated users only</p>
                    <Button variant="neon" onClick={() => router.push('/login')} className="px-8 rounded-xl font-bold uppercase text-xs tracking-widest">Sign In to Rate</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 ml-1">Asset Score</label>
                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 group/rating justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setRating(star)}
                            className="transition-transform active:scale-95"
                          >
                            <Star
                              className={cn(
                                "h-10 w-10 transition-all duration-300",
                                star <= rating
                                  ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]'
                                  : 'text-white/10 hover:text-yellow-400/40'
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">Review Statement</label>
                      <Textarea 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your creative experience..."
                        className="min-h-[140px] bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 p-4 transition-all resize-none"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmittingReview}
                      className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest group overflow-hidden relative shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                    >
                      <span className="relative z-10">{isSubmittingReview ? 'Processing...' : 'Broadcast Review'}</span>
                    </Button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
