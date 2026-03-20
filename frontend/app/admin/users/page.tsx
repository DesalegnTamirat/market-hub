'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'VENDOR' | 'CUSTOMER';
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<User[]>('/users');
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      toast.success('User role updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">User Management</h1>
          <p className="text-gray-500 font-medium">Control platform access and user roles</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1 rounded-2xl border border-gray-100 dark:border-gray-800">
           <Button variant="ghost" size="sm" onClick={fetchUsers} className="rounded-xl font-bold">Refresh</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <p>Loading users...</p>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">User Details</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Contact Info</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Permissions</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/10 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-black text-gray-900 dark:text-white">{user.name}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">ID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-8 py-6">
                        <Badge className={`px-3 py-0.5 rounded-full font-bold border-none ${
                          user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' :
                          user.role === 'VENDOR' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                        }`}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Select
                          defaultValue={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                        >
                          <SelectTrigger className="w-32 h-9 text-xs font-bold rounded-xl bg-gray-50 dark:bg-gray-800 border-none">
                            <SelectValue placeholder="Update Role" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                            <SelectItem value="CUSTOMER" className="font-bold">Customer</SelectItem>
                            <SelectItem value="VENDOR" className="font-bold">Vendor</SelectItem>
                            <SelectItem value="ADMIN" className="font-bold">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
