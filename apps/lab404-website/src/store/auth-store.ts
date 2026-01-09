import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { User, AuthResponse } from '@/types/auth';
import { AxiosError } from 'axios';

import { LoginFormData, RegisterFormData } from '@/lib/validations';

interface ForgotPasswordResponse {
    success: boolean;
    data: {
        message: string;
    };
}

interface VerifyCodeResponse {
    success: boolean;
    data: {
        valid: boolean;
    };
}

interface ResetPasswordResponse {
    success: boolean;
    data: {
        user: User;
        token: string;
        expiresAt: string;
    };
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (credentials: LoginFormData) => Promise<void>;
    register: (data: RegisterFormData) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    forgotPassword: (email: string) => Promise<string>;
    verifyResetCode: (email: string, code: string) => Promise<boolean>;
    resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
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

            forgotPassword: async (email: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<ForgotPasswordResponse>('/auth/forgot-password', {
                        email: email.toLowerCase().trim(),
                    });
                    set({ isLoading: false });
                    return response.data.data.message;
                } catch (error) {
                    const err = error as AxiosError<{ error: { message: string } }>;
                    const errorMsg = err.response?.data?.error?.message || 'Failed to send reset code';
                    set({ error: errorMsg, isLoading: false });
                    throw new Error(errorMsg);
                }
            },

            verifyResetCode: async (email: string, code: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<VerifyCodeResponse>('/auth/verify-reset-code', {
                        email: email.toLowerCase().trim(),
                        code,
                    });
                    set({ isLoading: false });
                    return response.data.data.valid;
                } catch (error) {
                    const err = error as AxiosError<{ error: { message: string } }>;
                    let errorMsg = 'Invalid or expired code';

                    if (err.response?.status === 429) {
                        errorMsg = 'Too many attempts. Please try again in 1 hour.';
                    } else if (err.response?.data?.error?.message) {
                        errorMsg = err.response.data.error.message;
                    }

                    set({ error: errorMsg, isLoading: false });
                    throw new Error(errorMsg);
                }
            },

            resetPassword: async (email: string, code: string, newPassword: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<ResetPasswordResponse>('/auth/reset-password', {
                        email: email.toLowerCase().trim(),
                        code,
                        newPassword,
                    });

                    // Auto-login: Update auth state
                    set({
                        user: response.data.data.user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } catch (error) {
                    const err = error as AxiosError<{ error: { message: string } }>;
                    let errorMsg = 'Failed to reset password';

                    if (err.response?.status === 400) {
                        errorMsg = 'Invalid or expired code';
                    } else if (err.response?.status === 422) {
                        errorMsg = err.response?.data?.error?.message || 'Password does not meet requirements';
                    } else if (err.response?.data?.error?.message) {
                        errorMsg = err.response.data.error.message;
                    }

                    set({ error: errorMsg, isLoading: false });
                    throw new Error(errorMsg);
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
