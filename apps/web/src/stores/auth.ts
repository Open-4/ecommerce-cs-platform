import { create } from "zustand";
import { authApi } from "@/lib/api";

interface AuthState {
  token: string | null;
  user: Record<string, unknown> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    localStorage.setItem("ecs_token", result.token);
    set({ token: result.token, user: result.merchant as Record<string, unknown>, isAuthenticated: true });
  },

  register: async (data) => {
    const result = await authApi.register(data);
    localStorage.setItem("ecs_token", result.token);
    set({ token: result.token, user: result.merchant as Record<string, unknown>, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("ecs_token");
    set({ token: null, user: null, isAuthenticated: false });
  },

  initialize: () => {
    const token = localStorage.getItem("ecs_token");
    set({
      token,
      isAuthenticated: !!token,
      isLoading: false,
    });
  },
}));
