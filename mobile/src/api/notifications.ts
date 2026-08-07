import api from './client';
import type { NotificationItem } from '@/types';

export const notificationApi = {
  async list(): Promise<NotificationItem[]> {
    const { data } = await api.get<{ notifications: NotificationItem[] }>('/notifications');
    return data.notifications;
  },

  async unreadCount(): Promise<number> {
    const { data } = await api.get<{ total: number }>('/notifications/unread-count');
    return data.total;
  },

  async markRead(id: number): Promise<void> {
    await api.post(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.post('/notifications/read-all');
  },
};
