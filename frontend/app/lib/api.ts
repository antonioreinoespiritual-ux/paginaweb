export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('request failed');
  return res.json();
}

export async function postJSON<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('request failed');
  return res.json();
}
