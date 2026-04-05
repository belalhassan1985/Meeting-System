'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { useRoomStore } from '@/store/room-store'
import type { ChatMessage } from '@arabic-meet/shared'

interface ChatPanelProps {
  onSendMessage: (message: string) => void
}

export function ChatPanel({ onSendMessage }: ChatPanelProps) {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatMessages = useRoomStore((state) => state.chatMessages)
  const userName = useRoomStore((state) => state.userName)
  const userId = useRoomStore((state) => state.userId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const formatTime = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
    return date.toLocaleTimeString('ar-IQ', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-700">
        <MessageCircle className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">الدردشة</h3>
        <span className="mr-auto text-sm text-gray-400">
          {chatMessages.length} رسالة
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">لا توجد رسائل بعد</p>
            <p className="text-xs mt-1">ابدأ المحادثة!</p>
          </div>
        ) : (
          <>
            {chatMessages.map((msg) => {
              const isOwnMessage = msg.userId === userId
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
                >
                  {!isOwnMessage && (
                    <span className="text-xs text-gray-400 mb-1 px-2">
                      {msg.userName}
                    </span>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      isOwnMessage
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    <p className="text-sm break-words">{msg.message}</p>
                    <span className={`text-xs mt-1 block ${
                      isOwnMessage ? 'text-blue-200' : 'text-gray-400'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            maxLength={1000}
            dir="auto"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">إرسال</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {message.length}/1000 حرف
        </p>
      </form>
    </div>
  )
}
