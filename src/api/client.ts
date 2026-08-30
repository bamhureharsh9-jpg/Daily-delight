// HTTP client for the real backend.
// All requests go through here so we have a single place to:
//  - prepend baseUrl
//  - attach the auth token
//  - handle timeouts and parse errors
//  - log requests in dev

import API_CONFIG from './config';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined | null>;
  timeout?: number;
}

const buildUrl = (path: string, query?: RequestOptions['query']) => {
  const base = API_CONFIG.baseUrl.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  let url = `${base}${cleanPath}`;
  if (query) {
    const params = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (params) url += (url.includes('?') ? '&' : '?') + params;
  }
  return url;
};

export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    query,
    timeout = API_CONFIG.timeout,
  } = options;

  const url = buildUrl(path, query);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  };
  if (authToken) {
    finalHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    method,
    headers: finalHeaders,
    signal: controller.signal,
  };
  if (API_CONFIG.withCredentials) {
    config.credentials = 'include';
  }
  if (body !== undefined) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    if (__DEV__) {
      console.log(`[API] ${method} ${url}`, body || '');
    }
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = (isJson && (data?.error || data?.message)) || `HTTP ${response.status}`;
      throw new ApiError(message, response.status, data);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out', 0, null);
    }
    throw new ApiError(err.message || 'Network error', 0, null);
  }
}

// Convenience helpers
export const api = {
  get: <T = any>(path: string, query?: RequestOptions['query']) =>
    apiRequest<T>(path, { method: 'GET', query }),
  post: <T = any>(path: string, body?: any) =>
    apiRequest<T>(path, { method: 'POST', body }),
  put: <T = any>(path: string, body?: any) =>
    apiRequest<T>(path, { method: 'PUT', body }),
  patch: <T = any>(path: string, body?: any) =>
    apiRequest<T>(path, { method: 'PATCH', body }),
  del: <T = any>(path: string) =>
    apiRequest<T>(path, { method: 'DELETE' }),
};
