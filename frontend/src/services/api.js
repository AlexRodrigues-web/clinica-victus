// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost/clinica-victus/backend/index.php?rota=',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  // withCredentials: true,
});

// Utils de log
function maskToken(v) {
  if (!v || typeof v !== 'string') return v;
  const s = v.replace(/^Bearer\s+/i, '');
  if (s.length <= 10) return 'Bearer ****';
  return `Bearer ${s.slice(0, 6)}…${s.slice(-4)}`;
}

function safeJson(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}

// REQUEST
api.interceptors.request.use(
  (config) => {
    // timestamp p/ medir duração
    config.metadata = { start: Date.now() };

    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    const method  = (config.method || 'GET').toUpperCase();

    // log bonito e colapsado
    console.groupCollapsed(
      `%c[API ➜] ${method} ${fullUrl}`,
      'color:#1976d2;font-weight:bold'
    );
    if (config.params) console.log('params:', safeJson(config.params));
    if (config.data)   console.log('data  :', safeJson(config.data));
    if (config.headers?.Authorization) {
      console.log('auth  :', maskToken(config.headers.Authorization));
    }
    console.groupEnd();

    // injeta token JWT se houver
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.groupCollapsed('%c[API req error]', 'color:#d32f2f;font-weight:bold');
    console.error(error);
    console.groupEnd();
    return Promise.reject(error);
  }
);

// RESPONSE
api.interceptors.response.use(
  (response) => {
    const { config } = response || {};
    const method = (config?.method || 'GET').toUpperCase();
    const fullUrl = `${config?.baseURL || ''}${config?.url || ''}`;
    const dur = config?.metadata?.start ? `${Date.now() - config.metadata.start}ms` : '';

    console.groupCollapsed(
      `%c[API ✔] ${method} ${fullUrl} — ${response.status}${dur ? ` (${dur})` : ''}`,
      'color:#2e7d32;font-weight:bold'
    );
    console.log('data:', safeJson(response.data));
    console.groupEnd();

    return response;
  },
  (error) => {
    const cfg = error.config || {};
    const method = (cfg.method || 'GET').toUpperCase();
    const fullUrl = `${cfg.baseURL || ''}${cfg.url || ''}`;
    const dur = cfg?.metadata?.start ? `${Date.now() - cfg.metadata.start}ms` : '';
    const status = error.response?.status;

    console.groupCollapsed(
      `%c[API ✖] ${method} ${fullUrl} — ${status ?? 'NETWORK'}${dur ? ` (${dur})` : ''}`,
      'color:#d32f2f;font-weight:bold'
    );
    if (status) {
      console.log('status:', status);
      console.log('data  :', safeJson(error.response?.data));
    } else {
      console.log('message:', error.message);
    }
    console.groupEnd();

    if (status === 401) {
      localStorage.removeItem('token');
      // opcional: window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
