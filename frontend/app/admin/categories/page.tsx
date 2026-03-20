'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<Category[]>('/categories');
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/categories', formData);
      toast.success('Category created');
      setFormData({ name: '', description: '' });
      fetchCategories();
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.patch(`/categories/${id}`, formData);
      toast.success('Category updated');
      setIsEditing(null);
      setFormData({ name: '', description: '' });
      fetchCategories();
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This may affect products in this category.')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const startEdit = (category: Category) => {
    setIsEditing(category.id);
    setFormData({ name: category.name, description: category.description || '' });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Categories</h1>
          <p className="text-gray-500 font-medium">Organize your products with precision</p>
        </div>
        <Button onClick={() => { setIsEditing(null); setFormData({ name: '', description: '' }); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
          <Plus className="h-5 w-5 mr-2" /> New Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Category' : 'Create New Category'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={isEditing ? (e) => { e.preventDefault(); handleUpdate(isEditing); } : handleCreate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Electronics"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
                {isEditing ? <><Check className="h-4 w-4 mr-2" /> Update</> : <><Plus className="h-4 w-4 mr-2" /> Create</>}
              </Button>
              {isEditing && (
                <Button variant="outline" onClick={() => { setIsEditing(null); setFormData({ name: '', description: '' }); }}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {isLoading ? (
          <div className="col-span-full h-40 flex items-center justify-center bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-gray-400 font-medium animate-pulse">Fetching categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full h-40 flex items-center justify-center bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-gray-400 font-medium">No categories found. Start by creating one!</p>
          </div>
        ) : (
          categories.map((category) => (
            <Card key={category.id} className="bg-white dark:bg-gray-900 border-none shadow-sm hover:shadow-md transition-all group overflow-hidden rounded-3xl">
              <CardContent className="p-8 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-2xl tracking-tight text-gray-900 dark:text-white mb-1">{category.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 font-medium line-clamp-2">{category.description || 'No description provided'}</p>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(category)} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 rounded-full">
                    <Edit className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full" onClick={() => handleDelete(category.id)}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
