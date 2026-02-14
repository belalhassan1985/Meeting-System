'use client'

import { useEffect, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react'
import { useRoomStore } from '@/store/room-store'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import { Loader2 } from 'lucide-react'
import { UserRole } from '@arabic-meet/shared'
import { ErrorBoundary } from '@/components/error-boundary'
import { CustomVideoConference } from '@/components/custom-video-conference'
import './room.css'

function RoomContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const token = searchParams.get('token')
  const userId = searchParams.get('userId')
  const userName = searchParams.get('userName')
  const userRoleParam = searchParams.get('userRole')
  const userRole = (userRoleParam as UserRole) || UserRole.PARTICIPANT

  // Debug URL params
  console.log('🔗 Room URL Params:', {
    roomId,
    userId,
    userName,
    userRoleParam,
    userRole,
    token: token ? 'exists' : 'missing'
  })

  const { setRoomInfo, reset } = useRoomStore()

  useEffect(() => {
    if (!token || !userId || !userName) {
      router.push('/')
      return
    }

    setRoomInfo(roomId, userId, userName, userRole)

    const socket = connectSocket()
    
    socket.emit('room:join', {
      roomId,
      userId,
      userName,
      userRole,
    })

    return () => {
      disconnectSocket()
      reset()
    }
  }, [roomId, token, userId, userName, userRole, setRoomInfo, reset, router])

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>رمز الدخول غير صالح</p>
      </div>
    )
  }

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880'

  const handleDisconnected = () => {
    // Redirect to home page when disconnected
    router.push('/')
  }

  return (
    <div className="h-screen w-screen bg-gray-900">
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        connect={true}
        audio={true}
        video={true}
        data-lk-theme="default"
        style={{ height: '100vh' }}
        onDisconnected={handleDisconnected}
      >
        <ErrorBoundary>
          <CustomVideoConference userRole={userRole} />
        </ErrorBoundary>
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  )
}

export default function RoomPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    }>
      <RoomContent />
    </Suspense>
  )
}
