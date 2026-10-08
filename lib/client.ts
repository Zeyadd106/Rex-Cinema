import type { ApiErrorBody } from '@/types/booking';

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(status: number, body: ApiErrorBody | null, fallback: string) {
    super(body?.message ?? fallback);
    this.status = status;
    this.errors = body?.errors ?? {};
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const body = (await res.json().catch(() => null)) as (ApiErrorBody & T) | null;
  if (!res.ok) throw new ApiError(res.status, body, `Request failed (${res.status})`);
  return body as T;
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, data: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  put: <T,>(path: string, data: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  del: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/** Turns an ApiError into a translated message key when possible. */
export function apiErrorInfo(error: unknown): { key: string; fieldErrors: Record<string, string[]> } {
  if (error instanceof ApiError) {
    return { key: error.message, fieldErrors: error.errors };
  }
  return { key: error instanceof Error ? error.message : 'unknown', fieldErrors: {} };
}
