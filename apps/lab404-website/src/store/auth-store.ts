import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { User, AuthResponse } from '@/types/auth';
import { AxiosError } from 'axios';

import { LoginFormData, RegisterFormData } from '@/lib/validations';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (credentials: LoginFormData) => Promise<void>;
    register: (data: RegisterFormData) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (credentials: LoginFormData) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials);
                    const { user } = response.data.data;

                    // Token is now in httpOnly cookie, no localStorage needed
                    set({ user, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    const err = error as AxiosError<{ error: { message: string } }>;
                    set({
                        error: err.response?.data?.error?.message || 'Login failed',
                        isLoading: false
                    });
                    throw error;
                }
            },

            register: async (data: RegisterFormData) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/register', data);
                    const { user } = response.data.data;

                    // Token is now in httpOnly cookie, no localStorage needed
                    set({ user, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    const err = error as AxiosError<{ error: { message: string } }>;
                    set({
                        error: err.response?.data?.error?.message || 'Registration failed',
                        isLoading: false
                    });
                    throw error;
                }
            },

            logout: async () => {
                try {
                    // Call logout API to clear cookie
                    await api.post('/auth/logout');
                } catch {
                    // Ignore logout errors
                } finally {
                    // Clear local state
                    set({ user: null, isAuthenticated: false });
                }
            },

            checkAuth: async () => {
                try {
                    // Try to fetch user with cookie authentication
                    const response = await api.get<{ success: boolean; data: User }>('/auth/me');
                    set({ user: response.data.data, isAuthenticated: true });
                } catch {
                    // Cookie expired or invalid
                    set({ user: null, isAuthenticated: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
