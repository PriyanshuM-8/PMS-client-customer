import { io } from 'socket.io-client'

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  transports: ['websocket'],
})

export const connectSocket = (userId) => {
  if (!userId) return

  if (!socket.connected) {
    socket.connect()
  }

  socket.on('connect', () => {
    console.log('Socket Connected:', socket.id)
    socket.emit('join', userId)
  })
}

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect()
}

export const getSocket = () => socket
export default socket