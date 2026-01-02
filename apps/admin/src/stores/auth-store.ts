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
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      token: null,
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

          const { token, user } = response.data.data;

          // Verify user is an admin (check role instead of isAdmin flag)
          const isAdmin = user.role === 'admin' || user.isAdmin;
          if (!isAdmin) {
            set({
              error: "Access denied. Admin privileges required.",
              isLoading: false,
            });
            throw new Error("Access denied. Admin privileges required.");
          }

          localStorage.setItem("admin_token", token);
          set({
            admin: user,
            token,
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
            token: null,
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem("admin_token");
        set({
          admin: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        // Call logout API
        api.post("/auth/logout").catch(() => {});
      },

      checkAuth: async () => {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          set({
            isAuthenticated: false,
            admin: null,
            token: null,
            isLoading: false,
          });
          return;
        }

        try {
          const response = await api.get<{ success: boolean; data: Admin }>(
            "/auth/me"
          );
          const user = response.data.data;

          // Verify user is an admin (check role or isAdmin flag)
          const isAdmin = user.role === 'admin' || user.isAdmin;
          if (!isAdmin) {
            localStorage.removeItem("admin_token");
            set({
              admin: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: "Access denied. Admin privileges required.",
            });
            return;
          }

          set({
            admin: user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          localStorage.removeItem("admin_token");
          set({
            admin: null,
            token: null,
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
        token: state.token,
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
