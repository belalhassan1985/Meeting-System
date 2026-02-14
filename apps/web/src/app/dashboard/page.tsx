'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, Users, LogOut } from 'lucide-react'
import { RoomList } from '@/components/room-list'

export default function DashboardPage() {
  const [joinCode, setJoinCode] = useState('')
  const [userInfo, setUserInfo] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('userInfo')
    
    if (!token || !user) {
      router.push('/login')
      return
    }
    
    const parsedUser = JSON.parse(user)
    
    // التحقق من أن المستخدم ليس admin
    if (parsedUser.role === 'admin') {
      router.push('/admin')
      return
    }
    
    setUserInfo(parsedUser)
  }, [router])

  const handleQuickJoin = () => {
    if (joinCode.trim()) {
      router.push(`/lobby?roomId=${joinCode.trim()}`)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    router.push('/login')
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">جاري التحميل...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Video className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                نظام الاجتماعات
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                مرحباً، {userInfo.name}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
        
        <div className="text-center mb-12">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            منصة اجتماعات فيديو احترافية للشبكات المحلية
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                الانضمام إلى غرفة
              </CardTitle>
              <CardDescription>
                أدخل رمز الغرفة للانضمام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="رمز الغرفة"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickJoin()}
              />
              <Button 
                onClick={handleQuickJoin}
                className="w-full"
                size="lg"
                variant="secondary"
                disabled={!joinCode.trim()}
              >
                انضم
              </Button>
            </CardContent>
          </Card>

          <RoomList />
        </div>
      </div>
    </div>
  )
}
