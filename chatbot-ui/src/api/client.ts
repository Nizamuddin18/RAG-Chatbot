import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: any) => {
    // Add authentication token if available
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle global errors
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;

      if (status === 401) {
        // Unauthorized - clear token and redirect to login if needed
        localStorage.removeItem('auth_token');
        // Could dispatch a logout event or redirect here
      } else if (status === 403) {
        // Forbidden
        console.error('Access forbidden');
      } else if (status === 404) {
        // Not found
        console.error('Resource not found');
      } else if (status === 500) {
        // Server error
        console.error('Server error occurred');
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      console.error('An unexpected error occurred');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
