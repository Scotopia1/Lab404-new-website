import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { User, AuthResponse } from '@/types/auth';
import { AxiosError } from 'axios';

import { LoginFormData, RegisterFormData } from '@/lib/validations';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (credentials: LoginFormData) => Promise<void>;
    register: (data: RegisterFormData) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (credentials: LoginFormData) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials);
                    const { token, user } = response.data.data;

                    localStorage.setItem('auth_token', token);
                    set({ user, token, isAuthenticated: true, isLoading: false });
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
                    const { token, user } = response.data.data;

                    localStorage.setItem('auth_token', token);
                    set({ user, token, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    const err = error as AxiosError<{ error: { message: string } }>;
                    set({
                        error: err.response?.data?.error?.message || 'Registration failed',
                        isLoading: false
                    });
                    throw error;
                }
            },

            logout: () => {
                localStorage.removeItem('auth_token');
                set({ user: null, token: null, isAuthenticated: false });
                // Optional: Call logout API if needed
                // api.post('/auth/logout').catch(console.error);
            },

            checkAuth: async () => {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    set({ isAuthenticated: false, user: null, token: null });
                    return;
                }

                try {
                    const response = await api.get<{ success: boolean; data: User }>('/auth/me');
                    set({ user: response.data.data, token, isAuthenticated: true });
                } catch {
                    localStorage.removeItem('auth_token');
                    set({ user: null, token: null, isAuthenticated: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
