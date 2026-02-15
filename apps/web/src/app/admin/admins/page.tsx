'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, Edit2, X, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function AdminsManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ username: '', password: '', name: '', email: '' })
  const queryClient = useQueryClient()

  const { data: admins, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/admin-users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch admin users')
      return res.json()
    },
  })

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/admin-users`, {
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
      const res = await fetch(`${API_URL}/admin/admin-users/${id}`, {
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
      const res = await fetch(`${API_URL}/admin/admin-users/${id}`, {
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
      <div className="flex items-center justify-center py-8">
        <p className="text-lg">جاري التحميل...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المسؤولين</h1>
          <p className="text-gray-600">إضافة وتعديل وحذف مستخدمين بصلاحية مسؤول (ADMIN)</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة مسؤول جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المسؤولين ({admins?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {admins?.map((admin: any) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
              >
                {editingId === admin.id ? (
                  <div className="flex-1 flex gap-3">
                    <Input
                      placeholder="الاسم"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Input
                      placeholder="البريد الإلكتروني (اختياري)"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <Input
                      type="password"
                      placeholder="كلمة المرور الجديدة (اختياري)"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUpdate(admin.id)}
                      disabled={updateMutation.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null)
                        setFormData({ username: '', password: '', name: '', email: '' })
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{admin.name}</h3>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">ADMIN</span>
                      </div>
                      <p className="text-sm text-gray-600">@{admin.username}</p>
                      {admin.email && <p className="text-sm text-gray-500">{admin.email}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        تاريخ الإنشاء: {new Date(admin.createdAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(admin)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(admin.id, admin.username)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {(!admins || admins.length === 0) && (
              <p className="text-center text-gray-500 py-8">لا يوجد مسؤولين</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مسؤول جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">اسم المستخدم</label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="username"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الاسم</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="الاسم"
              />
            </div>
            <div>
              <label className="text-sm font-medium">البريد الإلكتروني (اختياري)</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">كلمة المرور</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="كلمة المرور"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800">
                💡 سيتم إنشاء مستخدم بصلاحية <strong>ADMIN</strong> يمكنه إدارة الغرف والمستخدمين
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAdd}
                disabled={addMutation.isPending || !formData.username || !formData.password || !formData.name}
                className="flex-1"
              >
                إضافة مسؤول
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  setFormData({ username: '', password: '', name: '', email: '' })
                }}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
