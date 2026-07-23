import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import router from '../router';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.token || sessionStorage.getItem('zyro_token') || localStorage.getItem('zyro_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
      const authStore = useAuthStore();
      authStore.clearAuth();
      router.push('/login');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
