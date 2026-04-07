'use client'

import { useEffect, useState } from 'react'
import {
  useParticipants,
  useLocalParticipant,
  useTracks,
  ParticipantTile,
  ControlBar,
  useRoomContext,
  TrackRefContext,
} from '@livekit/components-react'
import { Track, RemoteParticipant, LocalParticipant, ConnectionState } from 'livekit-client'
import { Mic, MicOff, Video, VideoOff, Hand, Pin, PinOff, Users, UserX, LogOut, Grid3x3, LayoutGrid, MessageCircle, Circle, Square, Wifi, WifiOff, Signal, SignalHigh, SignalMedium, SignalLow, Settings, HelpCircle } from 'lucide-react'
import { UserRole } from '@arabic-meet/shared'
import { useRouter } from 'next/navigation'
import { ChatPanel } from './chat-panel'
import { useRoomStore } from '@/store/room-store'
import { getSocket } from '@/lib/socket'
import type { ChatMessage } from '@arabic-meet/shared'
import { LocalRecordingService } from '@/lib/local-recording'
import { Watermark } from './ui/watermark'
import { PollSidebar } from './poll-sidebar'
import { PollUserDialog } from './poll-user-dialog'

interface CustomVideoConferenceProps {
  userRole: UserRole
}

export function CustomVideoConference({ userRole }: CustomVideoConferenceProps) {
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const room = useRoomContext()
  const [handRaised, setHandRaised] = useState(false)
  const [raisedHands, setRaisedHands] = useState<string[]>([])
  const [pinnedParticipantIds, setPinnedParticipantIds] = useState<string[]>([])
  const [layoutMode, setLayoutMode] = useState<'grid' | 'spotlight' | 'dual'>('grid')
  const [showParticipants, setShowParticipants] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showPolls, setShowPolls] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [participantStates, setParticipantStates] = useState<Record<string, { micEnabled: boolean; cameraEnabled: boolean }>>({})
  const [networkQuality, setNetworkQuality] = useState<Record<string, { quality: 'excellent' | 'good' | 'poor' | 'unknown'; stats?: any }>>({})
  const [showNetworkStats, setShowNetworkStats] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [videoQuality, setVideoQuality] = useState<'360p' | '480p' | '720p' | '1080p'>('720p')
  const [videoFps, setVideoFps] = useState<15 | 24 | 30 | 60>(30)
  const [videoBitrate, setVideoBitrate] = useState(2500) // kbps
  const [audioBitrate, setAudioBitrate] = useState(64) // kbps
  const [compactMode, setCompactMode] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // Advanced Admin Controls State
  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.HOST || userRole === UserRole.COHOST
  const [globalHardMute, setGlobalHardMute] = useState(false)
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [localRecorder] = useState(() => new LocalRecordingService())
  const router = useRouter()
  const { addChatMessage, roomId, userId, userName, setActivePoll, setPollResults } = useRoomStore()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const API_BASE = `${API_URL}/api`

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )

  // Hard Mute Logic: Prevent unmuting if locked
  useEffect(() => {
    if (globalHardMute && !isAdmin && room && localParticipant) {
      const handleTrackUnmuted = (publication: any) => {
        if (publication.source === Track.Source.Microphone) {
          // Immediately disable it again
          localParticipant.setMicrophoneEnabled(false)
          alert('الميكروفون مغلق من قبل مدير الاجتماع.')
        }
      }
      localParticipant.on('localTrackUnpublished', handleTrackUnmuted)
      localParticipant.on('trackUnmuted', handleTrackUnmuted)

      // Also check periodically just in case
      const interval = setInterval(() => {
        if (localParticipant.isMicrophoneEnabled) {
          localParticipant.setMicrophoneEnabled(false)
        }
      }, 500)

      return () => {
        localParticipant.off('localTrackUnpublished', handleTrackUnmuted)
        localParticipant.off('trackUnmuted', handleTrackUnmuted)
        clearInterval(interval)
      }
    }
  }, [globalHardMute, isAdmin, room, localParticipant])

  // Auto-enable compact mode for many participants
  useEffect(() => {
    if (tracks.length > 12 && !compactMode) {
      setCompactMode(true)
    }
  }, [tracks.length])

  // Detect mobile devices and handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      // Auto-close sidebars on mobile when switching
      if (mobile) {
        if (showChat || showSettings || showNetworkStats || showParticipants || showPolls) {
          // Keep only one sidebar open at a time on mobile
        }
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // WebSocket chat integration
  useEffect(() => {
    const socket = getSocket()

    const handleChatMessage = (message: ChatMessage) => {
      addChatMessage(message)
      if (!showChat) {
        setUnreadMessages(prev => prev + 1)
      }
    }

    const handleNewPoll = (poll: any) => {
      setActivePoll(poll)
    }

    const handlePollResultsUpdate = (data: any) => {
      setPollResults(data)
    }

    socket.on('room:chat', handleChatMessage)
    socket.on('new_poll', handleNewPoll)
    socket.on('poll_results_update', handlePollResultsUpdate)

    return () => {
      socket.off('room:chat', handleChatMessage)
      socket.off('new_poll', handleNewPoll)
      socket.off('poll_results_update', handlePollResultsUpdate)
    }
  }, [addChatMessage, showChat, setActivePoll, setPollResults])

  // Reset unread count when chat is opened
  useEffect(() => {
    if (showChat) {
      setUnreadMessages(0)
    }
  }, [showChat])

  const handleSendMessage = (message: string) => {
    const socket = getSocket()
    socket.emit('room:chat', { message })
  }

  // Recording is manual only - no automatic check
  // User must click the record button to start recording

  // Recording duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } else {
      setRecordingDuration(0)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartRecording = async () => {
    if (!roomId || !userId) return
    try {
      // Create recording entry in database
      const res = await fetch(`${API_BASE}/recordings/start/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (res.ok) {
        const recording = await res.json()
        setRecordingId(recording.id)

        // Start local recording
        try {
          const roomElement = document.querySelector('.lk-video-conference')
          await localRecorder.startRecording(roomElement as HTMLElement)
          setIsRecording(true)
          console.log('✅ Local recording started successfully')
        } catch (error) {
          console.error('Failed to start local recording:', error)
          // Rollback database entry if recording fails
          await fetch(`${API_BASE}/recordings/${recording.id}`, { method: 'DELETE' })
          setRecordingId(null)
          alert('فشل بدء التسجيل. تأكد من السماح بمشاركة الشاشة.')
          return
        }
      } else {
        const error = await res.json()
        alert('فشل بدء التسجيل: ' + (error.message || 'خطأ غير معروف'))
      }
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('فشل بدء التسجيل')
    }
  }

  const handleStopRecording = async () => {
    if (!recordingId || !userId) return
    if (!confirm('هل تريد إيقاف التسجيل؟')) return

    try {
      // Check if recording is actually active
      if (!localRecorder.isRecording()) {
        alert('لا يوجد تسجيل نشط')
        setIsRecording(false)
        setRecordingId(null)
        return
      }

      // Stop local recording and get blob
      const blob = await localRecorder.stopRecording()
      setIsRecording(false)
      const fileSizeMB = (blob.size / 1024 / 1024).toFixed(2)
      console.log(`📹 Recording stopped, size: ${fileSizeMB} MB`)

      // Check file size (max 500MB)
      if (blob.size > 500 * 1024 * 1024) {
        alert(`⚠️ حجم الملف كبير جداً (${fileSizeMB} MB)!\nالحد الأقصى: 500 MB\nحاول تسجيل فترة أقصر.`)
        setRecordingId(null)
        setRecordingDuration(0)
        return
      }

      // Update recording status in database
      const res = await fetch(`${API_BASE}/recordings/stop/${recordingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (res.ok) {
        // Upload recording file
        alert(`⏳ جاري رفع الملف (${fileSizeMB} MB)...\nقد يستغرق بضع دقائق، لا تغلق المتصفح!`)
        console.log('⏳ Uploading recording...')

        try {
          await localRecorder.uploadRecording(recordingId, blob, API_BASE)
          setRecordingId(null)
          setRecordingDuration(0)
          alert(`✅ تم حفظ التسجيل بنجاح!\nالحجم: ${fileSizeMB} MB`)
        } catch (uploadError) {
          console.error('Upload failed:', uploadError)
          alert(`❌ فشل رفع الملف!\nالخطأ: ${(uploadError as Error).message}\n\nالملف محفوظ محلياً، حاول مرة أخرى لاحقاً.`)
        }
      } else {
        alert('فشل حفظ التسجيل في قاعدة البيانات')
      }
    } catch (error) {
      console.error('Error stopping recording:', error)
      setIsRecording(false)
      alert('فشل إيقاف التسجيل: ' + (error as Error).message)
    }
  }

  // Track participant device states
  useEffect(() => {
    if (!room) return

    const updateParticipantState = (participant: RemoteParticipant | LocalParticipant) => {
      // Guard against disconnected or missing participants
      if (!participant || !participant.identity) return

      const micTrack = participant.getTrackPublication(Track.Source.Microphone)
      const cameraTrack = participant.getTrackPublication(Track.Source.Camera)

      setParticipantStates(prev => ({
        ...prev,
        [participant.identity]: {
          micEnabled: micTrack ? !micTrack.isMuted : false,
          cameraEnabled: cameraTrack ? !cameraTrack.isMuted : false,
        }
      }))
    }

    updateParticipantState(localParticipant)
    participants.forEach(updateParticipantState)

    const handleTrackMuted = () => {
      updateParticipantState(localParticipant)
      participants.forEach(updateParticipantState)
    }

    const handleTrackUnmuted = () => {
      updateParticipantState(localParticipant)
      participants.forEach(updateParticipantState)
    }

    participants.forEach(participant => {
      participant.on('trackMuted', handleTrackMuted)
      participant.on('trackUnmuted', handleTrackUnmuted)
    })

    localParticipant.on('trackMuted', handleTrackMuted)
    localParticipant.on('trackUnmuted', handleTrackUnmuted)

    room.on('participantConnected', (participant: RemoteParticipant) => {
      updateParticipantState(participant)
      participant.on('trackMuted', handleTrackMuted)
      participant.on('trackUnmuted', handleTrackUnmuted)
    })

    room.on('participantDisconnected', (participant: RemoteParticipant) => {
      setParticipantStates(prev => {
        const newState = { ...prev }
        delete newState[participant.identity]
        return newState
      })

      setRaisedHands(prev => prev.filter(id => id !== participant.identity))
      setPinnedParticipantIds(prev => prev.filter(id => id !== participant.identity))
    })

    return () => {
      participants.forEach(participant => {
        participant.off('trackMuted', handleTrackMuted)
        participant.off('trackUnmuted', handleTrackUnmuted)
      })
      localParticipant.off('trackMuted', handleTrackMuted)
      localParticipant.off('trackUnmuted', handleTrackUnmuted)
    }
  }, [room, participants, localParticipant])

  // Handle hand raise
  const toggleHandRaise = async () => {
    const newState = !handRaised
    setHandRaised(newState)

    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify({
      type: 'hand-raise',
      raised: newState,
      participantId: localParticipant.identity,
    }))
    await localParticipant.publishData(data, { reliable: true })
  }

  // Listen for hand raise events
  useEffect(() => {
    if (!room) return

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant | LocalParticipant
    ) => {
      const decoder = new TextDecoder()
      const data = JSON.parse(decoder.decode(payload))

      if (data.type === 'hand-raise') {
        setRaisedHands(prev => {
          if (data.raised) {
            // Add to the end of the queue if not already present
            return prev.includes(data.participantId) ? prev : [...prev, data.participantId]
          } else {
            // Remove from the queue
            return prev.filter(id => id !== data.participantId)
          }
        })
      }
    }

    room.on('dataReceived', handleDataReceived)
    return () => {
      room.off('dataReceived', handleDataReceived)
    }
  }, [room])

  // Monitor network quality for all participants
  useEffect(() => {
    if (!room) return

    const updateNetworkQuality = (participant: RemoteParticipant | LocalParticipant) => {
      const identity = participant.identity

      // Get connection quality from LiveKit
      const connectionQuality = participant.connectionQuality

      let quality: 'excellent' | 'good' | 'poor' | 'unknown' = 'unknown'

      if (connectionQuality === 'excellent') quality = 'excellent'
      else if (connectionQuality === 'good') quality = 'good'
      else if (connectionQuality === 'poor') quality = 'poor'

      setNetworkQuality(prev => ({
        ...prev,
        [identity]: { quality }
      }))
    }

    // Monitor local participant
    updateNetworkQuality(localParticipant)

    // Monitor remote participants
    participants.forEach(updateNetworkQuality)

    // Listen for quality changes
    const handleConnectionQualityChanged = (quality: any, participant: any) => {
      updateNetworkQuality(participant)
    }

    room.on('connectionQualityChanged', handleConnectionQualityChanged)

    // Update quality every 5 seconds
    const interval = setInterval(() => {
      updateNetworkQuality(localParticipant)
      participants.forEach(updateNetworkQuality)
    }, 5000)

    return () => {
      room.off('connectionQualityChanged', handleConnectionQualityChanged)
      clearInterval(interval)
    }
  }, [room, participants, localParticipant])

  // Admin controls
  const muteParticipant = async (participant: RemoteParticipant) => {
    if (!isAdmin) return
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify({ type: 'admin-mute', targetId: participant.identity }))
    await localParticipant.publishData(data, { reliable: true })
    setTimeout(() => {
      setParticipantStates(prev => ({
        ...prev,
        [participant.identity]: { ...prev[participant.identity], micEnabled: false }
      }))
    }, 100)
  }

  const disableCamera = async (participant: RemoteParticipant) => {
    if (!isAdmin) return
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify({ type: 'admin-disable-camera', targetId: participant.identity }))
    await localParticipant.publishData(data, { reliable: true })
    setTimeout(() => {
      setParticipantStates(prev => ({
        ...prev,
        [participant.identity]: { ...prev[participant.identity], cameraEnabled: false }
      }))
    }, 100)
  }

  const stopScreenShare = async (participant: RemoteParticipant) => {
    if (!isAdmin) return
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify({ type: 'admin-stop-screenshare', targetId: participant.identity }))
    await localParticipant.publishData(data, { reliable: true })
  }

  const kickParticipant = async (participantId: string) => {
    if (!isAdmin) return
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify({ type: 'admin-kick', targetId: participantId }))
    await localParticipant.publishData(data, { reliable: true })
  }

  const lowerParticipantHand = async (participantId: string) => {
    if (!isAdmin) return
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify({ type: 'admin-lower-hand', targetId: participantId }))
    await localParticipant.publishData(data, { reliable: true })

    // Optimistically update UI locally
    setRaisedHands(prev => prev.filter(id => id !== participantId))
  }

  // Apply quality settings to local tracks
  const applyQualitySettings = async () => {
    try {
      // Get resolution from quality setting
      const resolutions = {
        '360p': { width: 640, height: 360 },
        '480p': { width: 854, height: 480 },
        '720p': { width: 1280, height: 720 },
        '1080p': { width: 1920, height: 1080 }
      }

      const resolution = resolutions[videoQuality]

      // Update video track constraints
      const videoTrack = localParticipant.videoTrackPublications.values().next().value?.track
      if (videoTrack) {
        // Restart track with new settings
        await videoTrack.restartTrack({
          resolution: resolution,
          frameRate: videoFps,
        })
      }

      // Note: LiveKit handles bitrate automatically based on resolution and network conditions
      // You can set preferred encoding parameters when creating the room connection

      alert(`تم تطبيق الإعدادات:\n- الدقة: ${videoQuality}\n- FPS: ${videoFps}\n- فيديو: ${videoBitrate} kbps\n- صوت: ${audioBitrate} kbps`)
    } catch (error) {
      console.error('Error applying quality settings:', error)
      alert('حدث خطأ أثناء تطبيق الإعدادات')
    }
  }

  const handleLeave = async () => {
    try {
      await room?.disconnect()
    } catch (error) {
      console.error('Error disconnecting:', error)
    } finally {
      router.push('/')
    }
  }

  // Listen for admin commands
  useEffect(() => {
    if (!room) return

    const handleDataReceived = async (payload: Uint8Array) => {
      const decoder = new TextDecoder()
      const data = JSON.parse(decoder.decode(payload))

      // Handle broadcast messages (no targetId required)
      if (data.type === 'admin-lock-mics') {
        setGlobalHardMute(data.locked)
        if (data.locked && !isAdmin) {
          await localParticipant.setMicrophoneEnabled(false)
        }
        return
      } else if (data.type === 'admin-force-pin') {
        setPinnedParticipantIds([data.targetId])
        setLayoutMode('spotlight')
        return
      } else if (data.type === 'admin-force-unpin') {
        setPinnedParticipantIds([])
        setLayoutMode('grid')
        return
      }

      // Handle targeted messages (targetId required)
      if (data.targetId !== localParticipant.identity) return

      if (data.type === 'admin-mute' || data.type === 'admin-mute-mic') {
        await localParticipant.setMicrophoneEnabled(false)
      } else if (data.type === 'admin-disable-camera') {
        await localParticipant.setCameraEnabled(false)
      } else if (data.type === 'admin-stop-screenshare') {
        const screenShareTrack = localParticipant.getTrackPublication(Track.Source.ScreenShare)
        if (screenShareTrack) await localParticipant.unpublishTrack(screenShareTrack.track!)
      } else if (data.type === 'admin-kick') {
        await room?.disconnect()
        alert('تم طردك من الغرفة من قبل المسؤول')
        router.push('/')
      } else if (data.type === 'admin-lower-hand') {
        setHandRaised(false)
        setRaisedHands(prev => prev.filter(id => id !== localParticipant.identity))
      }
    }

    room.on('dataReceived', handleDataReceived)
    return () => {
      room.off('dataReceived', handleDataReceived)
    }
  }, [room, localParticipant, isAdmin])

  const togglePin = (participantId: string) => {
    setPinnedParticipantIds(prev => {
      if (prev.includes(participantId)) {
        // Unpin
        const newPinned = prev.filter(id => id !== participantId)
        if (newPinned.length === 0) setLayoutMode('grid')
        else if (newPinned.length === 1) setLayoutMode('spotlight')
        return newPinned
      } else {
        // Pin (max 2)
        if (prev.length >= 2) {
          alert('يمكنك تثبيت شاشتين كحد أقصى')
          return prev
        }
        const newPinned = [...prev, participantId]
        if (newPinned.length === 1) setLayoutMode('spotlight')
        else if (newPinned.length === 2) setLayoutMode('dual')
        return newPinned
      }
    })
  }

  const screenShareTrack = tracks.find(t => t.publication?.source === Track.Source.ScreenShare)
  const pinnedTracks = pinnedParticipantIds
    .map(id => tracks.find(t => t.participant.identity === id))
    .filter(Boolean) as any[]

  // Separate local and remote tracks for layout
  const localTracks = tracks.filter(t => t.participant.identity === localParticipant.identity)

  // Main track(s) based on layout mode
  const mainTracks = screenShareTrack
    ? [screenShareTrack] // Screen share always takes precedence
    : layoutMode === 'spotlight'
      ? [pinnedTracks[0] || localTracks[0] || tracks[0]].filter(Boolean)
      : layoutMode === 'dual'
        ? pinnedTracks.slice(0, 2)
        : []

  const otherTracks = tracks.filter(t => !mainTracks.includes(t as any))

  // Professional grid layout calculation (like Google Meet/Zoom)
  const getGridLayout = () => {
    const count = tracks.length

    // Calculate optimal rows and columns
    if (count === 1) return { cols: 1, rows: 1, class: 'grid-cols-1' }
    if (count === 2) return { cols: 2, rows: 1, class: 'grid-cols-2' }
    if (count <= 4) return { cols: 2, rows: 2, class: 'grid-cols-2' }
    if (count <= 6) return { cols: 3, rows: 2, class: 'grid-cols-3' }
    if (count <= 9) return { cols: 3, rows: 3, class: 'grid-cols-3' }
    if (count <= 12) return { cols: 4, rows: 3, class: 'grid-cols-4' }
    if (count <= 16) return { cols: 4, rows: 4, class: 'grid-cols-4' }
    if (count <= 20) return { cols: 5, rows: 4, class: 'grid-cols-5' }
    if (count <= 25) return { cols: 5, rows: 5, class: 'grid-cols-5' }
    return { cols: 6, rows: Math.ceil(count / 6), class: 'grid-cols-6' }
  }

  const gridLayout = getGridLayout()

  const renderVideoTile = (trackRef: any, isLarge = false, isSidebar = false) => {
    const participant = trackRef.participant
    const isLocal = participant instanceof LocalParticipant
    const hasRaisedHand = raisedHands.includes(participant.identity)
    const raisedHandIndex = raisedHands.indexOf(participant.identity) + 1 // 1-based index
    const isPinned = pinnedParticipantIds.includes(participant.identity)
    const isScreenShare = trackRef.publication?.source === Track.Source.ScreenShare
    const deviceState = participantStates[participant.identity] || { micEnabled: false, cameraEnabled: false }
    const quality = networkQuality[participant.identity]?.quality || 'unknown'

    // Network quality icon and color
    const getQualityIcon = () => {
      switch (quality) {
        case 'excellent': return <SignalHigh className="w-4 h-4" />
        case 'good': return <SignalMedium className="w-4 h-4" />
        case 'poor': return <SignalLow className="w-4 h-4" />
        default: return <Signal className="w-4 h-4" />
      }
    }

    const getQualityColor = () => {
      switch (quality) {
        case 'excellent': return 'text-green-500'
        case 'good': return 'text-yellow-500'
        case 'poor': return 'text-red-500'
        default: return 'text-gray-400'
      }
    }

    return (
      <div
        key={trackRef.publication?.trackSid || participant.identity}
        className={`relative bg-gray-800 rounded-md overflow-hidden group ${isLarge
          ? 'w-full h-full'
          : isSidebar
            ? 'w-full flex-shrink-0'
            : 'w-full h-full flex items-center justify-center'
          }`}
        style={
          isLarge
            ? {}
            : isSidebar
              ? { aspectRatio: '16/9', minHeight: '140px' }
              : { aspectRatio: '16/9' }
        }
      >
        <div className="absolute inset-0">
          <TrackRefContext.Provider value={trackRef}>
            <ParticipantTile />
          </TrackRefContext.Provider>
        </div>

        {/* Screen share indicator */}
        {isScreenShare && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-lg z-20 flex items-center gap-2 text-sm">
            <Video className="w-4 h-4" />
            <span className="font-medium">مشاركة الشاشة - {participant.name || participant.identity}</span>
            {isAdmin && !isLocal && (
              <button
                onClick={() => {
                  if (participant instanceof RemoteParticipant && confirm(`هل تريد إيقاف مشاركة الشاشة؟`)) {
                    stopScreenShare(participant)
                  }
                }}
                className="bg-red-600 hover:bg-red-700 px-2 py-0.5 rounded text-xs ml-1"
              >
                إيقاف
              </button>
            )}
          </div>
        )}

        {/* Network Quality Indicator - Always visible */}
        {!isScreenShare && (
          <div className={`absolute top-2 left-2 z-20 ${getQualityColor()}`} title={`جودة الاتصال: ${quality === 'excellent' ? 'ممتازة' : quality === 'good' ? 'جيدة' : quality === 'poor' ? 'ضعيفة' : 'غير معروفة'}`}>
            {getQualityIcon()}
          </div>
        )}

        {/* Status indicators - Normal mode */}
        {!isScreenShare && !compactMode && (
          <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {hasRaisedHand && (
              <div className="bg-yellow-500 p-1.5 rounded-full flex items-center justify-center gap-1">
                <span className="text-yellow-900 text-xs font-bold leading-none">{raisedHandIndex}</span>
                <Hand className="w-4 h-4 text-yellow-900" />
              </div>
            )}

            {isAdmin && !isLocal ? (
              <>
                <button
                  onClick={() => participant instanceof RemoteParticipant && muteParticipant(participant)}
                  className={`p-1.5 rounded-full transition ${deviceState.micEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600'
                    }`}
                >
                  {deviceState.micEnabled ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white" />}
                </button>
                <button
                  onClick={() => participant instanceof RemoteParticipant && disableCamera(participant)}
                  className={`p-1.5 rounded-full transition ${deviceState.cameraEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600'
                    }`}
                >
                  {deviceState.cameraEnabled ? <Video className="w-4 h-4 text-white" /> : <VideoOff className="w-4 h-4 text-white" />}
                </button>
              </>
            ) : (
              <>
                <div className={`p-1.5 rounded-full ${deviceState.micEnabled ? 'bg-green-600' : 'bg-red-600'}`}>
                  {deviceState.micEnabled ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white" />}
                </div>
                <div className={`p-1.5 rounded-full ${deviceState.cameraEnabled ? 'bg-green-600' : 'bg-red-600'}`}>
                  {deviceState.cameraEnabled ? <Video className="w-4 h-4 text-white" /> : <VideoOff className="w-4 h-4 text-white" />}
                </div>
              </>
            )}
          </div>
        )}

        {/* Compact mode indicators */}
        {compactMode && !isScreenShare && (
          <div className="absolute top-1 right-1 flex gap-0.5 z-20">
            {hasRaisedHand && (
              <div className="bg-yellow-500 p-0.5 rounded flex items-center gap-0.5">
                <span className="text-yellow-900 text-[10px] font-bold leading-none pl-0.5">{raisedHandIndex}</span>
                <Hand className="w-3 h-3 text-yellow-900" />
              </div>
            )}
            {!deviceState.micEnabled && <div className="bg-red-600 p-0.5 rounded"><MicOff className="w-3 h-3 text-white" /></div>}
            {!deviceState.cameraEnabled && <div className="bg-red-600 p-0.5 rounded"><VideoOff className="w-3 h-3 text-white" /></div>}
          </div>
        )}

        {/* Pin button */}
        {!isScreenShare && !compactMode && (
          <button
            onClick={() => togglePin(participant.identity)}
            className="absolute bottom-12 left-2 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>
        )}

        {/* Participant name */}
        <div className={`absolute bottom-1 left-1 right-1 bg-gradient-to-t from-black/80 to-transparent text-white rounded-b z-10 ${compactMode ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'
          }`}>
          <div className="truncate font-medium">{participant.name || participant.identity}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-950 relative">
      {/* Video Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {userName && <Watermark text={userName} />}
        {/* Chat Sidebar */}
        {showChat && (
          <div className={`absolute top-0 left-0 h-full bg-gray-900/95 backdrop-blur border-r border-gray-700 z-30 shadow-2xl ${isMobile ? 'w-full' : 'w-96'
            }`}>
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-white font-semibold">الدردشة</h3>
                <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatPanel onSendMessage={handleSendMessage} />
              </div>
            </div>
          </div>
        )}

        {/* Network Stats Sidebar */}
        {showNetworkStats && (
          <div className={`absolute top-0 right-0 h-full bg-gray-900/95 backdrop-blur border-l border-gray-700 z-30 overflow-y-auto shadow-2xl ${isMobile ? 'w-full' : 'w-96'
            }`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  إحصائيات جودة الاتصال
                </h3>
                <button onClick={() => setShowNetworkStats(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>

              <div className="space-y-3">
                {/* Local Participant */}
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{localParticipant.name || localParticipant.identity}</span>
                      <span className="text-xs text-blue-400">(أنت)</span>
                    </div>
                    <div className={`flex items-center gap-1 ${networkQuality[localParticipant.identity]?.quality === 'excellent' ? 'text-green-500' : networkQuality[localParticipant.identity]?.quality === 'good' ? 'text-yellow-500' : networkQuality[localParticipant.identity]?.quality === 'poor' ? 'text-red-500' : 'text-gray-400'}`}>
                      {networkQuality[localParticipant.identity]?.quality === 'excellent' && <SignalHigh className="w-4 h-4" />}
                      {networkQuality[localParticipant.identity]?.quality === 'good' && <SignalMedium className="w-4 h-4" />}
                      {networkQuality[localParticipant.identity]?.quality === 'poor' && <SignalLow className="w-4 h-4" />}
                      {!networkQuality[localParticipant.identity] && <Signal className="w-4 h-4" />}
                      <span className="text-xs font-medium">
                        {networkQuality[localParticipant.identity]?.quality === 'excellent' ? 'ممتاز' :
                          networkQuality[localParticipant.identity]?.quality === 'good' ? 'جيد' :
                            networkQuality[localParticipant.identity]?.quality === 'poor' ? 'ضعيف' : 'غير معروف'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remote Participants */}
                {participants.map((participant) => {
                  const quality = networkQuality[participant.identity]?.quality || 'unknown'
                  return (
                    <div key={participant.identity} className="bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm truncate flex-1">{participant.name || participant.identity}</span>
                        <div className={`flex items-center gap-1 ${quality === 'excellent' ? 'text-green-500' : quality === 'good' ? 'text-yellow-500' : quality === 'poor' ? 'text-red-500' : 'text-gray-400'}`}>
                          {quality === 'excellent' && <SignalHigh className="w-4 h-4" />}
                          {quality === 'good' && <SignalMedium className="w-4 h-4" />}
                          {quality === 'poor' && <SignalLow className="w-4 h-4" />}
                          {quality === 'unknown' && <Signal className="w-4 h-4" />}
                          <span className="text-xs font-medium">
                            {quality === 'excellent' ? 'ممتاز' : quality === 'good' ? 'جيد' : quality === 'poor' ? 'ضعيف' : 'غير معروف'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Info Box */}
                <div className="bg-blue-900/30 border border-blue-700 p-3 rounded-lg mt-4">
                  <h4 className="text-blue-300 text-sm font-medium mb-2">معلومات الجودة:</h4>
                  <div className="space-y-1 text-xs text-gray-300">
                    <div className="flex items-center gap-2">
                      <SignalHigh className="w-3 h-3 text-green-500" />
                      <span><strong className="text-green-400">ممتاز:</strong> اتصال قوي ومستقر</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <SignalMedium className="w-3 h-3 text-yellow-500" />
                      <span><strong className="text-yellow-400">جيد:</strong> اتصال مقبول</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <SignalLow className="w-3 h-3 text-red-500" />
                      <span><strong className="text-red-400">ضعيف:</strong> قد يحدث تقطع</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Sidebar */}
        {showSettings && (
          <div className={`absolute top-0 right-0 h-full bg-gray-900/95 backdrop-blur border-l border-gray-700 z-30 overflow-y-auto shadow-2xl ${isMobile ? 'w-full' : 'w-96'
            }`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  إعدادات الجودة
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>

              <div className="space-y-6">
                {/* Video Quality Section */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    جودة الفيديو
                  </h4>

                  {/* Resolution */}
                  <div className="mb-4">
                    <label className="text-gray-300 text-sm mb-2 block">الدقة (Resolution)</label>
                    <select
                      value={videoQuality}
                      onChange={(e) => setVideoQuality(e.target.value as any)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="360p">360p (640×360) - منخفضة</option>
                      <option value="480p">480p (854×480) - متوسطة</option>
                      <option value="720p">720p (1280×720) - HD</option>
                      <option value="1080p">1080p (1920×1080) - Full HD</option>
                    </select>
                  </div>

                  {/* FPS */}
                  <div className="mb-4">
                    <label className="text-gray-300 text-sm mb-2 block">
                      معدل الإطارات (FPS)
                      <span className="text-gray-500 text-xs mr-2">الحالي: {videoFps}</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[15, 24, 30, 60].map(fps => (
                        <button
                          key={fps}
                          onClick={() => setVideoFps(fps as any)}
                          className={`px-3 py-2 rounded text-sm font-medium transition ${videoFps === fps
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                          {fps}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Video Bitrate */}
                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">
                      معدل البت للفيديو (Bitrate)
                      <span className="text-blue-400 text-xs mr-2">{videoBitrate} kbps</span>
                    </label>
                    <input
                      type="range"
                      min="500"
                      max="8000"
                      step="100"
                      value={videoBitrate}
                      onChange={(e) => setVideoBitrate(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>منخفض (500)</span>
                      <span>عالي (8000)</span>
                    </div>
                  </div>
                </div>

                {/* Audio Quality Section */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    جودة الصوت
                  </h4>

                  {/* Audio Bitrate */}
                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">
                      معدل البت للصوت (Bitrate)
                      <span className="text-blue-400 text-xs mr-2">{audioBitrate} kbps</span>
                    </label>
                    <input
                      type="range"
                      min="32"
                      max="320"
                      step="8"
                      value={audioBitrate}
                      onChange={(e) => setAudioBitrate(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>منخفض (32)</span>
                      <span>عالي (320)</span>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={applyQualitySettings}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Settings className="w-5 h-5" />
                  تطبيق الإعدادات
                </button>

                {/* Info Box */}
                <div className="bg-yellow-900/30 border border-yellow-700 p-3 rounded-lg">
                  <h4 className="text-yellow-300 text-sm font-medium mb-2">ملاحظات:</h4>
                  <ul className="space-y-1 text-xs text-gray-300 list-disc list-inside">
                    <li>الدقة الأعلى تحتاج اتصال إنترنت أقوى</li>
                    <li>FPS الأعلى يجعل الحركة أكثر سلاسة</li>
                    <li>Bitrate الأعلى يحسن الجودة لكن يستهلك بيانات أكثر</li>
                    <li>الإعدادات تؤثر على الفيديو المرسل فقط</li>
                  </ul>
                </div>

                {/* Presets */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-3">إعدادات جاهزة</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setVideoQuality('360p')
                        setVideoFps(15)
                        setVideoBitrate(800)
                        setAudioBitrate(32)
                      }}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition text-right"
                    >
                      🔋 توفير البيانات (اتصال ضعيف)
                    </button>
                    <button
                      onClick={() => {
                        setVideoQuality('720p')
                        setVideoFps(30)
                        setVideoBitrate(2500)
                        setAudioBitrate(64)
                      }}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition text-right"
                    >
                      ⚖️ متوازن (موصى به)
                    </button>
                    <button
                      onClick={() => {
                        setVideoQuality('1080p')
                        setVideoFps(60)
                        setVideoBitrate(6000)
                        setAudioBitrate(128)
                      }}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition text-right"
                    >
                      ⚡ أعلى جودة (اتصال قوي)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Participants Sidebar */}
        {isAdmin && showParticipants && (
          <div className={`absolute top-0 right-0 h-full bg-gray-900/95 backdrop-blur border-l border-gray-700 z-30 overflow-y-auto shadow-2xl ${isMobile ? 'w-full' : 'w-80'
            }`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  المشاركون ({participants.length + 1})
                </h3>
                <button onClick={() => setShowParticipants(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>

              {/* Advanced Admin Controls Header */}
              <div className="bg-gray-800 p-3 rounded-lg mb-4 flex items-center justify-between">
                <div className="text-sm text-white font-medium flex-1">كتم إجباري للجميع</div>
                <button
                  onClick={async () => {
                    const newStatus = !globalHardMute
                    setGlobalHardMute(newStatus)
                    
                    // Send message to all participants
                    const encoder = new TextEncoder()
                    const data = encoder.encode(JSON.stringify({ type: 'admin-lock-mics', locked: newStatus }))
                    await localParticipant.publishData(data, { reliable: true })
                    
                    // If enabling hard mute, immediately mute all participants
                    if (newStatus && room) {
                      // Mute all remote participants
                      for (const participant of room.remoteParticipants.values()) {
                        const micTrack = participant.getTrackPublication(Track.Source.Microphone)
                        if (micTrack && micTrack.isSubscribed) {
                          // Send individual mute command
                          const muteData = encoder.encode(JSON.stringify({ 
                            type: 'admin-mute-mic', 
                            targetId: participant.identity 
                          }))
                          await localParticipant.publishData(muteData, { reliable: true })
                        }
                      }
                    }
                  }}
                  className={`w-12 h-6 rounded-full relative transition-colors ${globalHardMute ? 'bg-red-600' : 'bg-gray-600'}`}
                  title={globalHardMute ? "إلغاء الكتم الإجباري" : "تفعيل الكتم الإجباري"}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${globalHardMute ? 'left-1' : 'left-7'}`} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-white text-sm">{localParticipant.name || localParticipant.identity}</span>
                      <span className="text-xs text-blue-400">(أنت)</span>
                      {raisedHands.includes(localParticipant.identity) && (
                        <div className="flex items-center justify-center bg-yellow-500 w-5 h-5 rounded-full">
                          <span className="text-yellow-900 text-xs font-bold leading-none">
                            {raisedHands.indexOf(localParticipant.identity) + 1}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {participantStates[localParticipant.identity]?.micEnabled ?
                        <Mic className="w-4 h-4 text-green-500" /> : <MicOff className="w-4 h-4 text-red-500" />}
                      {participantStates[localParticipant.identity]?.cameraEnabled ?
                        <Video className="w-4 h-4 text-green-500" /> : <VideoOff className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                </div>

                {participants.map((participant) => {
                  const deviceState = participantStates[participant.identity] || { micEnabled: false, cameraEnabled: false }
                  return (
                    <div key={participant.identity} className="bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                          <span className="text-white text-sm truncate">{participant.name || participant.identity}</span>
                          {raisedHands.includes(participant.identity) && (
                            <div className="flex items-center justify-center bg-yellow-500 w-5 h-5 rounded-full flex-shrink-0">
                              <span className="text-yellow-900 text-xs font-bold leading-none">
                                {raisedHands.indexOf(participant.identity) + 1}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex gap-1">
                            {deviceState.micEnabled ? <Mic className="w-4 h-4 text-green-500" /> : <MicOff className="w-4 h-4 text-red-500" />}
                            {deviceState.cameraEnabled ? <Video className="w-4 h-4 text-green-500" /> : <VideoOff className="w-4 h-4 text-red-500" />}
                          </div>
                          <button
                            onClick={async () => {
                              const encoder = new TextEncoder()
                              if (pinnedParticipantIds.includes(participant.identity)) {
                                const data = encoder.encode(JSON.stringify({ type: 'admin-force-unpin' }))
                                await localParticipant.publishData(data, { reliable: true })
                                setPinnedParticipantIds([])
                                setLayoutMode('grid')
                              } else {
                                const data = encoder.encode(JSON.stringify({ type: 'admin-force-pin', targetId: participant.identity }))
                                await localParticipant.publishData(data, { reliable: true })
                                setPinnedParticipantIds([participant.identity])
                                setLayoutMode('spotlight')
                              }
                            }}
                            className={`${pinnedParticipantIds.includes(participant.identity) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'} text-white p-1.5 rounded transition`}
                            title={pinnedParticipantIds.includes(participant.identity) ? "إلغاء المتحدث الرئيسي للجميع" : "تعيين كمتحدث رئيسي للجميع"}
                          >
                            <Pin className="w-4 h-4" />
                          </button>
                          {raisedHands.includes(participant.identity) && (
                            <button
                              onClick={() => lowerParticipantHand(participant.identity)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white p-1.5 rounded transition"
                              title="خفض اليد"
                            >
                              <Hand className="w-4 h-4 fill-current rotate-180" />
                            </button>
                          )}
                          <button
                            onClick={() => confirm(`هل تريد طرد ${participant.name || participant.identity}؟`) && kickParticipant(participant.identity)}
                            className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded transition"
                            title="طرد المشارك"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Polls Sidebar */}
        {isAdmin && showPolls && (
          <div className={`absolute top-0 right-0 h-full bg-gray-900/95 backdrop-blur border-l border-gray-700 z-30 overflow-hidden shadow-2xl ${isMobile ? 'w-full' : 'w-96'
            }`}>
            <PollSidebar />
            <button onClick={() => setShowPolls(false)} className="absolute top-4 left-4 text-gray-400 hover:text-white text-xl z-10 bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
          </div>
        )}

        {mainTracks.length > 0 ? (
          <div className="flex-1 flex gap-3 p-3">
            {/* Main video area - 1 or 2 large videos */}
            <div className={`flex-1 flex gap-3 ${mainTracks.length === 2 ? 'flex-row' : ''
              }`}>
              {mainTracks.map(track => track && (
                <div key={track.participant.identity} className="flex-1">
                  {renderVideoTile(track, true, false)}
                </div>
              ))}
            </div>

            {/* Sidebar with other participants */}
            {otherTracks.length > 0 && (
              <div className="w-80 flex flex-col gap-3 overflow-y-auto overflow-x-hidden pr-2 pb-2">
                {otherTracks.map(trackRef => renderVideoTile(trackRef, false, true))}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`w-full h-full p-3 grid ${gridLayout.class} gap-3 auto-rows-fr overflow-y-auto overflow-x-hidden`}
            style={{
              gridAutoRows: `minmax(${compactMode ? '120px' : '180px'}, 1fr)`,
              alignContent: 'start'
            }}
          >
            {tracks.map(trackRef => renderVideoTile(trackRef, false))}
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={handleLeave}
            className={`flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition font-medium ${isMobile ? 'p-3' : 'px-4 py-2.5'
              }`}
          >
            <LogOut className="w-5 h-5" />
            {!isMobile && <span>خروج</span>}
          </button>

          <div className="flex items-center gap-3">
            <ControlBar />
            {!isAdmin && (
              <button
                onClick={toggleHandRaise}
                className={`p-3 rounded-lg transition ${handRaised ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
              >
                <Hand className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Recording Controls - Admin Only */}
            {isAdmin && (
              <>
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition font-medium"
                  >
                    <Circle className="w-5 h-5 fill-current" />
                    <span>تسجيل</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium">
                      <Circle className="w-3 h-3 fill-current animate-pulse" />
                      <span className="font-mono">{formatDuration(recordingDuration)}</span>
                    </div>
                    <button
                      onClick={handleStopRecording}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition font-medium"
                    >
                      <Square className="w-5 h-5" />
                      <span>إيقاف</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Layout Mode Controls */}
            {pinnedParticipantIds.length > 0 && (
              <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => {
                    setPinnedParticipantIds([])
                    setLayoutMode('grid')
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded transition text-sm font-medium ${layoutMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  title="عرض الشبكة"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">شبكة</span>
                </button>
                <button
                  onClick={() => {
                    if (pinnedParticipantIds.length > 0) {
                      setPinnedParticipantIds([pinnedParticipantIds[0]])
                      setLayoutMode('spotlight')
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded transition text-sm font-medium ${layoutMode === 'spotlight' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  title="شاشة واحدة كبيرة"
                >
                  <Square className="w-4 h-4" />
                  <span className="hidden sm:inline">واحدة</span>
                </button>
                {pinnedParticipantIds.length === 2 && (
                  <button
                    onClick={() => setLayoutMode('dual')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded transition text-sm font-medium ${layoutMode === 'dual' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    title="شاشتين كبيرتين"
                  >
                    <Grid3x3 className="w-4 h-4" />
                    <span className="hidden sm:inline">اثنتين</span>
                  </button>
                )}
              </div>
            )}

            {/* Chat Button */}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`relative flex items-center gap-2 rounded-lg transition font-medium ${showChat ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                } ${isMobile ? 'p-3' : 'px-4 py-2.5'}`}
            >
              <MessageCircle className="w-5 h-5" />
              {!isMobile && <span>الدردشة</span>}
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </button>

            {tracks.length > 9 && (
              <button
                onClick={() => setCompactMode(!compactMode)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition text-sm font-medium ${compactMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
              >
                {compactMode ? <Grid3x3 className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                <span className="hidden sm:inline">{compactMode ? 'عادي' : 'مضغوط'}</span>
              </button>
            )}
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 rounded-lg transition text-sm font-medium ${showSettings ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                } ${isMobile ? 'p-3' : 'px-3 py-2.5'}`}
              title="إعدادات الجودة"
            >
              <Settings className="w-4 h-4" />
              {!isMobile && <span className="hidden sm:inline">الإعدادات</span>}
            </button>

            {/* Network Stats Button */}
            <button
              onClick={() => setShowNetworkStats(!showNetworkStats)}
              className={`flex items-center gap-2 rounded-lg transition text-sm font-medium ${showNetworkStats ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                } ${isMobile ? 'p-3' : 'px-3 py-2.5'}`}
              title="إحصائيات الشبكة"
            >
              <Wifi className="w-4 h-4" />
              {!isMobile && <span className="hidden sm:inline">الشبكة</span>}
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`relative flex items-center gap-2 rounded-lg transition font-medium ${showParticipants ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                  } ${isMobile ? 'p-3' : 'px-4 py-2.5'}`}
              >
                <Users className="w-5 h-5" />
                {!isMobile && <span>المشاركون ({participants.length + 1})</span>}
                {raisedHands.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-gray-900 z-10">
                    {raisedHands.length}
                  </span>
                )}
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => {
                  setShowPolls(!showPolls)
                  setShowParticipants(false)
                  setShowChat(false)
                }}
                className={`flex items-center gap-2 rounded-lg transition text-sm font-medium ${showPolls ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                  } ${isMobile ? 'p-3' : 'px-4 py-2.5'}`}
                title="الأسئلة والتصويت"
              >
                <HelpCircle className="w-5 h-5" />
                {!isMobile && <span>تصويت</span>}
              </button>
            )}
          </div>
        </div>
      </div>
      <PollUserDialog />
    </div>
  )
}
