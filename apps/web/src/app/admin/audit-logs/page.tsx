'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Filter } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_BASE = `${API_URL}/api`

const ACTION_LABELS: Record<string, string> = {
  JOIN_ROOM: 'انضم للغرفة',
  LEAVE_ROOM: 'غادر الغرفة',
  MUTE_PARTICIPANT: 'كتم صوت مشارك',
  UNMUTE_PARTICIPANT: 'إلغاء كتم صوت مشارك',
  CAMERA_OFF: 'إيقاف الكاميرا',
  CAMERA_ON: 'تشغيل الكاميرا',
  KICK_PARTICIPANT: 'طرد مشارك',
  LOCK_ROOM: 'قفل الغرفة',
  UNLOCK_ROOM: 'فتح الغرفة',
  RAISE_HAND: 'رفع اليد',
  LOWER_HAND: 'خفض اليد',
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState<string>('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, actionFilter],
    queryFn: async () => {
      let url = `${API_BASE}/admin/audit-logs?page=${page}&limit=50`
      if (actionFilter) {
        url += `&action=${actionFilter}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch audit logs')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="text-lg text-gray-600">جاري تحميل السجلات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header with gradient */}
      <div className="mb-8 bg-gradient-to-r from-orange-600 via-red-600 to-orange-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">سجل الأحداث</h1>
            <p className="text-orange-100 text-lg">عرض جميع الأحداث والتغييرات في النظام</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-orange-100">التسجيل نشط</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Filter className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Filter className="h-5 w-5 text-orange-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">تصفية حسب نوع الحدث</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={actionFilter === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActionFilter('')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                actionFilter === ''
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md'
                  : 'border-orange-300 text-orange-600 hover:bg-orange-50'
              }`}
            >
              الكل
            </Button>
            {Object.entries(ACTION_LABELS).map(([action, label]) => (
              <Button
                key={action}
                variant={actionFilter === action ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActionFilter(action)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  actionFilter === action
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ArrowLeft className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-900">السجلات</CardTitle>
                <p className="text-sm text-gray-600 mt-1">إجمالي السجلات: {data?.meta?.total || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">مباشر</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {data?.data?.map((log: any) => (
              <div
                key={log.id}
                className="bg-gradient-to-r from-white to-red-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-orange-300 transition-all duration-300 hover:scale-[1.01]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <div className="h-4 w-4 bg-orange-500 rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {ACTION_LABELS[log.action] || log.action}
                        </h3>
                        <p className="text-sm text-gray-600">
                          بواسطة: {log.userName || 'مستخدم غير معروف'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="font-medium">الغرفة:</span>
                        <span>{log.roomName || 'غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="font-medium">التاريخ:</span>
                        <span>{new Date(log.createdAt).toLocaleString('ar-SA')}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="font-medium">المعرف:</span>
                        <span className="font-mono text-xs">{log.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                    {log.details && (
                      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-800">
                          <span className="font-medium">التفاصيل:</span> {log.details}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {(!data?.data || data.data.length === 0) && (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Filter className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">لا توجد سجلات</p>
                <p className="text-gray-400 text-sm mt-1">سيظهر السجل هنا عند حدوث الأحداث</p>
              </div>
            )}
          </div>

          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-6 py-2 border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-all duration-200"
              >
                السابق
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">صفحة</span>
                <span className="font-bold text-orange-600">{page}</span>
                <span className="text-sm text-gray-600">من</span>
                <span className="font-bold text-gray-900">{data.meta.totalPages}</span>
              </div>
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.meta.totalPages}
                className="px-6 py-2 border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-all duration-200"
              >
                التالي
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
