import { api } from './api';

export interface RegisterData {
    name: string;
    email: string;
    phone: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    user?: any; // Adjust according to your backend response
    [key: string]: any;
}

export const authService = {
    registerUser: async (data: RegisterData) => {
        // Using the api instance which has base URL configured
        // Note: 'register/' with trailing slash to avoid 308 redirect
        const response = await api.post<AuthResponse>('/register/', data);
        return response.data;
    },

    loginUser: async (data: LoginData) => {
        const response = await api.post<AuthResponse>('/login/', data);

        // Store access_token if present in response
        if (response.data.access_token) {
            localStorage.setItem('access_token', response.data.access_token);
        }

        return response.data;
    },

    logout: () => {
        localStorage.removeItem('access_token');
        // Optional: Call backend logout to clear cookie
        // return api.post('/logout/');
    },

    getToken: () => {
        return localStorage.getItem('access_token');
    }
};
