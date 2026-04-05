'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, Edit2, X, Check, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_BASE = `${API_URL}/api`

export default function AdminsManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ username: '', password: '', name: '', email: '' })
  const queryClient = useQueryClient()

  const { data: admins, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_BASE}/admin/admin-users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch admin users')
      return res.json()
    },
  })

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_BASE}/admin/admin-users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add admin user')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setShowAddDialog(false)
      setFormData({ username: '', password: '', name: '', email: '' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_BASE}/admin/admin-users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update admin user')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setEditingId(null)
      setFormData({ username: '', password: '', name: '', email: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_BASE}/admin/admin-users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete admin user')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const handleAdd = () => {
    if (formData.username && formData.password && formData.name) {
      addMutation.mutate(formData)
    }
  }

  const handleUpdate = (id: string) => {
    const updateData: any = { name: formData.name }
    if (formData.email) {
      updateData.email = formData.email
    }
    if (formData.password) {
      updateData.password = formData.password
    }
    updateMutation.mutate({ id, data: updateData })
  }

  const handleDelete = (id: string, username: string) => {
    if (confirm(`هل أنت متأكد من حذف المسؤول "${username}"؟`)) {
      deleteMutation.mutate(id)
    }
  }

  const startEdit = (admin: any) => {
    setEditingId(admin.id)
    setFormData({ username: admin.username, password: '', name: admin.name, email: admin.email || '' })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="text-lg text-gray-600">جاري تحميل المسؤولين...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header with gradient */}
      <div className="mb-8 bg-gradient-to-r from-red-600 via-pink-600 to-red-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">إدارة المسؤولين</h1>
            <p className="text-red-100 text-lg">إضافة وتعديل وحذف مستخدمين بصلاحية مسؤول</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-100">صلاحيات إدارية</span>
            </div>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-white text-red-600 hover:bg-red-50 hover:scale-105 transition-all duration-200 shadow-lg w-full sm:w-auto"
          >
            <Plus className="h-5 w-5 ml-2" />
            <span className="font-semibold">إضافة مسؤول جديد</span>
          </Button>
        </div>
      </div>

      {/* Admins List */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-red-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Edit2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-900">قائمة المسؤولين</CardTitle>
                <p className="text-sm text-gray-600 mt-1">إجمالي المسؤولين: {admins?.length || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">نشط</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {admins?.map((admin: any) => (
              <div
                key={admin.id}
                className="group bg-gradient-to-r from-white to-red-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-red-300 transition-all duration-300 hover:scale-[1.01]"
              >
                {editingId === admin.id ? (
                  <div className="flex-1 flex gap-3">
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="الاسم"
                      className="flex-1 h-12 border-2 border-gray-200 focus:border-red-500 rounded-lg"
                    />
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="البريد الإلكتروني"
                      type="email"
                      className="flex-1 h-12 border-2 border-gray-200 focus:border-red-500 rounded-lg"
                    />
                    <Input
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="كلمة المرور الجديدة (اختياري)"
                      type="password"
                      className="flex-1 h-12 border-2 border-gray-200 focus:border-red-500 rounded-lg"
                    />
                    <Button
                      onClick={() => handleUpdate(admin.id)}
                      disabled={updateMutation.isPending}
                      className="bg-green-500 hover:bg-green-600 h-12 px-4"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setEditingId(null)}
                      variant="outline"
                      className="h-12 px-4 border-2 border-gray-300 hover:bg-gray-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Edit2 className="h-5 w-5 text-red-600" />
                        </div>
                        <h3 className="font-bold text-xl text-gray-900 group-hover:text-red-600 transition-colors">
                          {admin.name}
                        </h3>
                        <span className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                          مسؤول
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg">
                          <span className="font-medium">اسم المستخدم:</span>
                          <span>{admin.username}</span>
                        </div>
                        {admin.email && (
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg">
                            <span className="font-medium">البريد:</span>
                            <span>{admin.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg">
                          <span className="font-medium">تاريخ الإنشاء:</span>
                          <span>{new Date(admin.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEdit(admin)}
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600 transition-all duration-200"
                      >
                        <Edit2 className="h-4 w-4 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        onClick={() => handleDelete(admin.id, admin.username)}
                        variant="destructive"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        className="bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {(!admins || admins.length === 0) && (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Edit2 className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">لا يوجد مسؤولين</p>
                <p className="text-gray-400 text-sm mt-1">ابدأ بإضافة مسؤول جديد</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Admin Modal */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Plus className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">إضافة مسؤول جديد</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">اسم المستخدم *</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="username"
                className="h-12 border-2 border-gray-200 focus:border-red-500 rounded-lg"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">الاسم *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="الاسم الكامل"
                className="h-12 border-2 border-gray-200 focus:border-red-500 rounded-lg"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">البريد الإلكتروني (اختياري)</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="h-12 border-2 border-gray-200 focus:border-red-500 rounded-lg"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">كلمة المرور *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="كلمة مرور قوية"
                className="h-12 border-2 border-gray-200 focus:border-red-500 rounded-lg"
              />
            </div>
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-red-100 rounded">
                  <Users className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800 mb-1">صلاحيات المسؤول</p>
                  <p className="text-sm text-red-700">
                    سيتم إنشاء مستخدم بصلاحية <strong>ADMIN</strong> يمكنه إدارة الغرف والمستخدمين والسجلات
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-6">
              <Button
                onClick={handleAdd}
                disabled={addMutation.isPending || !formData.username || !formData.password || !formData.name}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 h-12 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {addMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري الإضافة...
                  </div>
                ) : (
                  <>
                    <Plus className="h-5 w-5 ml-2" />
                    إضافة المسؤول
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  setFormData({ username: '', password: '', name: '', email: '' })
                }}
                className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-semibold"
              >
                إلغاء
              </Button>
            </div>
            {addMutation.isError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center font-medium">
                  حدث خطأ في إضافة المسؤول
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
