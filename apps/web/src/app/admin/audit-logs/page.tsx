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
      <div className="flex items-center justify-center py-8">
        <p className="text-lg">جاري التحميل...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">سجلات الأحداث</h1>
        <p className="text-gray-600">عرض جميع الأحداث والإجراءات في النظام</p>
      </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              تصفية حسب نوع الحدث
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={actionFilter === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActionFilter('')}
              >
                الكل
              </Button>
              {Object.entries(ACTION_LABELS).map(([action, label]) => (
                <Button
                  key={action}
                  variant={actionFilter === action ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActionFilter(action)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>السجلات ({data?.meta?.total || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data?.data?.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                      <span className="text-sm font-semibold">{log.actorName}</span>
                    </div>
                    <p className="text-sm text-gray-600">{log.details}</p>
                    {log.targetName && (
                      <p className="text-xs text-gray-500 mt-1">
                        الهدف: {log.targetName}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(log.timestamp).toLocaleString('ar-SA', {
                        dateStyle: 'medium',
                        timeStyle: 'medium',
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {(!data?.data || data.data.length === 0) && (
                <p className="text-center text-gray-500 py-8">لا توجد سجلات</p>
              )}
            </div>

            {data?.meta && data.meta.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  السابق
                </Button>
                <span className="flex items-center px-4">
                  صفحة {page} من {data.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= data.meta.totalPages}
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
