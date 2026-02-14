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
  const [formData, setFormData] = useState({ username: '', password: '', fullName: '' })
  const queryClient = useQueryClient()

  const { data: admins, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch admins')
      return res.json()
    },
  })

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add admin')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      setShowAddDialog(false)
      setFormData({ username: '', password: '', fullName: '' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/admins/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update admin')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      setEditingId(null)
      setFormData({ username: '', password: '', fullName: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/admins/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete admin')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
    },
  })

  const handleAdd = () => {
    if (formData.username && formData.password && formData.fullName) {
      addMutation.mutate(formData)
    }
  }

  const handleUpdate = (id: string) => {
    const updateData: any = { fullName: formData.fullName }
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
    setFormData({ username: admin.username, password: '', fullName: admin.fullName })
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
          <p className="text-gray-600">إضافة وتعديل وحذف حسابات المسؤولين</p>
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
                      placeholder="الاسم الكامل"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                        setFormData({ username: '', password: '', fullName: '' })
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{admin.fullName}</h3>
                      <p className="text-sm text-gray-600">@{admin.username}</p>
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
              <label className="text-sm font-medium">الاسم الكامل</label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="الاسم الكامل"
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
            <div className="flex gap-2">
              <Button
                onClick={handleAdd}
                disabled={addMutation.isPending || !formData.username || !formData.password || !formData.fullName}
                className="flex-1"
              >
                إضافة
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  setFormData({ username: '', password: '', fullName: '' })
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
