'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Film, Download, Trash2, Clock, Calendar, User, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_BASE = `${API_URL}/api`

interface Recording {
  id: string
  roomId: string
  startedBy: string
  egressId: string
  status: 'starting' | 'active' | 'stopping' | 'completed' | 'failed'
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  duration: number | null
  startedAt: string
  endedAt: string | null
  errorMessage: string | null
  room?: {
    id: string
    name: string
  }
  user?: {
    id: string
    name: string
    username: string
  }
}

export default function RecordingsPage() {
  const router = useRouter()
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('userInfo')

    if (!token || !userStr) {
      router.push('/admin/login')
      return
    }

    try {
      const user = JSON.parse(userStr)
      if (user?.role !== 'admin') {
        router.push('/dashboard')
        return
      }
    } catch {
      router.push('/admin/login')
      return
    }

    fetchRecordings()
  }, [page, router])

  const fetchRecordings = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/recordings?page=${page}&limit=${limit}`)
      if (res.ok) {
        const data = await res.json()
        setRecordings(data.recordings || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching recordings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (recordingId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التسجيل؟')) return

    try {
      const res = await fetch(`${API_BASE}/recordings/${recordingId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        alert('تم حذف التسجيل بنجاح')
        fetchRecordings()
      } else {
        alert('فشل حذف التسجيل')
      }
    } catch (error) {
      console.error('Error deleting recording:', error)
      alert('فشل حذف التسجيل')
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-'
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    const mb = bytes / (1024 * 1024)
    if (mb < 1024) return `${mb.toFixed(2)} MB`
    const gb = mb / 1024
    return `${gb.toFixed(2)} GB`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      starting: { text: 'جاري البدء', color: 'bg-yellow-500', icon: Loader2 },
      active: { text: 'نشط', color: 'bg-red-500 animate-pulse', icon: Film },
      stopping: { text: 'جاري الإيقاف', color: 'bg-orange-500', icon: Loader2 },
      completed: { text: 'مكتمل', color: 'bg-green-500', icon: CheckCircle },
      failed: { text: 'فشل', color: 'bg-red-600', icon: XCircle },
    }
    const badge = badges[status as keyof typeof badges] || badges.completed
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </span>
    )
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <Film className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">إدارة التسجيلات</h1>
                <p className="text-gray-600">عرض وإدارة تسجيلات الاجتماعات</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-600">إجمالي التسجيلات</p>
              <p className="text-3xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>

        {/* Recordings List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : recordings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد تسجيلات</h3>
            <p className="text-gray-600">لم يتم تسجيل أي اجتماعات بعد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recordings.map((recording) => (
              <div key={recording.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {recording.room?.name || 'غرفة محذوفة'}
                      </h3>
                      {getStatusBadge(recording.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span className="text-sm">
                          {recording.user?.name || 'مستخدم محذوف'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formatDate(recording.startedAt)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{formatDuration(recording.duration)}</span>
                      </div>
                      
                      {recording.fileSize && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Download className="w-4 h-4" />
                          <span className="text-sm">{formatFileSize(recording.fileSize)}</span>
                        </div>
                      )}
                    </div>

                    {recording.fileName && (
                      <div className="mt-3 text-sm text-gray-500">
                        <span className="font-medium">اسم الملف:</span> {recording.fileName}
                      </div>
                    )}

                    {recording.errorMessage && (
                      <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">خطأ في التسجيل</p>
                          <p className="text-sm text-red-700 mt-1">{recording.errorMessage}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mr-4">
                    {recording.status === 'completed' && recording.fileUrl && (
                      <a
                        href={`${API_URL}${recording.fileUrl}`}
                        download={recording.fileName || 'recording.webm'}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                      >
                        <Download className="w-4 h-4" />
                        <span>تحميل</span>
                      </a>
                    )}
                    
                    <button
                      onClick={() => handleDelete(recording.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            
            <span className="px-4 py-2 text-gray-700">
              صفحة {page} من {totalPages}
            </span>
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
