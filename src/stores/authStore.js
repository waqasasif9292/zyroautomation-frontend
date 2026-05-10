import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import router from '../router';
import axiosInstance from '../services/AuthService';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(null);

  const isAuthenticated = computed(() => token.value !== null);

  const setToken = (newToken, remember = false) => {
    token.value = newToken;
    if (remember) {
      localStorage.setItem('zyro_token', newToken);
      sessionStorage.removeItem('zyro_token');
    } else {
      sessionStorage.setItem('zyro_token', newToken);
      localStorage.removeItem('zyro_token');
    }
  };

  const setUser = (userData) => {
    user.value = userData;
  };

  const register = async (userData) => {
    try {
      const response = await axiosInstance.post('/register', userData);
      const { token: newToken, user: responseUser } = response.data.data;
      setToken(newToken, true);
      setUser(responseUser);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axiosInstance.post('/login', credentials);
      const { token: newToken, user: responseUser } = response.data.data;
      setToken(newToken, credentials.remember || false);
      setUser(responseUser);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const fetchUser = async () => {
    try {
      const response = await axiosInstance.get('/user');
      setUser(response.data.data.user);
      return response.data;
    } catch (error) {
      clearAuth();
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  const updateProfile = async (profileData) => {
    const response = await axiosInstance.put('/profile', profileData);
    setUser(response.data.data.user);
    return response.data;
  };

  const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await axiosInstance.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (user.value) {
      user.value = { ...user.value, avatar: response.data.data.avatar };
    }
    return response.data;
  };

  const clearAuth = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('zyro_token');
    sessionStorage.removeItem('zyro_token');
  };

  const initializeAuth = async () => {
    const storedToken = localStorage.getItem('zyro_token') || sessionStorage.getItem('zyro_token');
    if (storedToken) {
      token.value = storedToken;
      try {
        await fetchUser();
      } catch (error) {
        clearAuth();
      }
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    setToken,
    setUser,
    register,
    login,
    fetchUser,
    logout,
    updateProfile,
    uploadAvatar,
    clearAuth,
    initializeAuth,
  };
});
