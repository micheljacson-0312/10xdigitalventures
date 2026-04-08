import { io } from 'socket.io-client'
import * as SecureStore from 'expo-secure-store'

let socket = null

export const getSocket = async () => {
  if (!socket) {
    const token = await SecureStore.getItemAsync('token')
    socket = io(process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    })
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null }
}
