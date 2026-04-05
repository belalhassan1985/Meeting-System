'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, UserPlus, Trash2, Users, Loader2, Search, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_BASE = `${API_URL}/api`

export default function RoomMembersPage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const roomId = params.roomId as string

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())

  // Fetch room details
  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/rooms/${roomId}`)
      if (!res.ok) throw new Error('Failed to fetch room')
      return res.json()
    },
  })

  // Fetch room members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['room-members', roomId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/room-members/${roomId}/members`)
      if (!res.ok) throw new Error('Failed to fetch members')
      return res.json()
    },
  })

  // Fetch all users
  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/users`)
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
  })

  // Add members mutation (bulk)
  const addMembersMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const res = await fetch(`${API_BASE}/room-members/${roomId}/members/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      })
      if (!res.ok) throw new Error('Failed to add members')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-members', roomId] })
      setSelectedUserIds(new Set())
    },
  })

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${API_BASE}/room-members/${roomId}/members/${userId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove member')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-members', roomId] })
    },
  })

  // Filter and search available users
  const availableUsers = useMemo(() => {
    const users = allUsers?.filter(
      (user: any) => user.role === 'user' && !members?.some((m: any) => m.userId === user.id)
    ) || []
    
    if (!searchQuery) return users
    
    return users.filter((user: any) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [allUsers, members, searchQuery])

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUserIds(newSelection)
  }

  const handleAddMembers = () => {
    if (selectedUserIds.size > 0) {
      addMembersMutation.mutate(Array.from(selectedUserIds))
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/rooms">
            <Button variant="outline" size="sm">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">إدارة أعضاء الغرفة</h1>
            {room && <p className="text-muted-foreground">{room.name}</p>}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {members?.length || 0} عضو
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Add Members Card - Modern Design */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              إضافة أعضاء جدد
            </CardTitle>
            <CardDescription>
              اختر المستخدمين لإضافتهم إلى الغرفة ({selectedUserIds.size} محدد)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن مستخدم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Users List */}
            {usersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : availableUsers.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableUsers.map((user: any) => (
                  <div
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedUserIds.has(user.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        selectedUserIds.has(user.id) ? 'bg-primary' : 'bg-gray-400'
                      }`}>
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    {selectedUserIds.has(user.id) && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="font-medium">لا يوجد مستخدمون متاحون</p>
                <p className="text-sm mt-1">
                  {allUsers?.length === 0
                    ? 'لا يوجد مستخدمون في النظام'
                    : 'جميع المستخدمين مسجلون بالفعل'}
                </p>
              </div>
            )}

            {/* Add Button */}
            {availableUsers.length > 0 && (
              <Button
                onClick={handleAddMembers}
                disabled={selectedUserIds.size === 0 || addMembersMutation.isPending}
                className="w-full"
                size="lg"
              >
                {addMembersMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 ml-2" />
                    إضافة {selectedUserIds.size > 0 ? `(${selectedUserIds.size})` : ''}
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Current Members Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              الأعضاء الحاليون ({members?.length || 0})
            </CardTitle>
            <CardDescription>
              قائمة المستخدمين المسجلين في الغرفة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : members && members.length > 0 ? (
              <div className="space-y-2">
                {members.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        @{member.username}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeMemberMutation.mutate(member.userId)}
                      disabled={removeMemberMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا يوجد أعضاء في هذه الغرفة بعد</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
