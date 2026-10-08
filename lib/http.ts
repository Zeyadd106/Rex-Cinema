import type { ApiErrorBody } from '@/types/booking';

export function json<T>(body: T, status = 200): Response {
  return Response.json(body as Record<string, unknown>, { status });
}

export function errorJson(
  status: number,
  errors: Record<string, string[]> | undefined,
  message = 'Request failed',
): Response {
  const body: ApiErrorBody = { message, ...(errors ? { errors } : {}) };
  return Response.json(body, { status });
}

/** Parses a request body defensively — never throws. */
export async function readBody<T extends object>(request: Request): Promise<Partial<T>> {
  try {
    const raw = (await request.json()) as unknown;
    return raw && typeof raw === 'object' ? (raw as Partial<T>) : {};
  } catch {
    return {};
  }
}

export function query(request: Request, key: string): string | undefined {
  return new URL(request.url).searchParams.get(key) ?? undefined;
}
