import { create } from 'zustand'
import type { Participant, ChatMessage, UserRole } from '@arabic-meet/shared'

interface RoomState {
  roomId: string | null
  userId: string | null
  userName: string | null
  userRole: UserRole | null
  participants: Participant[]
  chatMessages: ChatMessage[]
  isSidebarOpen: boolean
  sidebarTab: 'chat' | 'participants' | 'settings'
  isHandRaised: boolean
  connectionQuality: 'excellent' | 'good' | 'poor' | null
  
  setRoomInfo: (roomId: string, userId: string, userName: string, userRole: UserRole) => void
  setParticipants: (participants: Participant[]) => void
  addParticipant: (participant: Participant) => void
  removeParticipant: (userId: string) => void
  updateParticipant: (userId: string, updates: Partial<Participant>) => void
  addChatMessage: (message: ChatMessage) => void
  toggleSidebar: () => void
  setSidebarTab: (tab: 'chat' | 'participants' | 'settings') => void
  setHandRaised: (raised: boolean) => void
  setConnectionQuality: (quality: 'excellent' | 'good' | 'poor' | null) => void
  reset: () => void
}

export const useRoomStore = create<RoomState>((set) => ({
  roomId: null,
  userId: null,
  userName: null,
  userRole: null,
  participants: [],
  chatMessages: [],
  isSidebarOpen: false,
  sidebarTab: 'chat',
  isHandRaised: false,
  connectionQuality: null,

  setRoomInfo: (roomId, userId, userName, userRole) =>
    set({ roomId, userId, userName, userRole }),

  setParticipants: (participants) => set({ participants }),

  addParticipant: (participant) =>
    set((state) => ({
      participants: [...state.participants, participant],
    })),

  removeParticipant: (userId) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.userId !== userId),
    })),

  updateParticipant: (userId, updates) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.userId === userId ? { ...p, ...updates } : p
      ),
    })),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarTab: (tab) => set({ sidebarTab: tab, isSidebarOpen: true }),

  setHandRaised: (raised) => set({ isHandRaised: raised }),

  setConnectionQuality: (quality) => set({ connectionQuality: quality }),

  reset: () =>
    set({
      roomId: null,
      userId: null,
      userName: null,
      userRole: null,
      participants: [],
      chatMessages: [],
      isSidebarOpen: false,
      sidebarTab: 'chat',
      isHandRaised: false,
      connectionQuality: null,
    }),
}))
