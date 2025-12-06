import axios from 'axios';
import { useUserStore } from '@/store/useUserStore';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
});

// Interceptor: Antes de cada requisição, pega o token da Store e coloca no Header
api.interceptors.request.use((config) => {
  // Pega o token do Zustand (persistido no localStorage)
  // Nota: A estrutura do persist do Zustand é um pouco chata de acessar fora do hook
  const stateStr = localStorage.getItem('gato-comics-auth');
  if (stateStr) {
    const state = JSON.parse(stateStr);
    const token = state.state?.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;