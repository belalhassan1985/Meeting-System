'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, ArrowLeft, Eye } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_BASE = `${API_URL}/api`

export default function UsersManagement() {
  const [page, setPage] = useState(1)
  const limit = 20
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/admin/users?page=${page}&limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete user')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const handleDelete = async (userId: string, userName: string) => {
    if (confirm(`هل أنت متأكد من حذف المستخدم "${userName}"؟`)) {
      await deleteMutation.mutateAsync(userId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-lg">جاري التحميل...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="text-sm sm:text-base text-gray-600">عرض وإدارة جميع المستخدمين</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين ({data?.meta?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.data?.map((user: any) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email || 'لا يوجد بريد إلكتروني'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    تاريخ التسجيل: {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/users/${user.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(user.id, user.name)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              ))}

              {(!data?.data || data.data.length === 0) && (
                <p className="text-center text-gray-500 py-8">لا يوجد مستخدمين</p>
              )}
            </div>

            {data?.meta && data.meta.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  السابق
                </Button>
                <span className="flex items-center px-4">
                  صفحة {page} من {data.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= data.meta.totalPages}
                >
                  التالي
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}
