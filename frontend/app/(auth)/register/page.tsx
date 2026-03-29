// src/app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Validation schema
const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

import { ShoppingCart } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, error, clearError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      clearError();

      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);

      router.push('/'); // Redirect to homepage after registration
    } catch (err) {
      // Error handled by store
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/3 -right-20 w-80 h-80 bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/3 -left-20 w-80 h-80 bg-secondary/10 blur-[120px] rounded-full" />
      
      <Card className="w-full max-w-md glass-dark border-white/10 shadow-2xl relative z-10 p-2">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] mb-2">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-black tracking-tight text-white mb-2">Create Account</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              Join MarketHub and start exploring premium assets
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-2">
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500 font-bold">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                className="bg-white/5 border-white/10 rounded-xl h-11 focus:ring-primary/20 focus:border-primary/30 transition-all"
                {...register('name')}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="bg-white/5 border-white/10 rounded-xl h-11 focus:ring-primary/20 focus:border-primary/30 transition-all"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 rounded-xl h-11 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  {...register('password')}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirm</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 rounded-xl h-11 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  {...register('confirmPassword')}
                  disabled={isLoading}
                />
              </div>
            </div>
            {(errors.password || errors.confirmPassword) && (
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">
                {errors.password?.message || errors.confirmPassword?.message}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-6 mt-4">
            <Button type="submit" className="w-full h-12 rounded-xl font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Get Started'}
            </Button>
            <p className="text-center text-xs font-medium text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4">
                Login here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
