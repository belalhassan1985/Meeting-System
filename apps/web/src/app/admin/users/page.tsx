'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, ArrowLeft, Eye, Users } from 'lucide-react'
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
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="text-lg text-gray-600">جاري تحميل المستخدمين...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header with gradient */}
      <div className="mb-8 bg-gradient-to-r from-green-600 via-emerald-600 to-green-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">إدارة المستخدمين</h1>
            <p className="text-green-100 text-lg">عرض وإدارة جميع المستخدمين في النظام</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-100">النظام نشط</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-900">قائمة المستخدمين</CardTitle>
                <p className="text-sm text-gray-600 mt-1">إجمالي المستخدمين: {data?.meta?.total || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">مباشر</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {data?.data?.map((user: any) => (
              <div
                key={user.id}
                className="group bg-gradient-to-r from-white to-emerald-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-green-300 transition-all duration-300 hover:scale-[1.01]"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="font-bold text-xl text-gray-900 group-hover:text-green-600 transition-colors">
                        {user.name}
                      </h3>
                      <span className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                        مستخدم
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {user.email || 'لا يوجد بريد إلكتروني'}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg">
                        <span className="font-medium">
                          تاريخ التسجيل: {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/users/${user.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 transition-all duration-200"
                      >
                        <Eye className="h-4 w-4 ml-1" />
                        عرض
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(user.id, user.name)}
                      disabled={deleteMutation.isPending}
                      className="bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {(!data?.data || data.data.length === 0) && (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">لا يوجد مستخدمين</p>
                <p className="text-gray-400 text-sm mt-1">سيظهر المستخدمون هنا عند التسجيل</p>
              </div>
            )}
          </div>

          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-6 py-2 border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-all duration-200"
              >
                السابق
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">صفحة</span>
                <span className="font-bold text-green-600">{page}</span>
                <span className="text-sm text-gray-600">من</span>
                <span className="font-bold text-gray-900">{data.meta.totalPages}</span>
              </div>
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.meta.totalPages}
                className="px-6 py-2 border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-all duration-200"
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
