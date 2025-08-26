import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'CITIZEN' | 'POLICE' | 'OC' | 'JUDGE' | 'LAWYER';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  // Role-specific fields
  nid?: string; // Citizens
  pid?: string; // Police
  jid?: string; // Judges
  bid?: string; // Lawyers
  rank?: string; // Police/Judges
  station?: string; // Police
  courtName?: string; // Judges
  firmName?: string; // Lawyers
  isOC?: boolean; // Police OC
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);