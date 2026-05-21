import axiosInstance from './AuthService';

const DeliveryChargeService = {
  getOrders(params = {}) {
    return axiosInstance.get('/delivery-charges', { params });
  },
  syncOrder(id) {
    return axiosInstance.post(`/delivery-charges/${id}/sync`);
  },
  syncCourier(payload = {}, config = {}) {
    return axiosInstance.post('/delivery-charges/sync', payload, config);
  },
};

export default DeliveryChargeService;
