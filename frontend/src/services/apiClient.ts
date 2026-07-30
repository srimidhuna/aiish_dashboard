import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true, // required — auth uses an HttpOnly JWT cookie, not a bearer header
  headers: { 'Content-Type': 'application/json' },
});

interface BackendErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

function isBackendErrorBody(value: unknown): value is BackendErrorBody {
  return typeof value === 'object' && value !== null && 'message' in value;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }

    const body = error.response?.data;
    const message = isBackendErrorBody(body)
      ? Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message
      : error.message;

    return Promise.reject(new Error(message));
  },
);
