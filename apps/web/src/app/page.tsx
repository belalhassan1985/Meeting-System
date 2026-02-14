'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const token = localStorage.getItem('token')
    const userInfo = localStorage.getItem('userInfo')
    
    if (token && userInfo) {
      const user = JSON.parse(userInfo)
      
      // التوجيه بناءً على الـ role
      if (user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } else {
      // إذا لم يكن مسجل دخول، توجيه لصفحة تسجيل دخول المستخدمين
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">جاري التحميل...</p>
    </div>
  )
}
