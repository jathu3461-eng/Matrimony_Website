// Shared API types matching the Express backend responses.

export interface User {
  id: number;
  username: string;
  email: string;
  phone_number: string;
  role: 'regular' | 'broker' | 'admin';
  business_name?: string | null;
  broker_profile_limit?: number;
  is_approved: number;
  is_banned: number;
  ui_language: 'en' | 'ta';
  last_seen_at?: string | null;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface ApiError {
  error?: string;
  message?: string;
  errors?: Record<string, string>;
  status?: string;
}

export interface Profile {
  id: number;
  owner_user_id: number;
  profile_registered_for: string;
  name: string;
  gender: 'M' | 'F';
  date_of_birth: string;
  height_feet: number;
  height_inches: number;
  education: string;
  occupation: string;
  religion_id: number | null;
  caste_id: number | null;
  sub_religion?: string | null;
  raasi_id: number | null;
  star_id: number | null;
  born_country_id?: string | null;
  current_country_id?: string | null;
  city_or_state?: string | null;
  main_profile_picture?: string | null;
  horoscope_chart?: string | null;
  about_me: string;
  blur_photo: number;
  blur_horoscope: number;
  diet: string;
  family_values: string;
  career_goals: string;
  willing_to_relocate: string;
  income_range?: string | null;
  manglik_status: string;
  is_verified: number;
  status: 'active' | 'hidden';
  age?: number;
  photo_blurred?: number;
  horoscope_blurred?: number;
  is_shortlisted?: number;
  interest_status?: string | null;
  interest_direction?: string | null;
  interest_id?: number | null;
}

export interface ProfileMeta {
  religions: Array<{ id: number; name_en: string; name_ta: string }>;
  castes: Array<{ id: number; name_en: string; name_ta: string }>;
  raasis: Array<{ id: number; name_en: string; name_ta: string }>;
  stars: Array<{ id: number; name_en: string; name_ta: string }>;
  countries: Array<{ code: string; name_en: string; name_ta: string }>;
}

export interface Interest {
  id: number;
  sender_profile_id: number;
  receiver_profile_id: number;
  status: 'pending' | 'accepted' | 'rejected' | 'declined';
  message?: string | null;
  created_at?: string;
  sender_id?: number;
  sender_name?: string;
  sender_pic?: string;
  receiver_id?: number;
  receiver_name?: string;
  receiver_pic?: string;
  age?: number;
  occupation?: string;
  city_or_state?: string;
  gender?: string;
}

export interface Shortlist {
  profile_id: number;
  profile_name: string;
  profile_pic?: string | null;
  age?: number;
  height_feet?: number;
  height_inches?: number;
  occupation?: string;
  city_or_state?: string;
}

export interface ChatMessage {
  id: number;
  thread_id: string;
  sender_profile_id: number;
  receiver_profile_id: number;
  message: string;
  client_id?: string | null;
  read_at?: string | null;
  sent_at: string;
  sender_name?: string;
  sender_pic?: string;
}

export interface ChatThread {
  thread_id: string;
  sender_profile_id: number;
  receiver_profile_id: number;
  sender_name: string;
  receiver_name: string;
  sender_user_id: number;
  receiver_user_id: number;
  last_message?: string | null;
  last_at?: string | null;
  last_message_id?: number | null;
  last_sender_profile_id?: number | null;
  unread_count: number;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  sender_id: number;
  type: string;
  message: string;
  is_read: number;
  created_at: string;
}
