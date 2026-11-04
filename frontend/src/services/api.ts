const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4000/api';

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('agricom-customer-token');
  const headers = new Headers(options.headers);
  headers.set('content-type', 'application/json');
  if (token && !headers.has('authorization')) headers.set('authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`);
  return payload as T;
}
