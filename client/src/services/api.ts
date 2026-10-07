import axios from 'axios';

const envBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const api = axios.create({ baseURL: envBase ? `${envBase}/api` : '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vox_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('vox_token');
      localStorage.removeItem('vox_user');
    }
    return Promise.reject(err);
  }
);

export function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    if (d?.errors) return Object.values(d.errors).flat().join(' ');
    if (d?.message) return d.message;
    return err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}
