import api from './client';
import type { ChatMessage, ChatThread } from '@/types';

export const chatApi = {
  async threads(): Promise<ChatThread[]> {
    const { data } = await api.get<{ threads: ChatThread[] }>('/chat/threads');
    return data.threads;
  },

  async unread(): Promise<number> {
    const { data } = await api.get<{ total: number }>('/chat/unread');
    return data.total;
  },

  async history(profileA: number | string, profileB: number | string): Promise<ChatMessage[]> {
    const { data } = await api.get<{ messages: ChatMessage[] }>(`/chat/${profileA}/${profileB}`);
    return data.messages;
  },

  async send(
    profileA: number | string,
    profileB: number | string,
    message: string,
    senderProfileId: number | string,
    clientId?: string
  ): Promise<ChatMessage> {
    const { data } = await api.post<{ message: ChatMessage }>(`/chat/${profileA}/${profileB}`, {
      sender_profile_id: senderProfileId,
      message,
      ...(clientId ? { client_id: clientId } : {}),
    });
    return data.message;
  },
};
