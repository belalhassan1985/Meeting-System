'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, ArrowLeft, Lock, Users, Unlock, Video, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_BASE = `${API_URL}/api`

export default function RoomsManagement() {
  const [page, setPage] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    maxParticipants: 25,
    hostName: '',
  })
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-rooms', page],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/admin/rooms?page=${page}&limit=10`)
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
      
      const res = await fetch(`${API_BASE}/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomId,
          userId: admin.id,
          userName: admin.name || admin.username || 'Admin',
        }),
      })

      if (!res.ok) throw new Error('Failed to join room')

      const { livekitToken, userRole } = await res.json()
      router.push(`/room/${roomId}?token=${livekitToken}&userId=${admin.id}&userName=${encodeURIComponent(admin.name || admin.username)}&userRole=${userRole}`)
    } catch (error) {
      console.error('Error joining room:', error)
      alert('حدث خطأ في الانضمام للغرفة')
    }
  }

  const deleteMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const res = await fetch(`${API_BASE}/admin/rooms/${roomId}`, {
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
      const res = await fetch(`${API_BASE}/admin/rooms/${roomId}/close`, {
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
      const res = await fetch(`${API_BASE}/admin/rooms/${roomId}/reopen`, {
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
    mutationFn: async (roomData: typeof newRoom) => {
      const adminInfo = localStorage.getItem('userInfo')
      const admin = adminInfo ? JSON.parse(adminInfo) : null
      
      const res = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roomData,
          userId: admin?.id, // Add admin's userId so they become the host
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to create room')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
      setIsCreateModalOpen(false)
      setNewRoom({ name: '', description: '', maxParticipants: 25, hostName: '' })
    },
  })

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoom.name.trim() || !newRoom.hostName.trim()) {
      alert('يرجى ملء جميع الحقول المطلوبة')
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
    <div className="px-4 sm:px-0">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">إدارة الغرف</h1>
          <p className="text-sm sm:text-base text-gray-600">عرض وإدارة جميع الغرف في النظام</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 ml-2" />
          <span className="sm:inline">إنشاء غرفة جديدة</span>
        </Button>
      </div>

      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">إنشاء غرفة جديدة</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <Label htmlFor="roomName">اسم الغرفة *</Label>
                <Input
                  id="roomName"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  placeholder="أدخل اسم الغرفة"
                  required
                  minLength={3}
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="hostName">اسم المضيف *</Label>
                <Input
                  id="hostName"
                  value={newRoom.hostName}
                  onChange={(e) => setNewRoom({ ...newRoom, hostName: e.target.value })}
                  placeholder="أدخل اسم المضيف"
                  required
                  minLength={2}
                  maxLength={50}
                />
              </div>
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Input
                  id="description"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  placeholder="وصف اختياري للغرفة"
                  maxLength={500}
                />
              </div>
              <div>
                <Label htmlFor="maxParticipants">الحد الأقصى للمشاركين</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={newRoom.maxParticipants}
                  onChange={(e) => setNewRoom({ ...newRoom, maxParticipants: parseInt(e.target.value) || 25 })}
                  min={2}
                  max={50}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={createRoomMutation.isPending}
                >
                  {createRoomMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الغرفة'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
              {createRoomMutation.isError && (
                <p className="text-red-500 text-sm text-center">
                  {createRoomMutation.error?.message || 'حدث خطأ في إنشاء الغرفة'}
                </p>
              )}
            </form>
          </div>
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
