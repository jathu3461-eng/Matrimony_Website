import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
});

// Builds a full URL for files stored on the backend (uploads folder).
// e.g. VITE_API_URL=https://api.mukurtham.ca/api -> https://api.mukurtham.ca/uploads/photo.jpg
export const uploadsUrl = (name) => {
  if (!name) return '';
  if (/^https?:\/\//.test(name)) return name;
  const origin = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase.replace(/\/$/, '');
  return `${origin}/uploads/${name}`;
};

// Socket.IO server lives on the same origin as the REST API.
// e.g. VITE_API_URL=https://api.mukurtham.ca/api -> https://api.mukurtham.ca
export const socketUrl = () => {
  if (apiBase.startsWith('http')) {
    return apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase.replace(/\/$/, '');
  }
  return window.location.origin;
};

export default api;
