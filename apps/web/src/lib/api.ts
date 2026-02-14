import axios from 'axios'
import type { CreateRoomDto, JoinRoomDto, RoomJoinResponse, Room } from '@arabic-meet/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const roomApi = {
  createRoom: async (data: CreateRoomDto) => {
    const response = await api.post('/rooms', data)
    return response.data
  },

  getRooms: async (userId?: string | null): Promise<Room[]> => {
    const params = userId ? { userId } : {}
    const response = await api.get('/rooms', { params })
    return response.data
  },

  getRoom: async (roomId: string): Promise<Room> => {
    const response = await api.get(`/rooms/${roomId}`)
    return response.data
  },

  joinRoom: async (roomId: string, data: Omit<JoinRoomDto, 'roomId'>): Promise<RoomJoinResponse> => {
    const response = await api.post(`/rooms/${roomId}/join`, data)
    return response.data
  },

  getParticipants: async (roomId: string) => {
    const response = await api.get(`/rooms/${roomId}/participants`)
    return response.data
  },
}

export default api
