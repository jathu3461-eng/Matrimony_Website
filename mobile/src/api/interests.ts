import api from './client';
import type { Interest, Shortlist } from '@/types';

export interface MyInteractions {
  received: Interest[];
  sent: Interest[];
  shortlists: Shortlist[];
}

export const interestApi = {
  async send(receiverProfileId: number, message?: string): Promise<void> {
    await api.post('/interests/send', {
      receiver_profile_id: receiverProfileId,
      ...(message ? { message } : {}),
    });
  },

  async respond(interestId: number, status: 'accepted' | 'rejected'): Promise<void> {
    await api.post(`/interests/${interestId}/respond`, { status });
  },

  async toggleShortlist(profileId: number): Promise<boolean> {
    const { data } = await api.post<{ shortlisted: boolean }>('/interests/shortlist', {
      profile_id: profileId,
    });
    return data.shortlisted;
  },

  async myInteractions(): Promise<MyInteractions> {
    const { data } = await api.get<MyInteractions>('/interests/my-interactions');
    return data;
  },
};
