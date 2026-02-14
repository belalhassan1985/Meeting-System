'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const token = localStorage.getItem('userToken')
    
    if (token) {
      // إذا كان مسجل دخول، توجيه للوحة التحكم
      router.push('/dashboard')
    } else {
      // إذا لم يكن مسجل دخول، توجيه لصفحة تسجيل الدخول
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">جاري التحميل...</p>
    </div>
  )
}
