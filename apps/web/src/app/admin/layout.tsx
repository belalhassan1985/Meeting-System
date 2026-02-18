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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [adminInfo, setAdminInfo] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">جاري التحميل...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-blue-700">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <div>
                  <h2 className="text-xl font-bold">لوحة التحكم</h2>
                  <p className="text-sm text-blue-200">نظام الاجتماعات</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white hover:bg-blue-700"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {/* زر الرجوع للداشبورد */}
            <Link href="/dashboard">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors bg-green-600 hover:bg-green-700 text-white mb-4">
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-700/50'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && <span className="font-medium">{item.label}</span>}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-blue-700">
            {sidebarOpen && (
              <div className="mb-3 px-2">
                <p className="text-sm font-medium">{adminInfo.fullName}</p>
                <p className="text-xs text-blue-200">@{adminInfo.username}</p>
              </div>
            )}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-white hover:bg-red-600"
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
          sidebarOpen ? 'mr-64' : 'mr-20'
        }`}
      >
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
