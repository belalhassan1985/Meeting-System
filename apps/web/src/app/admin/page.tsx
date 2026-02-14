'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Video, Activity, FileText } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/admin/stats`)
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
    refetchInterval: 5000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-lg">جاري التحميل...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم الإدارية</h1>
          <p className="text-gray-600">إدارة المستخدمين والغرف والنظام</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الغرف</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRooms || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeRooms || 0} نشطة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المشاركون الحاليون</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeParticipants || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">سجلات الأحداث</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.recentActivity?.length || 0}</div>
              <p className="text-xs text-muted-foreground">آخر 10 أحداث</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>إدارة سريعة</CardTitle>
              <CardDescription>الوصول السريع لأدوات الإدارة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/users">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="ml-2 h-4 w-4" />
                  إدارة المستخدمين
                </Button>
              </Link>
              <Link href="/admin/rooms">
                <Button className="w-full justify-start" variant="outline">
                  <Video className="ml-2 h-4 w-4" />
                  إدارة الغرف
                </Button>
              </Link>
              <Link href="/admin/audit-logs">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="ml-2 h-4 w-4" />
                  سجلات الأحداث
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>النشاط الأخير</CardTitle>
              <CardDescription>آخر الأحداث في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.recentActivity?.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{log.actorName}</p>
                      <p className="text-gray-600">{log.details}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleString('ar-SA')}
                      </p>
                    </div>
                  </div>
                ))}
                {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                  <p className="text-gray-500 text-center py-4">لا توجد أحداث حديثة</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
