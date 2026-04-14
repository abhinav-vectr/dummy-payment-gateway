import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL
});

export const setAuthKeys = (public_key?: string, secret_key?: string) => {
  if (public_key) {
    api.defaults.headers.common['X-Public-Key'] = public_key;
    localStorage.setItem('novapay_pub', public_key);
  }
  if (secret_key) {
    api.defaults.headers.common['X-Secret-Key'] = secret_key;
    localStorage.setItem('novapay_sec', secret_key);
  }
};

// Initialize with stored keys or defaults
const storedPub = localStorage.getItem('novapay_pub') || 'pg_test_pub_demo123';
const storedSec = localStorage.getItem('novapay_sec') || 'pg_test_sec_demo123';
setAuthKeys(storedPub, storedSec);

export const merchantApi = {
  getMe: () => api.get('/v1/merchants/me'),
  getMetrics: () => api.get('/v1/merchants/me/metrics'),
  updateSettings: (settings: any) => api.patch('/v1/merchants/me/settings', settings),
  rotateKeys: () => api.post('/v1/merchants/me/keys/rotate'),
  listWebhooks: () => api.get('/v1/merchants/me/webhooks'),
  createWebhook: (data: { url: string, description?: string, events?: string[] }) => 
    api.post('/v1/merchants/me/webhooks', data),
  deleteWebhook: (id: string) => api.delete(`/v1/merchants/me/webhooks/${id}`),
};

export const paymentApi = {
  create: (data: { amount: number, currency: string, description?: string, callback_url?: string }) => 
    api.post('/v1/payments', data),
  list: () => api.get('/v1/payments'),
  get: (id: string, isPublic = false) => {
    // If isPublic is true, we should use the public key (configured above)
    return api.get(`/v1/payments/${id}`);
  },
  attempt: (id: string, data: { method: string, status: string }) => 
    api.post(`/v1/payments/${id}/attempt`, data),
  refund: (id: string, amount: number) => 
    api.post(`/v1/payments/${id}/refund`, { amount }),
};

export default api;
