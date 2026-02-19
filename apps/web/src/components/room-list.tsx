'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { roomApi } from '@/lib/api'
import { Users, Clock, Loader2, AlertCircle } from 'lucide-react'

export function RoomList() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const user = JSON.parse(userInfo)
      setUserId(user.id)
    }
  }, [])

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms', userId],
    queryFn: () => roomApi.getRooms(userId),
    enabled: !!userId,
    refetchInterval: 5000,
  })

  if (isLoading || !userId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!rooms || rooms.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">لا توجد غرف متاحة</p>
          <p className="text-sm text-muted-foreground mt-2">
            لم يتم تسجيلك في أي غرفة بعد
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            تواصل مع المسؤول لإضافتك إلى الغرف
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">الغرف النشطة</CardTitle>
        <CardDescription className="text-sm">انضم إلى إحدى الغرف الجارية</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rooms.map((room: any) => (
          <div
            key={room.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-3"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg truncate">{room.name}</h3>
              {room.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{room.description}</p>
              )}
              <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  {room.participantCount || 0} / {room.maxParticipants}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  {new Date(room.createdAt).toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
            <Button
              onClick={() => router.push(`/lobby?roomId=${room.id}`)}
              disabled={room.participantCount >= room.maxParticipants}
              className="w-full sm:w-auto"
              size="sm"
            >
              انضم
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
