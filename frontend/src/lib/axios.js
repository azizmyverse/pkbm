import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  timeout: 30000,
});

let getAuthToken = () => null;
let onUnauthorized = () => {};

export function configureApi({ getToken, onUnauthorizedHandler }) {
  if (typeof getToken === 'function') getAuthToken = getToken;
  if (typeof onUnauthorizedHandler === 'function') onUnauthorized = onUnauthorizedHandler;
}

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

function flushQueue(error, token = null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  pendingQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const url = originalRequest.url || '';

    // Jangan handle 401 dari endpoint auth itu sendiri
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh-token') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers = originalRequest.headers || {};
          if (token) originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const r = await api.post('/auth/refresh-token');
        const newToken = r.data?.data?.accessToken;
        if (!newToken) throw new Error('refresh failed');
        flushQueue(null, newToken);
        // store akan di-update via getToken setelah onUnauthorized? Tidak — kita pass via handler
        if (typeof onUnauthorized.setToken === 'function') {
          onUnauthorized.setToken(newToken);
        }
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        flushQueue(err, null);
        try {
          onUnauthorized();
        } catch (_e) {
          /* ignore */
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
