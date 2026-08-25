import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/api/client';
import { tokenStorage } from '@/services/tokenStorage';

let socket: Socket | null = null;

function getSocketUrl(): string {
  return API_BASE_URL.endsWith('/api')
    ? API_BASE_URL.slice(0, -4)
    : API_BASE_URL.replace(/\/$/, '');
}

export async function connectSocket(): Promise<Socket | null> {
  if (socket?.connected) return socket;
  if (socket) { socket.disconnect(); socket = null; }

  const token = await tokenStorage.getAccessToken();
  if (!token) return null;

  socket = io(getSocketUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 8000,
    timeout: 10000,
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
