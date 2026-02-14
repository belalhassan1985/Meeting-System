'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Video, User, Lock } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة')
      }

      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('userInfo', JSON.stringify(data.user))
      
      // Redirect based on role
      if (data.user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900" dir="rtl">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Video className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            نظام الاجتماعات 
          </h1>
          <p className="text-blue-200">
            منصة اجتماعات فيديو احترافية للشبكات المحلية
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
            <CardDescription>أدخل بيانات الدخول للوصول إلى النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">اسم المستخدم</label>
                <div className="relative">
                  <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pr-10"
                    placeholder="أدخل اسم المستخدم"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    placeholder="أدخل كلمة المرور"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>للحصول على حساب، تواصل مع المسؤول</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-blue-100 text-sm">
            © 2026 نظام الاجتماعات - جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  )
}
