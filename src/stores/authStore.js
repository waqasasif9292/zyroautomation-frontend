import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import router from '../router';
import axiosInstance from '../services/AuthService';

const TAB_HANDOFF_KEY = 'zyro_token_tab_handoff';
const TAB_HANDOFF_TTL_MS = 30000;

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

  const consumeTabHandoffToken = () => {
    const rawHandoff = localStorage.getItem(TAB_HANDOFF_KEY);
    if (!rawHandoff) return null;

    try {
      const handoff = JSON.parse(rawHandoff);
      const isFresh = Date.now() - Number(handoff.created_at || 0) <= TAB_HANDOFF_TTL_MS;
      localStorage.removeItem(TAB_HANDOFF_KEY);

      if (isFresh && handoff.token) {
        sessionStorage.setItem('zyro_token', handoff.token);
        return handoff.token;
      }
    } catch (error) {
      localStorage.removeItem(TAB_HANDOFF_KEY);
    }

    return null;
  };

  const tokenFromStorage = () => sessionStorage.getItem('zyro_token') || consumeTabHandoffToken() || localStorage.getItem('zyro_token');

  const hydrateTokenFromStorage = () => {
    const storedToken = tokenFromStorage();
    if (storedToken) {
      token.value = storedToken;
      return true;
    }

    return false;
  };

  const prepareTabHandoff = () => {
    const currentToken = token.value || tokenFromStorage();
    if (!currentToken) return;

    localStorage.setItem(TAB_HANDOFF_KEY, JSON.stringify({
      token: currentToken,
      created_at: Date.now(),
    }));
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

  const updateOrdersTableColumns = async (columns) => {
    const response = await axiosInstance.put('/user/preferences/orders-table-columns', { columns });
    setUser(response.data.data.user);
    return response.data;
  };

  const clearAuth = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('zyro_token');
    sessionStorage.removeItem('zyro_token');
  };

  const initializeAuth = async () => {
    if (hydrateTokenFromStorage()) {
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
    hydrateTokenFromStorage,
    prepareTabHandoff,
    register,
    login,
    fetchUser,
    logout,
    updateProfile,
    uploadAvatar,
    updateOrdersTableColumns,
    clearAuth,
    initializeAuth,
  };
});
