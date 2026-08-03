/**
 * WalkWithMe — Central API Client
 *
 * Single axios instance with:
 * - Base URL from env
 * - Automatic timeout
 * - Exponential backoff retry
 * - Typed error normalization
 * - Request/response logging (dev only)
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
  isAxiosError,
} from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS, API_MAX_RETRIES, API_RETRY_BASE_DELAY_MS } from '@/constants';
import type { ApiResponse, ApiError, ApiErrorCode } from '@/types';

// ── Create instance ────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request interceptor ────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config) => {
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ──────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API] ✓ ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    if (__DEV__) {
      console.warn(`[API] ✗ ${error.response?.status} ${error.config?.url}`, error.message);
    }
    return Promise.reject(error);
  },
);

// ── Error normalization ────────────────────────────────────────────────────

function normalizeError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const serverMessage = (error.response?.data as { error?: string })?.error;

    let code: ApiErrorCode = 'UNKNOWN';
    if (!error.response) code = 'NETWORK_ERROR';
    else if (error.code === 'ECONNABORTED') code = 'TIMEOUT';
    else if (status === 401) code = 'UNAUTHORIZED';
    else if (status === 404) code = 'NOT_FOUND';
    else if (status === 422) code = 'VALIDATION_ERROR';
    else if (status === 429) code = 'RATE_LIMITED';
    else if (status >= 500) code = 'SERVER_ERROR';

    return {
      success: false,
      error: serverMessage ?? error.message,
      code,
      statusCode: status,
    };
  }

  return {
    success: false,
    error: error instanceof Error ? error.message : 'An unknown error occurred',
    code: 'UNKNOWN',
    statusCode: 0,
  };
}

// ── Retry with exponential backoff ────────────────────────────────────────

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = API_MAX_RETRIES,
  baseDelay = API_RETRY_BASE_DELAY_MS,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Do not retry on client errors (4xx) or network errors (server offline)
      if (isAxiosError(error)) {
        if (!error.response) throw error; // Server offline / network error -> fail fast for fallback
        const status = error.response.status;
        if (status >= 400 && status < 500) throw error;
      }

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        if (__DEV__) {
          console.log(`[API] Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        }
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// ── Public API methods ────────────────────────────────────────────────────

export async function get<T>(
  path: string,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  try {
    const response = await withRetry(() => apiClient.get<T>(path, config));
    return { success: true, data: response.data };
  } catch (error) {
    return normalizeError(error);
  }
}

export async function post<T>(
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  try {
    const response = await withRetry(() => apiClient.post<T>(path, body, config));
    return { success: true, data: response.data };
  } catch (error) {
    return normalizeError(error);
  }
}

export async function patch<T>(
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  try {
    const response = await withRetry(() => apiClient.patch<T>(path, body, config));
    return { success: true, data: response.data };
  } catch (error) {
    return normalizeError(error);
  }
}

export async function del<T>(
  path: string,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  try {
    const response = await withRetry(() => apiClient.delete<T>(path, config));
    return { success: true, data: response.data };
  } catch (error) {
    return normalizeError(error);
  }
}

export { apiClient };
