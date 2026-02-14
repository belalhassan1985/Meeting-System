'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { roomApi } from '@/lib/api'
import { Users, Clock, Loader2 } from 'lucide-react'

export function RoomList() {
  const router = useRouter()
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomApi.getRooms,
    refetchInterval: 5000,
  })

  if (isLoading) {
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
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">لا توجد غرف نشطة حالياً</p>
          <p className="text-sm text-muted-foreground">أنشئ غرفة جديدة للبدء</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>الغرف النشطة</CardTitle>
        <CardDescription>انضم إلى إحدى الغرف الجارية</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rooms.map((room: any) => (
          <div
            key={room.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1">
              <h3 className="font-semibold">{room.name}</h3>
              {room.description && (
                <p className="text-sm text-muted-foreground">{room.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {room.participantCount || 0} / {room.maxParticipants}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
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
            >
              انضم
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
