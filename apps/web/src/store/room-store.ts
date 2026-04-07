import { create } from 'zustand'
import type { Participant, ChatMessage, UserRole, Poll } from '@arabic-meet/shared'

interface PollResult {
  pollId: string;
  results: Record<string, number>;
}

interface RoomState {
  roomId: string | null
  userId: string | null
  userName: string | null
  userRole: UserRole | null
  participants: Participant[]
  chatMessages: ChatMessage[]
  isSidebarOpen: boolean
  sidebarTab: 'chat' | 'participants' | 'settings' | 'polls'
  isHandRaised: boolean
  connectionQuality: 'excellent' | 'good' | 'poor' | null
  activePoll: Poll | null
  pollResults: PollResult | null
  
  setRoomInfo: (roomId: string, userId: string, userName: string, userRole: UserRole) => void
  setParticipants: (participants: Participant[]) => void
  addParticipant: (participant: Participant) => void
  removeParticipant: (userId: string) => void
  updateParticipant: (userId: string, updates: Partial<Participant>) => void
  addChatMessage: (message: ChatMessage) => void
  toggleSidebar: () => void
  setSidebarTab: (tab: 'chat' | 'participants' | 'settings' | 'polls') => void
  setHandRaised: (raised: boolean) => void
  setConnectionQuality: (quality: 'excellent' | 'good' | 'poor' | null) => void
  setActivePoll: (poll: Poll | null) => void
  setPollResults: (results: PollResult | null) => void
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
  activePoll: null,
  pollResults: null,

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

  setActivePoll: (poll) => set({ activePoll: poll }),
  
  setPollResults: (results) => set({ pollResults: results }),

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
      activePoll: null,
      pollResults: null,
    }),
}))
