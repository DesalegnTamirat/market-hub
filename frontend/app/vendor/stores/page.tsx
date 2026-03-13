'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Store } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Store as StoreIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function VendorStoresPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'VENDOR') {
      router.push('/');
      return;
    }

    fetchStores();
  }, [user]);

  const fetchStores = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<Store[]>('/stores/my-stores');
      setStores(data);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
      toast.error('Failed to load stores');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'VENDOR') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading stores...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/vendor/dashboard"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold">My Stores</h1>
            </div>
            <Link href="/vendor/stores/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Store
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {stores.length === 0 ? (
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="py-12">
              <StoreIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold mb-2">No stores yet</h2>
              <p className="text-gray-600 mb-6">
                Start by creating your first store
              </p>
              <Link href="/vendor/stores/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Store
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <Link key={store.id} href={`/vendor/stores/${store.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden border">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                         <div className="bg-blue-100 p-3 rounded-lg">
                            <StoreIcon className="h-6 w-6 text-blue-600" />
                         </div>
                         <div>
                           <h3 className="font-bold text-lg">{store.name}</h3>
                           <Badge variant={store.isActive ? 'default' : 'secondary'} className="mt-1">
                             {store.isActive ? 'Active' : 'Inactive'}
                           </Badge>
                         </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                      {store.description || 'No description provided.'}
                    </p>
                    <div className="text-xs text-gray-500 pt-4 border-t">
                      Created on {new Date(store.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
