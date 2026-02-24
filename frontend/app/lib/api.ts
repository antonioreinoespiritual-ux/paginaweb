export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const qs = (params?: Record<string, string | number | undefined | null>) => {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, String(v));
  });
  const out = search.toString();
  return out ? `?${out}` : '';
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = res.status === 422 ? 'Validación inválida' : res.status === 401 ? 'No autorizado' : 'Error del servidor';
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

export const api = {
  qs,
  get: <T>(path: string, params?: Record<string, string | number | undefined | null>) => request<T>(`${path}${qs(params)}`),
  post: <T>(path: string, payload: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(payload) }),
  put: <T>(path: string, payload: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(payload) }),
  patch: <T>(path: string, payload: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(payload) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
