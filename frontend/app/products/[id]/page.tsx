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
import { ShoppingCart, ArrowLeft, Minus, Plus, Star, Heart, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors pb-20">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20 transition-all shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="group p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft className="h-6 w-6 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
            </Link>
            <h1 className="text-xl font-black tracking-tighter text-blue-600 dark:text-blue-400">MarketHub</h1>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' && (
              <Link href="/admin">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-sm font-bold">Admin Panel</Button>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Product Detail */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden border dark:border-gray-800">
              {product.images[selectedImage] ? (
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">No image</p>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square relative bg-white dark:bg-gray-900 rounded border-2 overflow-hidden transition-all ${
                      selectedImage === index
                        ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900/40'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
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
          <div className="space-y-6">
            {/* Title and Price */}
            <div>
              <h1 className="text-4xl font-black mb-4 tracking-tight leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 mb-6">
                {product.category && (
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none px-4 py-1 rounded-full font-bold">
                    {product.category.name}
                  </Badge>
                )}
                {product.store && (
                  <Link href={`/stores/${product.store.id}`} className="text-sm font-bold text-gray-400 hover:text-blue-500 transition-colors">
                    by {product.store.name}
                  </Link>
                )}
              </div>
              
              <div className="flex items-end gap-6 mb-8">
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Price</p>
                  <p className="text-5xl font-black tracking-tighter text-blue-600 dark:text-blue-400">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
                <div className="pb-1">
                  {product.stock > 0 ? (
                    <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-2xl border border-green-100 dark:border-green-900/40">
                      <CheckCircle2 className="h-5 w-5" />
                      In Stock ({product.stock})
                    </div>
                  ) : (
                    <Badge variant="destructive" className="px-4 py-2 rounded-2xl font-bold">Out of Stock</Badge>
                  )}
                </div>
              </div>
              
              {/* Product Rating Summary */}
              {product.reviewCount !== undefined && product.reviewCount > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(product.averageRating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {product.averageRating?.toFixed(1)} ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Store Info */}
            {product.store && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Seller</h2>
                <p className="text-gray-600 dark:text-gray-400">{product.store.name}</p>
              </div>
            )}

            <Separator />

            {/* Quantity Selector */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Quantity</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-6 py-2 font-semibold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={incrementQuantity}
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total: ${(product.price * quantity).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Card className="bg-gray-50 dark:bg-gray-900/50 border-none shadow-none">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleToggleWishlist}
                    disabled={isTogglingWishlist}
                    className={isWishlisted ? 'text-red-500 border-red-500 hover:bg-red-50' : ''}
                  >
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </Button>
                </div>
                {!user && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-3">
                    Please login to add items to cart
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 pt-8 border-t dark:border-gray-800">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          <div className="grid md:grid-cols-2 gap-12">
            
            {/* Reviews List */}
            <div>
              {reviews.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to review this product!</p>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 pb-6 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold">{review.user?.name}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write a Review Form */}
            <div>
              <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-none">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
                  {!user ? (
                    <div className="text-center py-6">
                      <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to write a review for this product.</p>
                      <Button onClick={() => router.push('/login')}>Login to Review</Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                        <div className="flex items-center gap-1 cursor-pointer">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              onClick={() => setRating(star)}
                              className={`h-8 w-8 transition-colors ${
                                star <= rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300 dark:text-gray-700 hover:text-yellow-200 dark:hover:text-yellow-900'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Your Review (optional)
                        </label>
                        <Textarea 
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="What did you like or dislike?"
                          className="min-h-[120px] bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={isSubmittingReview}
                        className="w-full"
                      >
                        {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
