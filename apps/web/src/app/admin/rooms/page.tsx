'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, ArrowLeft, Lock, Users, Unlock, Video, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function RoomsManagement() {
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newRoom, setNewRoom] = useState({ name: '', description: '', maxParticipants: 10 })
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-rooms', page],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/admin/rooms?page=${page}&limit=10`)
      if (!res.ok) throw new Error('Failed to fetch rooms')
      return res.json()
    },
  })

  const handleJoinRoom = async (roomId: string) => {
    try {
      const adminInfo = localStorage.getItem('userInfo')
      if (!adminInfo) {
        alert('يجب تسجيل الدخول أولاً')
        return
      }

      const admin = JSON.parse(adminInfo)
      
      const res = await fetch(`${API_URL}/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: admin.id,
          userName: admin.fullName || admin.username,
          userRole: 'host',
        }),
      })

      if (!res.ok) throw new Error('Failed to join room')

      const { token } = await res.json()
      router.push(`/room/${roomId}?token=${token}&userId=${admin.id}&userName=${encodeURIComponent(admin.fullName || admin.username)}&userRole=host`)
    } catch (error) {
      console.error('Error joining room:', error)
      alert('حدث خطأ في الانضمام للغرفة')
    }
  }

  const deleteMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const res = await fetch(`${API_URL}/admin/rooms/${roomId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete room')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
    },
  })

  const closeMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const res = await fetch(`${API_URL}/admin/rooms/${roomId}/close`, {
        method: 'PATCH',
      })
      if (!res.ok) throw new Error('Failed to close room')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
    },
  })

  const reopenMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const res = await fetch(`${API_URL}/admin/rooms/${roomId}/reopen`, {
        method: 'PATCH',
      })
      if (!res.ok) throw new Error('Failed to reopen room')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
    },
  })

  const createRoomMutation = useMutation({
    mutationFn: async (roomData: { name: string; description: string; maxParticipants: number }) => {
      const res = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData),
      })
      if (!res.ok) throw new Error('Failed to create room')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
      setShowCreateDialog(false)
      setNewRoom({ name: '', description: '', maxParticipants: 10 })
    },
  })

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoom.name.trim()) {
      alert('يرجى إدخال اسم الغرفة')
      return
    }
    await createRoomMutation.mutateAsync(newRoom)
  }

  const handleDelete = async (roomId: string, roomName: string) => {
    if (confirm(`هل أنت متأكد من حذف الغرفة "${roomName}"؟\nسيتم حذف جميع البيانات المرتبطة بها.`)) {
      await deleteMutation.mutateAsync(roomId)
    }
  }

  const handleClose = async (roomId: string, roomName: string) => {
    if (confirm(`هل تريد إغلاق الغرفة "${roomName}"؟\nسيتم إخراج جميع المشاركين.`)) {
      await closeMutation.mutateAsync(roomId)
    }
  }

  const handleReopen = async (roomId: string, roomName: string) => {
    if (confirm(`هل تريد إعادة فتح الغرفة "${roomName}"؟`)) {
      await reopenMutation.mutateAsync(roomId)
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الغرف</h1>
          <p className="text-gray-600">عرض وإدارة جميع الغرف في النظام</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <Plus className="h-5 w-5 ml-2" />
          إنشاء غرفة جديدة
        </Button>
      </div>

      {/* Create Room Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateDialog(false)}>
          <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>إنشاء غرفة جديدة</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">اسم الغرفة *</label>
                  <Input
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    placeholder="مثال: غرفة الاجتماعات"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">الوصف</label>
                  <Input
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    placeholder="وصف مختصر للغرفة"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">الحد الأقصى للمشاركين</label>
                  <Input
                    type="number"
                    min="2"
                    max="100"
                    value={newRoom.maxParticipants}
                    onChange={(e) => setNewRoom({ ...newRoom, maxParticipants: parseInt(e.target.value) || 10 })}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createRoomMutation.isPending}
                    className="flex-1"
                  >
                    {createRoomMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

        <Card>
          <CardHeader>
            <CardTitle>قائمة الغرف ({data?.meta?.total || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.data?.map((room: any) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{room.name}</h3>
                      {!room.isActive && (
                        <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                          مغلقة
                        </span>
                      )}
                      {room.isActive && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                          نشطة
                        </span>
                      )}
                      {room.isLocked && (
                        <Lock className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {room.description || 'لا يوجد وصف'}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {room.activeParticipants} نشط / {room.totalParticipants} إجمالي
                      </span>
                      <span>الحد الأقصى: {room.maxParticipants}</span>
                      <span>
                        تاريخ الإنشاء: {new Date(room.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {room.isActive && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleJoinRoom(room.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Video className="h-4 w-4 ml-1" />
                        انضمام
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/rooms/${room.id}/members`)}
                      className="border-purple-500 text-purple-600 hover:bg-purple-50"
                    >
                      <Users className="h-4 w-4 ml-1" />
                      الأعضاء
                    </Button>
                    {room.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClose(room.id, room.name)}
                        disabled={closeMutation.isPending}
                      >
                        <Lock className="h-4 w-4 ml-1" />
                        إغلاق
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReopen(room.id, room.name)}
                        disabled={reopenMutation.isPending}
                        className="border-green-500 text-green-600 hover:bg-green-50"
                      >
                        <Unlock className="h-4 w-4 ml-1" />
                        إعادة فتح
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(room.id, room.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {(!data?.data || data.data.length === 0) && (
                <p className="text-center text-gray-500 py-8">لا توجد غرف</p>
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
