import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/api/client';
import { tokenStorage } from '@/services/tokenStorage';
import type { ChatMessage } from '@/types';

let socket: Socket | null = null;

interface SendResult {
  ok: boolean;
  message?: ChatMessage;
  error?: string;
  clientId: string;
  duplicate?: boolean;
}

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

  // Re-supply the current token on every connect/connect_error so a rotated or
  // refreshed access token is always used — prevents the socket from silently
  // dying after the 15-minute mobile access token expires.
  socket.on('connect', () => {
    tokenStorage.getAccessToken().then((t) => {
      if (socket && t) socket.auth = { token: t };
    });
  });
  socket.on('connect_error', () => {
    tokenStorage.getAccessToken().then((t) => {
      if (socket && t) socket.auth = { token: t };
    });
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

/**
 * Send a chat message exactly like the website: prefer the real-time socket
 * `chat:send` (fast, with server ack + idempotent client_id), and fall back to
 * the REST endpoint when the socket isn't available. Returns the resolved
 * message plus the clientId used for optimistic UI and deduplication.
 */
export function sendChatMessage({
  profileA,
  profileB,
  senderProfileId,
  text,
  clientId,
}: {
  profileA: number | string;
  profileB: number | string;
  senderProfileId: number | string;
  text: string;
  clientId?: string;
}): Promise<SendResult> {
  const cid = clientId || generateClientId();

  return new Promise<SendResult>((resolve) => {
    const s = getSocket();
    if (s && s.connected) {
      s.emit(
        'chat:send',
        {
          clientId: cid,
          profileA: Number(profileA),
          profileB: Number(profileB),
          senderProfileId: Number(senderProfileId),
          text,
        },
        (resp: any) => {
          if (resp?.ok && resp?.message) {
            resolve({ ok: true, message: resp.message, clientId: cid, duplicate: !!resp.duplicate });
          } else {
            resolve({ ok: false, error: resp?.error || 'Failed to send message', clientId: cid });
          }
        },
      );
      return;
    }

    // REST fallback (also broadcasts live to the receiver via the server).
    import('@/api/chat').then(({ chatApi }) =>
      chatApi
        .send(profileA, profileB, text, senderProfileId, cid)
        .then((msg) => resolve({ ok: true, message: msg, clientId: cid, duplicate: false }))
        .catch((err: any) =>
          resolve({
            ok: false,
            error: err?.response?.data?.error || err?.message || 'Offline — message not sent',
            clientId: cid,
          }),
        ),
    );
  });
}

function generateClientId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
