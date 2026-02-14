'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Video, VideoOff, Mic, MicOff, Settings, Loader2 } from 'lucide-react'
import { roomApi } from '@/lib/api'

function LobbyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomId = searchParams.get('roomId')
  const prefilledName = searchParams.get('userName')

  const [userName, setUserName] = useState(prefilledName || '')
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [room, setRoom] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (roomId) {
      roomApi.getRoom(roomId)
        .then(setRoom)
        .catch(() => setError('الغرفة غير موجودة'))
    }
  }, [roomId])

  const handleJoin = async () => {
    if (!userName.trim() || !roomId) return

    setIsJoining(true)
    try {
      const response = await roomApi.joinRoom(roomId, { userName: userName.trim() })
      
      router.push(`/room/${roomId}?token=${response.livekitToken}&userId=${response.roomInfo.hostId}&userName=${userName}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل الانضمام للغرفة')
      setIsJoining(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => router.push('/')}>العودة للرئيسية</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">جاهز للانضمام؟</CardTitle>
          <CardDescription>
            {room.name} - اختبر الكاميرا والمايك قبل الدخول
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
            {isCameraOn ? (
              <div className="text-white text-center">
                <Video className="h-16 w-16 mx-auto mb-2" />
                <p>معاينة الكاميرا</p>
              </div>
            ) : (
              <div className="text-white text-center">
                <VideoOff className="h-16 w-16 mx-auto mb-2" />
                <p>الكاميرا متوقفة</p>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4">
            <Button
              variant={isMicOn ? 'default' : 'destructive'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() => setIsMicOn(!isMicOn)}
            >
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button
              variant={isCameraOn ? 'default' : 'destructive'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() => setIsCameraOn(!isCameraOn)}
            >
              {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">اسمك</label>
            <Input
              placeholder="أدخل اسمك"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/')}
              disabled={isJoining}
            >
              إلغاء
            </Button>
            <Button
              className="flex-1"
              onClick={handleJoin}
              disabled={!userName.trim() || isJoining}
            >
              {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              انضم الآن
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LobbyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <LobbyContent />
    </Suspense>
  )
}
