import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, getErrorMessage } from "@/lib/api-client";

export interface Admin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isAdmin: boolean;
}

interface AuthState {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<{
            success: boolean;
            data: { token: string; user: Admin };
          }>("/auth/admin/login", { email, password });

          const { user } = response.data.data;

          // Verify user is an admin (check role instead of isAdmin flag)
          const isAdmin = user.role === 'admin' || user.isAdmin;
          if (!isAdmin) {
            set({
              error: "Access denied. Admin privileges required.",
              isLoading: false,
            });
            throw new Error("Access denied. Admin privileges required.");
          }

          // Token is now in httpOnly cookie, no localStorage needed
          set({
            admin: user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message = getErrorMessage(error);
          set({
            error: message,
            isLoading: false,
            isAuthenticated: false,
            admin: null,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call logout API to clear cookie
          await api.post("/auth/logout");
        } catch {
          // Ignore logout errors
        } finally {
          // Clear local state
          set({
            admin: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      checkAuth: async () => {
        try {
          // Try to fetch user with cookie authentication
          const response = await api.get<{ success: boolean; data: Admin }>(
            "/auth/me"
          );
          const user = response.data.data;

          // Verify user is an admin (check role or isAdmin flag)
          const isAdmin = user.role === 'admin' || user.isAdmin;
          if (!isAdmin) {
            set({
              admin: null,
              isAuthenticated: false,
              isLoading: false,
              error: "Access denied. Admin privileges required.",
            });
            return;
          }

          set({
            admin: user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // Cookie expired or invalid
          set({
            admin: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "admin-auth-storage",
      partialize: (state) => ({
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
