'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, ArrowLeft, Lock, Users, Unlock, Video, Plus, X, Edit } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_BASE = `${API_URL}/api`

export default function RoomsManagement() {
  const [page, setPage] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    maxParticipants: 25,
    hostName: '',
  })
  const [editMaxParticipants, setEditMaxParticipants] = useState(25)
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

  const updateMaxParticipantsMutation = useMutation({
    mutationFn: async ({ roomId, maxParticipants }: { roomId: string; maxParticipants: number }) => {
      const res = await fetch(`${API_BASE}/admin/rooms/${roomId}/max-participants`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxParticipants }),
      })
      if (!res.ok) throw new Error('Failed to update max participants')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
      setIsEditModalOpen(false)
      setSelectedRoom(null)
    },
  })

  const openEditModal = (room: any) => {
    setSelectedRoom(room)
    setEditMaxParticipants(room.maxParticipants)
    setIsEditModalOpen(true)
  }

  const handleUpdateMaxParticipants = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRoom) return
    
    if (editMaxParticipants < 2 || editMaxParticipants > 100) {
      alert('يجب أن يكون عدد الأعضاء بين 2 و 100')
      return
    }

    await updateMaxParticipantsMutation.mutateAsync({
      roomId: selectedRoom.id,
      maxParticipants: editMaxParticipants,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-lg text-gray-600">جاري تحميل الغرف...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header with gradient */}
      <div className="mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">إدارة الغرف</h1>
            <p className="text-blue-100 text-lg">عرض وإدارة جميع الغرف في النظام</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-100">النظام نشط</span>
            </div>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all duration-200 shadow-lg w-full sm:w-auto"
          >
            <Plus className="h-5 w-5 ml-2" />
            <span className="font-semibold">إنشاء غرفة جديدة</span>
          </Button>
        </div>
      </div>

      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">إنشاء غرفة جديدة</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div>
                <Label htmlFor="roomName" className="text-sm font-semibold text-gray-700 mb-2 block">اسم الغرفة *</Label>
                <Input
                  id="roomName"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  placeholder="أدخل اسم الغرفة"
                  required
                  minLength={3}
                  maxLength={100}
                  className="h-12 border-2 border-gray-200 focus:border-green-500 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="hostName" className="text-sm font-semibold text-gray-700 mb-2 block">اسم المضيف *</Label>
                <Input
                  id="hostName"
                  value={newRoom.hostName}
                  onChange={(e) => setNewRoom({ ...newRoom, hostName: e.target.value })}
                  placeholder="أدخل اسم المضيف"
                  required
                  minLength={2}
                  maxLength={50}
                  className="h-12 border-2 border-gray-200 focus:border-green-500 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2 block">الوصف</Label>
                <Input
                  id="description"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  placeholder="وصف اختياري للغرفة"
                  maxLength={500}
                  className="h-12 border-2 border-gray-200 focus:border-green-500 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="maxParticipants" className="text-sm font-semibold text-gray-700 mb-2 block">الحد الأقصى للمشاركين</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={newRoom.maxParticipants}
                  onChange={(e) => setNewRoom({ ...newRoom, maxParticipants: parseInt(e.target.value) || 25 })}
                  min={2}
                  max={50}
                  className="h-12 border-2 border-gray-200 focus:border-green-500 rounded-lg"
                />
              </div>
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 h-12 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={createRoomMutation.isPending}
                >
                  {createRoomMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      جاري الإنشاء...
                    </div>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 ml-2" />
                      إنشاء الغرفة
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-semibold"
                >
                  إلغاء
                </Button>
              </div>
              {createRoomMutation.isError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center font-medium">
                    {createRoomMutation.error?.message || 'حدث خطأ في إنشاء الغرفة'}
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Edit Max Participants Modal */}
      {isEditModalOpen && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Edit className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">تعديل عدد الأعضاء</h2>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleUpdateMaxParticipants} className="space-y-6">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">اسم الغرفة</Label>
                <Input
                  value={selectedRoom.name}
                  disabled
                  className="h-12 bg-gray-50 border-2 border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">العدد الحالي للأعضاء</Label>
                <Input
                  value={`${selectedRoom.totalParticipants} / ${selectedRoom.maxParticipants}`}
                  disabled
                  className="h-12 bg-gray-50 border-2 border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="editMaxParticipants" className="text-sm font-semibold text-gray-700 mb-2 block">الحد الأقصى الجديد للأعضاء *</Label>
                <Input
                  id="editMaxParticipants"
                  type="number"
                  value={editMaxParticipants}
                  onChange={(e) => setEditMaxParticipants(parseInt(e.target.value) || 2)}
                  min={2}
                  max={100}
                  required
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-2">
                  يجب أن يكون بين 2 و 100 عضو
                </p>
              </div>
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 h-12 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={updateMaxParticipantsMutation.isPending}
                >
                  {updateMaxParticipantsMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      جاري التحديث...
                    </div>
                  ) : (
                    <>
                      <Edit className="h-5 w-5 ml-2" />
                      تحديث
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-semibold"
                >
                  إلغاء
                </Button>
              </div>
              {updateMaxParticipantsMutation.isError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center font-medium">
                    حدث خطأ في تحديث عدد الأعضاء
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Rooms List */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Video className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-900">قائمة الغرف</CardTitle>
                <p className="text-sm text-gray-600 mt-1">إجمالي الغرف: {data?.meta?.total || 0}</p>
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
            {data?.data?.map((room: any) => (
              <div
                key={room.id}
                className="group bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-300 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Video className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                        {room.name}
                      </h3>
                      {!room.isActive && (
                        <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full font-medium">
                          مغلقة
                        </span>
                      )}
                      {room.isActive && (
                        <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                          نشطة
                        </span>
                      )}
                      {room.isLocked && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                          <Lock className="h-3 w-3" />
                          <span className="text-xs font-medium">مقفلة</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {room.description || 'لا يوجد وصف'}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">
                          {room.activeParticipants} نشط / {room.totalParticipants} إجمالي
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-lg">
                        <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                        <span className="font-medium">الحد الأقصى: {room.maxParticipants}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg">
                        <span className="font-medium">
                          {new Date(room.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-2">
                    {room.isActive && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleJoinRoom(room.id)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Video className="h-4 w-4 ml-1" />
                        انضمام
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/rooms/${room.id}/members`)}
                      className="border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600 transition-all duration-200"
                    >
                      <Users className="h-4 w-4 ml-1" />
                      الأعضاء
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(room)}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 transition-all duration-200"
                      title="تعديل عدد الأعضاء"
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                    {room.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClose(room.id, room.name)}
                        disabled={closeMutation.isPending}
                        className="border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600 transition-all duration-200"
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
                        className="border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 transition-all duration-200"
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
                  <Video className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">لا توجد غرف</p>
                <p className="text-gray-400 text-sm mt-1">ابدأ بإنشاء غرفة جديدة</p>
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
                <span className="font-bold text-blue-600">{page}</span>
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
