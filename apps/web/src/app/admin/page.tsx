'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Video, Activity, FileText, TrendingUp, Clock, Shield, BarChart3 } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_BASE = `${API_URL}/api`

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/admin/stats`)
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
    refetchInterval: 5000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              مرحباً بك في لوحة التحكم
            </h1>
            <p className="text-blue-100 text-lg">
              إدارة شاملة لنظام الاجتماعات والمستخدمين
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{new Date().toLocaleDateString('ar-SA')}</div>
              <div className="text-sm text-blue-200">تاريخ اليوم</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-900">إجمالي المستخدمين</CardTitle>
            <div className="bg-blue-500 p-2 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 mb-1">{stats?.totalUsers || 0}</div>
            <div className="flex items-center gap-1 text-sm text-blue-700">
              <TrendingUp className="h-4 w-4" />
              <span>نشط</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-green-900">إجمالي الغرف</CardTitle>
            <div className="bg-green-500 p-2 rounded-lg">
              <Video className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 mb-1">{stats?.totalRooms || 0}</div>
            <p className="text-xs text-green-700">
              {stats?.activeRooms || 0} غرفة نشطة
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-900">المشاركون الحاليون</CardTitle>
            <div className="bg-purple-500 p-2 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 mb-1">{stats?.activeParticipants || 0}</div>
            <div className="flex items-center gap-1 text-sm text-purple-700">
              <Clock className="h-4 w-4" />
              <span>مباشر</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-900">سجلات الأحداث</CardTitle>
            <div className="bg-orange-500 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 mb-1">{stats?.recentActivity?.length || 0}</div>
            <p className="text-xs text-orange-700">آخر 10 أحداث</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Shield className="h-5 w-5 text-blue-600" />
                إدارة سريعة
              </CardTitle>
              <CardDescription>الوصول السريع لأدوات الإدارة الأساسية</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/admin/users-management" className="group">
                  <div className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 group-hover:scale-105 bg-gradient-to-br from-blue-50 to-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">إدارة المستخدمين</h3>
                    </div>
                    <p className="text-sm text-gray-600">إضافة وتعديل وحذف المستخدمين</p>
                  </div>
                </Link>

                <Link href="/admin/rooms" className="group">
                  <div className="p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200 group-hover:scale-105 bg-gradient-to-br from-green-50 to-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-green-100 p-2 rounded-lg group-hover:bg-green-200 transition-colors">
                        <Video className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">إدارة الغرف</h3>
                    </div>
                    <p className="text-sm text-gray-600">مراقبة وإدارة غرف الاجتماعات</p>
                  </div>
                </Link>

                <Link href="/admin/recordings" className="group">
                  <div className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200 group-hover:scale-105 bg-gradient-to-br from-purple-50 to-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">التسجيلات</h3>
                    </div>
                    <p className="text-sm text-gray-600">إدارة تسجيلات الاجتماعات</p>
                  </div>
                </Link>

                <Link href="/admin/audit-logs" className="group">
                  <div className="p-4 border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all duration-200 group-hover:scale-105 bg-gradient-to-br from-orange-50 to-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-orange-100 p-2 rounded-lg group-hover:bg-orange-200 transition-colors">
                        <FileText className="h-5 w-5 text-orange-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">سجلات الأحداث</h3>
                    </div>
                    <p className="text-sm text-gray-600">مراجعة سجلات النظام</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Activity className="h-5 w-5 text-purple-600" />
              النشاط الأخير
            </CardTitle>
            <CardDescription>آخر الأحداث في النظام</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {stats?.recentActivity?.slice(0, 8).map((log: any, index: number) => (
                <div key={log.id || index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{log.actorName}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{log.details}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.timestamp).toLocaleString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">لا توجد أحداث حديثة</p>
                  <p className="text-sm text-gray-400 mt-1">ستظهر الأحداث هنا عند حدوثها</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">النظام يعمل بشكل طبيعي</h3>
                <p className="text-sm text-gray-600">جميع الخدمات متصلة وتعمل بكفاءة</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">آخر تحديث</div>
              <div className="font-medium text-gray-900">
                {new Date().toLocaleTimeString('ar-SA', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
