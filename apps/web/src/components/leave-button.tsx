'use client'

import { useRouter } from 'next/navigation'
import { useRoomContext } from '@livekit/components-react'
import { LogOut } from 'lucide-react'
import { Button } from './ui/button'

export function LeaveButton() {
  const router = useRouter()
  const room = useRoomContext()

  const handleLeave = async () => {
    try {
      // Disconnect from LiveKit room
      await room?.disconnect()
    } catch (error) {
      console.error('Error disconnecting:', error)
    } finally {
      // Always redirect to home page
      router.push('/')
    }
  }

  return (
    <Button
      onClick={handleLeave}
      variant="destructive"
      size="lg"
      className="custom-leave-button fixed top-4 left-4 z-[100] gap-2 bg-red-600 hover:bg-red-700 shadow-lg"
    >
      <LogOut className="h-5 w-5" />
      <span>خروج من الغرفة</span>
    </Button>
  )
}
