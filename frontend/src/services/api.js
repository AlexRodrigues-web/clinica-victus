// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost/clinica-victus/backend/index.php?rota=',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar o token em todas as requisições
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token'); // ou onde você armazena o JWT
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
