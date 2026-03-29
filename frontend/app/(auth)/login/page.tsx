// src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
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
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, error, clearError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      clearError();
      await login(data);
      router.push('/'); // Redirect to homepage after login
    } catch (err) {
      // Error handled by store
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/10 blur-[120px] rounded-full" />
      
      <Card className="w-full max-w-md glass-dark border-white/10 shadow-2xl relative z-10 p-4">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] mb-2">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-black tracking-tight text-white mb-2">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              Enter your credentials to access your dashboard
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500 font-bold animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-primary/20 focus:border-primary/30 transition-all"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
                <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors">Forgot?</Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-primary/20 focus:border-primary/30 transition-all"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-6 mt-4">
            <Button type="submit" className="w-full h-12 rounded-xl font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all" disabled={isLoading}>
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
            <p className="text-center text-xs font-medium text-muted-foreground">
              New to MarketHub?{' '}
              <Link href="/register" className="text-primary font-bold hover:underline underline-offset-4">
                Create an account
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
