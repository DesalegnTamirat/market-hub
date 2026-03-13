'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { api, uploadApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Category, Product, Store } from '@/types';

const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  storeId: z.string().min(1, 'Please select a store'),
  categoryId: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const { id } = useParams();

  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const selectedStoreId = watch('storeId');
  const selectedCategoryId = watch('categoryId');

  useEffect(() => {
    if (!isHydrated) return;

    if (!user || user.role !== 'VENDOR') {
      router.push('/login');
      return;
    }

    fetchProductData();
  }, [user, isHydrated, id]);

  const fetchProductData = async () => {
    try {
      setIsLoading(true);
      const [productRes, storesRes, categoriesRes] = await Promise.all([
        api.get<Product>(`/products/${id}`),
        api.get('/stores/my-stores'),
        api.get('/categories'),
      ]);

      const product = productRes.data;
      setStores(storesRes.data);
      setCategories(categoriesRes.data);

      reset({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        storeId: product.storeId,
        categoryId: product.categoryId || undefined,
      });

      if (product.images) {
        setExistingImages(product.images);
      }
    } catch (error) {
      console.error('Failed to fetch product data:', error);
      toast.error('Failed to load product details');
      router.push('/vendor/products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    // Limit to 5 total images
    if (existingImages.length + images.length + fileArray.length > 5) {
      toast.error('Maximum 5 images allowed total');
      return;
    }

    const validFiles = fileArray.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    setImages([...images, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);

    try {
      // Create product payload with existing remote images that are kept
      const productData = {
        ...data,
        categoryId: selectedCategoryId,
        images: existingImages, // send kept images to the backend (may require backend change if it replaces full array, but usually frontend passes current list and appends)
      };

      await api.patch(`/products/${id}`, productData);

      // Upload newly added images if any
      if (images.length > 0) {
        const formData = new FormData();
        formData.append('productId', id);
        images.forEach((image) => {
          formData.append('images', image);
        });
        await uploadApi.post('/upload/product-images', formData);
      }

      toast.success('Product updated successfully!');
      router.push(`/vendor/products/${id}`);
    } catch (error: any) {
      console.error('Failed to update product:', error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'VENDOR') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Link
            href={`/vendor/products/${id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Product Page
          </Link>
          <h1 className="text-2xl font-bold">Edit Product</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. iPhone 15 Pro"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product..."
                  rows={4}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('price', { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.price.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="stock">Stock Quantity *</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="0"
                    {...register('stock', { valueAsNumber: true })}
                  />
                  {errors.stock && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.stock.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="storeId">Store *</Label>
                <Select
                  value={selectedStoreId}
                  onValueChange={(value) => setValue('storeId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.storeId && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.storeId.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="categoryId">Category (Optional)</Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={(value) => setValue('categoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <p className="text-sm text-gray-600">
                Upload up to 5 images total (max 5MB each)
              </p>
            </CardHeader>
            <CardContent>
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">
                    Existing Images
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingImages.map((src, index) => (
                      <div
                        key={`exist-${index}`}
                        className="relative aspect-square"
                      >
                        <img
                          src={src}
                          className="w-full h-full object-cover rounded-lg"
                          alt=""
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {imagePreviews.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">New Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div
                        key={`new-${index}`}
                        className="relative aspect-square"
                      >
                        <img
                          src={preview}
                          alt=""
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {existingImages.length + images.length < 5 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-2">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <Label
                    htmlFor="images"
                    className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Click to upload images
                  </Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {existingImages.length + images.length}/5 images
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
