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

  async presence(): Promise<Record<string, { online: boolean; lastSeen: string | null }>> {
    const { data } = await api.get<{ ok: boolean; presence: Record<string, { online: boolean; lastSeen: string | null }> }>('/chat/presence');
    return data.presence ?? {};
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

  async sendImage(
    profileA: number | string,
    profileB: number | string,
    imageUri: string,
    senderProfileId: number | string,
  ): Promise<ChatMessage> {
    const ext = imageUri.split('.').pop() || 'jpg';
    const formData = new FormData();
    formData.append('sender_profile_id', String(senderProfileId));
    formData.append('message', '');
    formData.append('image', {
      uri: imageUri,
      name: `chat.${ext}`,
      type: `image/${ext}`,
    } as unknown as Blob);
    const { data } = await api.post<{ message: ChatMessage }>(
      `/chat/${profileA}/${profileB}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.message;
  },

  async deleteMessage(messageId: number): Promise<void> {
    await api.delete(`/chat/messages/${messageId}`);
  },
};
