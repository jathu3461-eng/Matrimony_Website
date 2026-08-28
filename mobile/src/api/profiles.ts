import api from './client';
import type { Profile, ProfileMeta } from '@/types';

export interface SearchParams {
  q?: string;
  gender?: 'M' | 'F';
  min_age?: number;
  max_age?: number;
  religion_id?: number;
  caste_id?: number;
  raasi_id?: number;
  star_id?: number;
  born_country_id?: string;
  current_country_id?: string;
  city_or_state?: string;
  income_range?: string;
  manglik_status?: string;
  page?: number;
  limit?: number;
}

export const profileApi = {
  async search(params: SearchParams = {}): Promise<Profile[]> {
    const { data } = await api.get<{ results: Profile[] }>('/profiles/search', { params });
    return data.results;
  },

  async getMeta(): Promise<ProfileMeta> {
    const { data } = await api.get<ProfileMeta>('/profiles/meta');
    return data;
  },

  async getById(id: number | string): Promise<Profile> {
    const { data } = await api.get<{ profile: Profile }>(`/profiles/${id}`);
    return data.profile;
  },

  async mine(): Promise<Profile[]> {
    const { data } = await api.get<{ profiles: Profile[] }>('/profiles/mine');
    return data.profiles;
  },

  async create(formData: FormData): Promise<Profile> {
    const { data } = await api.post<{ profile: Profile }>('/profiles', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.profile;
  },

  async update(id: number | string, formData: FormData): Promise<Profile> {
    const { data } = await api.put<{ profile: Profile }>(`/profiles/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.profile;
  },

  async remove(id: number | string): Promise<void> {
    await api.delete(`/profiles/${id}`);
  },

  async match(profileId1: number, profileId2: number) {
    const { data } = await api.post('/profiles/match', {
      profile_id_1: profileId1,
      profile_id_2: profileId2,
    });
    return data;
  },

  async lifestyleMatch(profileId1: number, profileId2: number) {
    const { data } = await api.post('/profiles/lifestyle-match', {
      profile_id_1: profileId1,
      profile_id_2: profileId2,
    });
    return data;
  },
};
