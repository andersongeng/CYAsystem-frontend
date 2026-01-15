import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// Base URL for the API
const API_URL = import.meta.env.PROD
    ? 'http://127.0.0.1:5000'
    : 'http://localhost:5000/api';

// Create an axios instance
export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // IMPORTANT: Allows sending/receiving cookies (refresh_token)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
    failedQueue.forEach(promise => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve();
        }
    });
    failedQueue = [];
};

// Request interceptor to add the access_token to headers
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Skip adding auth header for refresh endpoint to avoid sending expired token
        if (config.url?.includes('/refresh') || config.url?.includes('refresh')) {
            console.log('Skipping Authorization header for refresh request:', config.url);
            return config;
        }

        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401s (token expiration)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        console.log('Interceptor caught error:', error); // Log ALL errors

        // Don't retry if this is the refresh endpoint itself
        if (originalRequest.url?.includes('/refresh')) {
            console.log('Refresh endpoint failed, not retrying');
            return Promise.reject(error);
        }

        // Check if error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            console.log('401 error detected, attempting token refresh...');

            if (isRefreshing) {
                console.log('Refresh already in progress, queuing request');
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log('Calling refresh endpoint...');
                // Attempt to refresh token using the refresh_token cookie
                // Added trailing slash to avoid 308 redirect and CORS preflight error
                // Use api instance to ensure consistency, but interceptor will skip auth header
                const response = await api.post(
                    '/refresh/',
                    {},
                    {
                        withCredentials: true
                    }
                );

                const responseData = response.data as { access_token?: string; new_access_token?: string };
                // Backend returns 'new_access_token', but we also check 'access_token' for fallback
                const newAccessToken = responseData.new_access_token || responseData.access_token;

                if (!newAccessToken) {
                    throw new Error('No access token received from refresh endpoint');
                }

                console.log('Token refresh successful!');

                // Store new token
                localStorage.setItem('access_token', newAccessToken);

                // Update authorization header for original request
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }

                // Process queued requests
                processQueue();
                isRefreshing = false;

                // Retry original request
                return api(originalRequest);
            } catch (refreshError: any) {
                console.error('Token refresh failed:', refreshError);

                if (refreshError.response) {
                    console.error('Refresh error status:', refreshError.response.status);
                    console.error('Refresh error data:', refreshError.response.data);
                } else {
                    console.error('Refresh error message:', refreshError.message);
                }

                // If refresh fails, clear token and redirect to login
                processQueue(refreshError);
                isRefreshing = false;

                localStorage.removeItem('access_token');

                // Only redirect if not already on login page
                if (!window.location.hash.includes('/login') && !window.location.pathname.includes('/login')) {
                    console.log('Redirecting to login...');
                    // For HashRouter, redirect to the hash-based login route
                    window.location.hash = '/login';
                }

                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

