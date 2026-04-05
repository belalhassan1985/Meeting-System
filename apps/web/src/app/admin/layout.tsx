'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Users, 
  Video, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  UserCog,
  Home,
  Film
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const menuItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { href: '/admin/users-management', icon: Users, label: 'إدارة المستخدمين' },
  { href: '/admin/rooms', icon: Video, label: 'الغرف' },
  { href: '/admin/recordings', icon: Film, label: 'التسجيلات' },
  { href: '/admin/audit-logs', icon: FileText, label: 'سجلات الأحداث' },
  { href: '/admin/admins', icon: UserCog, label: 'المسؤولين' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [adminInfo, setAdminInfo] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('userInfo')
    
    if (!token || !user) {
      router.push('/login')
      return
    }
    
    const parsedUser = JSON.parse(user)
    
    // التحقق من أن المستخدم admin
    if (parsedUser.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    
    setAdminInfo(parsedUser)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    router.push('/login')
  }

  if (!adminInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50" dir="rtl">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 text-white shadow-2xl transition-all duration-300 z-40 ${
          sidebarOpen ? (isMobile ? 'w-full max-w-sm' : 'w-80') : 'w-0 overflow-hidden'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-black/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                {sidebarOpen && (
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      لوحة التحكم
                    </h2>
                    <p className="text-sm text-blue-200">نظام الاجتماعات</p>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white hover:bg-white/10 rounded-lg"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {/* زر الرجوع للداشبورد */}
            <Link href="/dashboard">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105">
                <Home className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">الصفحة الرئيسية</span>}
              </div>
            </Link>

            {/* قائمة الإدارة */}
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-blue-300'
                    }`} />
                    {sidebarOpen && (
                      <span className={`font-medium transition-colors ${
                        isActive ? 'text-white' : 'group-hover:text-white'
                      }`}>
                        {item.label}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            {sidebarOpen && (
              <div className="mb-4 px-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {adminInfo.fullName?.charAt(0) || adminInfo.username?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{adminInfo.fullName}</p>
                    <p className="text-xs text-blue-200">@{adminInfo.username}</p>
                  </div>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-white hover:bg-red-600/80 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 ml-2" />
              {sidebarOpen && <span>تسجيل الخروج</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen && !isMobile ? 'mr-80' : 'mr-0'
        }`}
      >
        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-white shadow-sm border-b p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">لوحة التحكم</h1>
            <div className="w-8" /> {/* Spacer */}
          </div>
        )}

        <div className={`${isMobile ? 'p-4' : 'p-8'} min-h-screen`}>
          {children}
        </div>
      </main>
    </div>
  )
}
