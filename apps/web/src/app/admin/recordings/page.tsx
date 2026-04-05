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
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header with gradient */}
      <div className="mb-8 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">إدارة التسجيلات</h1>
            <p className="text-purple-100 text-lg">عرض وإدارة تسجيلات الاجتماعات</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-purple-100">التسجيل نشط</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Film className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm text-purple-100">إجمالي التسجيلات</p>
              <p className="text-2xl font-bold text-white">{total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recordings List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-lg text-gray-600">جاري تحميل التسجيلات...</p>
          </div>
        </div>
      ) : recordings.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Film className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg font-medium">لا توجد تسجيلات</p>
          <p className="text-gray-400 text-sm mt-1">سيظهر التسجيلات هنا عند تسجيل الاجتماعات</p>
        </div>
      ) : (
        <div className="space-y-6">
          {recordings.map((recording) => (
            <div
              key={recording.id}
              className="bg-gradient-to-r from-white to-purple-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-300 transition-all duration-300 hover:scale-[1.01]"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Film className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 group-hover:text-purple-600 transition-colors">
                        {recording.room?.name || `غرفة ${recording.roomId}`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        بواسطة: {recording.user?.name || recording.startedBy}
                      </p>
                    </div>
                    {getStatusBadge(recording.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                      <Clock className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">
                        المدة: {formatDuration(recording.duration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">
                        البدء: {formatDate(recording.startedAt)}
                      </span>
                    </div>
                    {recording.fileSize && (
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                        <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                        <span className="font-medium">
                          الحجم: {formatFileSize(recording.fileSize)}
                        </span>
                      </div>
                    )}
                    {recording.endedAt && (
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">
                          الانتهاء: {formatDate(recording.endedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                  {recording.errorMessage && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">خطأ في التسجيل</p>
                          <p className="text-sm text-red-700">{recording.errorMessage}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {recording.status === 'completed' && recording.fileUrl && (
                    <a
                      href={recording.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      تحميل
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(recording.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-6 py-2 border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            السابق
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">صفحة</span>
            <span className="font-bold text-purple-600">{page}</span>
            <span className="text-sm text-gray-600">من</span>
            <span className="font-bold text-gray-900">{totalPages}</span>
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-6 py-2 border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  )
}
