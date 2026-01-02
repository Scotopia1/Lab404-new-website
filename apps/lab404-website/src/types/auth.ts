export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'customer' | 'admin';
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface ApiError {
    message: string;
    code?: string;
}
