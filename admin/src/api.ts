const API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4000/api';

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('agricom-admin-token');
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}
