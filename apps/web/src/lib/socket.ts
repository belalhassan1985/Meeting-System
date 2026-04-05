import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

let socket: Socket | null = null

export const getSocket = () => {
  if (!socket) {
    socket = io(`${SOCKET_URL}/rooms`, {
      transports: ['websocket'],
      autoConnect: false,
    })
  }
  return socket
}

export const connectSocket = () => {
  const socket = getSocket()
  if (!socket.connected) {
    socket.connect()
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect()
  }
}
