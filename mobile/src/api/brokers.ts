import api from './client';

export interface BrokerListing {
  id: number;
  username: string;
  business_name?: string | null;
  client_count: number;
  my_request_status?: string | null;
}

export interface BrokerRequest {
  id: number;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string | null;
  created_at?: string;
  responded_at?: string | null;
  broker_id?: number;
  broker_username?: string;
  broker_business_name?: string;
  user_id?: number;
  user_username?: string;
  user_email?: string;
  user_phone_number?: string;
  profile_count?: number;
}

export interface BrokerClient {
  user_id: number;
  user_username: string;
  user_email: string;
  user_phone_number: string;
  connected_at?: string;
  profile_count: number;
}

export const brokerApi = {
  async list(): Promise<BrokerListing[]> {
    const { data } = await api.get<{ brokers: BrokerListing[] }>('/brokers');
    return data.brokers;
  },

  async myRequests(): Promise<BrokerRequest[]> {
    const { data } = await api.get<{ requests: BrokerRequest[] }>('/brokers/my-requests');
    return data.requests;
  },

  async sendRequest(brokerId: number, message?: string): Promise<void> {
    await api.post('/brokers/request', { broker_id: brokerId, message });
  },

  async receivedRequests(): Promise<BrokerRequest[]> {
    const { data } = await api.get<{ requests: BrokerRequest[] }>('/brokers/requests');
    return data.requests;
  },

  async myClients(): Promise<BrokerClient[]> {
    const { data } = await api.get<{ clients: BrokerClient[] }>('/brokers/my-clients');
    return data.clients;
  },

  async accept(id: number): Promise<void> {
    await api.post(`/brokers/requests/${id}/accept`);
  },

  async reject(id: number): Promise<void> {
    await api.post(`/brokers/requests/${id}/reject`);
  },
};