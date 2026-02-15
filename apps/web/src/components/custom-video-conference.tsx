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
import { Mic, MicOff, Video, VideoOff, Hand, Pin, PinOff, Users, UserX, LogOut } from 'lucide-react'
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
  const router = useRouter()

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )

  const isAdmin = userRole === UserRole.HOST || userRole === UserRole.COHOST

  // Debug logging
  useEffect(() => {
    console.log('🔍 Admin Controls Debug:', {
      userRole,
      isAdmin,
      UserRoleHOST: UserRole.HOST,
      UserRoleCOHOST: UserRole.COHOST,
      tracksCount: tracks.length,
      participantsCount: participants.length
    })
  }, [userRole, isAdmin, tracks.length, participants.length])

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

    // Update all participants initially
    updateParticipantState(localParticipant)
    participants.forEach(updateParticipantState)

    // Listen for track muted/unmuted events
    const handleTrackMuted = () => {
      // Update all participants when any track is muted
      updateParticipantState(localParticipant)
      participants.forEach(updateParticipantState)
    }

    const handleTrackUnmuted = () => {
      // Update all participants when any track is unmuted
      updateParticipantState(localParticipant)
      participants.forEach(updateParticipantState)
    }

    // Add listeners for all participants
    participants.forEach(participant => {
      participant.on('trackMuted', handleTrackMuted)
      participant.on('trackUnmuted', handleTrackUnmuted)
    })

    // Add listeners for local participant
    localParticipant.on('trackMuted', handleTrackMuted)
    localParticipant.on('trackUnmuted', handleTrackUnmuted)

    // Listen for new participants
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
    
    // Send hand raise state via data channel
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

  // Admin controls: mute participant
  const muteParticipant = async (participant: RemoteParticipant) => {
    if (!isAdmin) return
    
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify({
      type: 'admin-mute',
      targetId: participant.identity,
    }))
    await localParticipant.publishData(data, { reliable: true })
    
    // Update state immediately for instant feedback
    setTimeout(() => {
      const micTrack = participant.getTrackPublication(Track.Source.Microphone)
      const cameraTrack = participant.getTrackPublication(Track.Source.Camera)
      setParticipantStates(prev => ({
        ...prev,
        [participant.identity]: {
          micEnabled: false,
          cameraEnabled: cameraTrack ? !cameraTrack.isMuted : false,
        }
      }))
    }, 100)
  }

  // Admin controls: disable camera
  const disableCamera = async (participant: RemoteParticipant) => {
    if (!isAdmin) return
    
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify({
      type: 'admin-disable-camera',
      targetId: participant.identity,
    }))
    await localParticipant.publishData(data, { reliable: true })
    
    // Update state immediately for instant feedback
    setTimeout(() => {
      const micTrack = participant.getTrackPublication(Track.Source.Microphone)
      const cameraTrack = participant.getTrackPublication(Track.Source.Camera)
      setParticipantStates(prev => ({
        ...prev,
        [participant.identity]: {
          micEnabled: micTrack ? !micTrack.isMuted : false,
          cameraEnabled: false,
        }
      }))
    }, 100)
  }

  // Admin controls: kick participant
  const kickParticipant = async (participantId: string) => {
    if (!isAdmin) return
    
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify({
      type: 'admin-kick',
      targetId: participantId,
    }))
    await localParticipant.publishData(data, { reliable: true })
  }

  // Handle leave room
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

    const handleDataReceived = async (
      payload: Uint8Array,
      participant?: RemoteParticipant | LocalParticipant
    ) => {
      const decoder = new TextDecoder()
      const data = JSON.parse(decoder.decode(payload))

      if (data.targetId !== localParticipant.identity) return

      if (data.type === 'admin-mute') {
        await localParticipant.setMicrophoneEnabled(false)
      } else if (data.type === 'admin-disable-camera') {
        await localParticipant.setCameraEnabled(false)
      } else if (data.type === 'admin-kick') {
        // Participant is being kicked - disconnect and redirect
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

  // Find screen share track - it should be the main view
  const screenShareTrack = tracks.find(t => t.publication?.source === Track.Source.ScreenShare)
  
  // If there's a screen share, show it as main. Otherwise, show pinned track
  const mainTrack = screenShareTrack || tracks.find(t => t.participant.identity === pinnedParticipantId)
  
  // Other tracks are all tracks except the main one
  const otherTracks = mainTrack 
    ? tracks.filter(t => {
        const trackId = t.publication?.trackSid || t.participant.identity
        const mainId = mainTrack.publication?.trackSid || mainTrack.participant.identity
        return trackId !== mainId
      })
    : []

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
        className={`relative bg-gray-800 rounded-lg overflow-hidden ${
          isLarge ? 'w-full h-full' : 'aspect-video'
        }`}
      >
        <TrackRefContext.Provider value={trackRef}>
          <ParticipantTile />
        </TrackRefContext.Provider>
        
        {/* Screen share indicator */}
        {isScreenShare && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-20">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              <span className="font-semibold">مشاركة الشاشة - {participant.name || participant.identity}</span>
            </div>
          </div>
        )}

        {/* Device status indicators - top right (not for screen share) */}
        {!isScreenShare && (
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          {/* Hand raised indicator */}
          {hasRaisedHand && (
            <div className="bg-yellow-500 text-white p-2 rounded-full">
              <Hand className="w-5 h-5" />
            </div>
          )}
          
          {/* Mic status - clickable for admin on remote participants */}
          {isAdmin && !isLocal ? (
            <button
              onClick={() => {
                if (participant instanceof RemoteParticipant) {
                  muteParticipant(participant)
                }
              }}
              className={`p-2 rounded-full transition shadow-lg ${
                deviceState.micEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
              title={deviceState.micEnabled ? 'كتم المايك' : 'المايك مكتوم'}
            >
              {deviceState.micEnabled ? (
                <Mic className="w-4 h-4 text-white" />
              ) : (
                <MicOff className="w-4 h-4 text-white" />
              )}
            </button>
          ) : (
            <div className={`p-2 rounded-full ${
              deviceState.micEnabled ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {deviceState.micEnabled ? (
                <Mic className="w-4 h-4 text-white" />
              ) : (
                <MicOff className="w-4 h-4 text-white" />
              )}
            </div>
          )}
          
          {/* Camera status - clickable for admin on remote participants */}
          {isAdmin && !isLocal ? (
            <button
              onClick={() => {
                if (participant instanceof RemoteParticipant) {
                  disableCamera(participant)
                }
              }}
              className={`p-2 rounded-full transition shadow-lg ${
                deviceState.cameraEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
              title={deviceState.cameraEnabled ? 'إغلاق الكاميرا' : 'الكاميرا مغلقة'}
            >
              {deviceState.cameraEnabled ? (
                <Video className="w-4 h-4 text-white" />
              ) : (
                <VideoOff className="w-4 h-4 text-white" />
              )}
            </button>
          ) : (
            <div className={`p-2 rounded-full ${
              deviceState.cameraEnabled ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {deviceState.cameraEnabled ? (
                <Video className="w-4 h-4 text-white" />
              ) : (
                <VideoOff className="w-4 h-4 text-white" />
              )}
            </div>
          )}
        </div>
        )}

        {/* Pin button (not for screen share) */}
        {!isScreenShare && (
          <button
            onClick={() => togglePin(participant.identity)}
            className="absolute top-2 left-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition shadow-lg z-20"
            title={isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
          >
            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>
        )}

        {/* Participant name */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm z-10">
          {participant.name || participant.identity}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Video Layout */}
      <div className="flex-1 flex gap-2 p-4 overflow-hidden relative">
        {/* Participants Sidebar */}
        {isAdmin && showParticipants && (
          <div className="absolute top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-700 z-30 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  المشاركون ({participants.length + 1})
                </h3>
                <button
                  onClick={() => setShowParticipants(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-2">
                {/* Local participant */}
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-white text-sm">
                        {localParticipant.name || localParticipant.identity}
                      </span>
                      <span className="text-xs text-blue-400">(أنت)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {participantStates[localParticipant.identity]?.micEnabled ? (
                        <Mic className="w-4 h-4 text-green-500" />
                      ) : (
                        <MicOff className="w-4 h-4 text-red-500" />
                      )}
                      {participantStates[localParticipant.identity]?.cameraEnabled ? (
                        <Video className="w-4 h-4 text-green-500" />
                      ) : (
                        <VideoOff className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Remote participants */}
                {participants.map((participant) => {
                  const deviceState = participantStates[participant.identity] || { micEnabled: false, cameraEnabled: false }
                  
                  return (
                    <div key={participant.identity} className="bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-white text-sm">
                            {participant.name || participant.identity}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Device status indicators */}
                          <div className="flex items-center gap-1">
                            {deviceState.micEnabled ? (
                              <Mic className="w-4 h-4 text-green-500" />
                            ) : (
                              <MicOff className="w-4 h-4 text-red-500" />
                            )}
                            {deviceState.cameraEnabled ? (
                              <Video className="w-4 h-4 text-green-500" />
                            ) : (
                              <VideoOff className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          {/* Kick button */}
                          <button
                            onClick={() => {
                              if (confirm(`هل تريد طرد ${participant.name || participant.identity} من الغرفة؟`)) {
                                kickParticipant(participant.identity)
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded transition"
                            title="طرد من الغرفة"
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
          // Main view layout: large video (screen share or pinned) + sidebar
          <>
            {/* Main large video */}
            <div className="flex-1">
              {renderVideoTile(mainTrack, true)}
            </div>
            
            {/* Sidebar with other participants */}
            {otherTracks.length > 0 && (
              <div className="w-64 flex flex-col gap-2 overflow-y-auto">
                {otherTracks.map(trackRef => renderVideoTile(trackRef, false))}
              </div>
            )}
          </>
        ) : (
          // Grid layout when no pin
          <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 overflow-auto">
            {tracks.map(trackRef => renderVideoTile(trackRef, false))}
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-gray-900 p-4 border-t border-gray-700">
        <div className="flex items-center justify-between px-4">
          {/* Left side - Leave button */}
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition shadow-lg"
          >
            <LogOut className="w-5 h-5" />
            <span>خروج من الغرفة</span>
          </button>
          
          {/* Center - Main controls */}
          <div className="flex items-center gap-4">
            <ControlBar />
            
            {/* Hand Raise Button for non-admins */}
            {!isAdmin && (
              <button
                onClick={toggleHandRaise}
                className={`p-3 rounded-full transition ${
                  handRaised
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title={handRaised ? 'إنزال اليد' : 'رفع اليد'}
              >
                <Hand className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Right side - Participants button (admin only) */}
          {isAdmin && (
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                showParticipants
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>المشاركون ({participants.length + 1})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
