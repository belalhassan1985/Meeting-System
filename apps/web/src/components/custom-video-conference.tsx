'use client'

import { useEffect, useState } from 'react'
import {
  useParticipants,
  useLocalParticipant,
  useTracks,
  TrackRefContext,
  ParticipantTile,
  ControlBar,
  useRoomContext,
} from '@livekit/components-react'
import { Track, RemoteParticipant, LocalParticipant } from 'livekit-client'
import { Mic, MicOff, Video, VideoOff, Hand, Pin, PinOff, Users, UserX, LogOut, Grid3x3, LayoutGrid } from 'lucide-react'
import { UserRole } from '@arabic-meet/shared'
import { useRouter } from 'next/navigation'

interface CustomVideoConferenceProps {
  userRole: UserRole
}

export function CustomVideoConference({ userRole }: CustomVideoConferenceProps) {
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const room = useRoomContext()
  const [handRaised, setHandRaised] = useState(false)
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set())
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null)
  const [showParticipants, setShowParticipants] = useState(false)
  const [participantStates, setParticipantStates] = useState<Record<string, { micEnabled: boolean; cameraEnabled: boolean }>>({})
  const [compactMode, setCompactMode] = useState(false)
  const router = useRouter()

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )

  const isAdmin = userRole === UserRole.HOST || userRole === UserRole.COHOST

  // Auto-enable compact mode for many participants
  useEffect(() => {
    if (tracks.length > 12 && !compactMode) {
      setCompactMode(true)
    }
  }, [tracks.length])

  // Track participant device states
  useEffect(() => {
    if (!room) return

    const updateParticipantState = (participant: RemoteParticipant | LocalParticipant) => {
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
          const newSet = new Set(prev)
          if (data.raised) {
            newSet.add(data.participantId)
          } else {
            newSet.delete(data.participantId)
          }
          return newSet
        })
      }
    }

    room.on('dataReceived', handleDataReceived)
    return () => {
      room.off('dataReceived', handleDataReceived)
    }
  }, [room])

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
    if (!room || isAdmin) return

    const handleDataReceived = async (payload: Uint8Array) => {
      const decoder = new TextDecoder()
      const data = JSON.parse(decoder.decode(payload))
      if (data.targetId !== localParticipant.identity) return

      if (data.type === 'admin-mute') {
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
      }
    }

    room.on('dataReceived', handleDataReceived)
    return () => {
      room.off('dataReceived', handleDataReceived)
    }
  }, [room, localParticipant, isAdmin])

  const togglePin = (participantId: string) => {
    setPinnedParticipantId(prev => prev === participantId ? null : participantId)
  }

  const screenShareTrack = tracks.find(t => t.publication?.source === Track.Source.ScreenShare)
  const pinnedTrack = tracks.find(t => t.participant.identity === pinnedParticipantId)
  const mainTrack = pinnedTrack || screenShareTrack
  
  const otherTracks = mainTrack 
    ? tracks.filter(t => {
        const trackId = t.publication?.trackSid || t.participant.identity
        const mainId = mainTrack.publication?.trackSid || mainTrack.participant.identity
        return trackId !== mainId
      })
    : []

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

  const renderVideoTile = (trackRef: any, isLarge = false) => {
    const participant = trackRef.participant
    const isLocal = participant instanceof LocalParticipant
    const hasRaisedHand = raisedHands.has(participant.identity)
    const isPinned = participant.identity === pinnedParticipantId
    const isScreenShare = trackRef.publication?.source === Track.Source.ScreenShare
    const deviceState = participantStates[participant.identity] || { micEnabled: false, cameraEnabled: false }

    return (
      <div 
        key={trackRef.publication?.trackSid || participant.identity} 
        className={`relative bg-gray-800 rounded-md overflow-hidden group ${
          isLarge 
            ? 'w-full h-full' 
            : 'w-full h-full flex items-center justify-center'
        }`}
        style={!isLarge ? { aspectRatio: '16/9' } : {}}
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

        {/* Status indicators - Normal mode */}
        {!isScreenShare && !compactMode && (
          <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {hasRaisedHand && (
              <div className="bg-yellow-500 p-1.5 rounded-full">
                <Hand className="w-4 h-4 text-white" />
              </div>
            )}
            
            {isAdmin && !isLocal ? (
              <>
                <button
                  onClick={() => participant instanceof RemoteParticipant && muteParticipant(participant)}
                  className={`p-1.5 rounded-full transition ${
                    deviceState.micEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600'
                  }`}
                >
                  {deviceState.micEnabled ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white" />}
                </button>
                <button
                  onClick={() => participant instanceof RemoteParticipant && disableCamera(participant)}
                  className={`p-1.5 rounded-full transition ${
                    deviceState.cameraEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600'
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
            {hasRaisedHand && <div className="bg-yellow-500 p-0.5 rounded"><Hand className="w-3 h-3 text-white" /></div>}
            {!deviceState.micEnabled && <div className="bg-red-600 p-0.5 rounded"><MicOff className="w-3 h-3 text-white" /></div>}
            {!deviceState.cameraEnabled && <div className="bg-red-600 p-0.5 rounded"><VideoOff className="w-3 h-3 text-white" /></div>}
          </div>
        )}

        {/* Pin button */}
        {!isScreenShare && !compactMode && (
          <button
            onClick={() => togglePin(participant.identity)}
            className="absolute top-2 left-2 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>
        )}

        {/* Participant name */}
        <div className={`absolute bottom-1 left-1 right-1 bg-gradient-to-t from-black/80 to-transparent text-white rounded-b z-10 ${
          compactMode ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'
        }`}>
          <div className="truncate font-medium">{participant.name || participant.identity}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-950">
      {/* Video Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Participants Sidebar */}
        {isAdmin && showParticipants && (
          <div className="absolute top-0 right-0 h-full w-80 bg-gray-900/95 backdrop-blur border-l border-gray-700 z-30 overflow-y-auto shadow-2xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  المشاركون ({participants.length + 1})
                </h3>
                <button onClick={() => setShowParticipants(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>
              
              <div className="space-y-2">
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-white text-sm">{localParticipant.name || localParticipant.identity}</span>
                      <span className="text-xs text-blue-400">(أنت)</span>
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
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex gap-1">
                            {deviceState.micEnabled ? <Mic className="w-4 h-4 text-green-500" /> : <MicOff className="w-4 h-4 text-red-500" />}
                            {deviceState.cameraEnabled ? <Video className="w-4 h-4 text-green-500" /> : <VideoOff className="w-4 h-4 text-red-500" />}
                          </div>
                          <button
                            onClick={() => confirm(`هل تريد طرد ${participant.name || participant.identity}؟`) && kickParticipant(participant.identity)}
                            className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded transition"
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

        {mainTrack ? (
          <div className="flex-1 flex gap-3 p-3">
            <div className="flex-1">{renderVideoTile(mainTrack, true)}</div>
            {otherTracks.length > 0 && (
              <div className="w-64 flex flex-col gap-2 overflow-y-auto pr-1">
                {otherTracks.map(trackRef => renderVideoTile(trackRef, false))}
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
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>خروج</span>
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
            {tracks.length > 9 && (
              <button
                onClick={() => setCompactMode(!compactMode)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition text-sm font-medium ${
                  compactMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {compactMode ? <Grid3x3 className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                <span className="hidden sm:inline">{compactMode ? 'عادي' : 'مضغوط'}</span>
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition font-medium ${
                  showParticipants ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>المشاركون ({participants.length + 1})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
