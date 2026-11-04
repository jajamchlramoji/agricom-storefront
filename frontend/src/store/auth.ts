import { create } from 'zustand';
import { apiRequest } from '../services/api';

export type AccountUser = { id: string; email: string; name: string; role: string; permissions: string[] };
type AuthState = { user: AccountUser | null; ready: boolean; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void>; restore: () => Promise<void> };
const storageKey = 'agricom-customer-token';

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,
  login: async (email, password) => {
    const data = await apiRequest<{ token: string; user: AccountUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (data.user.role !== 'customer') throw new Error('That is an admin account. Use the admin sign-in page.');
    sessionStorage.setItem(storageKey, data.token); set({ user: data.user });
  },
  logout: async () => {
    const token = sessionStorage.getItem(storageKey);
    if (token) await apiRequest('/auth/logout', { method: 'POST', headers: { authorization: `Bearer ${token}` } }).catch(() => undefined);
    sessionStorage.removeItem(storageKey); set({ user: null });
  },
  restore: async () => {
    const token = sessionStorage.getItem(storageKey);
    if (!token) { set({ ready: true }); return; }
    try {
      const data = await apiRequest<{ user: AccountUser }>('/auth/me', { headers: { authorization: `Bearer ${token}` } });
      if (data.user.role === 'customer') set({ user: data.user }); else sessionStorage.removeItem(storageKey);
    } catch { sessionStorage.removeItem(storageKey); }
    set({ ready: true });
  },
}));
