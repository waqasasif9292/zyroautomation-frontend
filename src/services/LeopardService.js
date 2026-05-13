import axiosInstance from './AuthService';

export default {
  fetchCities() {
    return axiosInstance.get('/integrations/leopard/cities');
  },
  fetchPickupAddresses() {
    return axiosInstance.get('/settings/leopard-pickup-addresses');
  },
  createPickupAddress(payload) {
    return axiosInstance.post('/settings/leopard-pickup-addresses', payload);
  },
  updatePickupAddress(id, payload) {
    return axiosInstance.put(`/settings/leopard-pickup-addresses/${id}`, payload);
  },
  deletePickupAddress(id) {
    return axiosInstance.delete(`/settings/leopard-pickup-addresses/${id}`);
  },
};
