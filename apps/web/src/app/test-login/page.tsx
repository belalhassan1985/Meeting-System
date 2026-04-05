'use client'

import { useState } from 'react'

export default function TestLoginPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult(null)

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const API_BASE = `${API_URL}/api`
    
    try {
      console.log('Testing login with:', { username: 'testuser', password: '123456' })
      console.log('API URL:', API_URL)

      const response = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: 'testuser', 
          password: '123456' 
        }),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log('Response data:', data)

      setResult({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: data,
      })
    } catch (error: any) {
      console.error('Error:', error)
      setResult({
        success: false,
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4" dir="rtl">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-4">اختبار تسجيل الدخول</h1>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}</p>
          <p className="text-sm text-gray-600">Username: testuser</p>
          <p className="text-sm text-gray-600">Password: 123456</p>
        </div>

        <button
          onClick={testLogin}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'جاري الاختبار...' : 'اختبار تسجيل الدخول'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h2 className="font-bold mb-2">النتيجة:</h2>
            <pre className="text-xs overflow-auto" dir="ltr">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p className="font-bold mb-2">افتح Console المتصفح (F12) لرؤية التفاصيل</p>
        </div>
      </div>
    </div>
  )
}
