import axiosInstance from './AuthService';

const OrderService = {
  getOrders(params = {}) {
    return axiosInstance.get('/orders', { params });
  },
  getOrder(id) {
    return axiosInstance.get(`/orders/${id}`);
  },
  getStats() {
    return axiosInstance.get('/orders/stats/summary');
  },
  createHold(payload) {
    return axiosInstance.post('/orders/hold', payload);
  },
  updateHold(id, payload) {
    return axiosInstance.put(`/orders/${id}/hold`, payload);
  },
  createPostexShipment(id) {
    return axiosInstance.post(`/orders/${id}/postex/create-shipment`);
  },
  getPostexTrackingHistory(id) {
    return axiosInstance.get(`/orders/${id}/postex/track-history`);
  },
  deleteOrder(id) {
    return axiosInstance.delete(`/orders/${id}`);
  },
};

export default OrderService;
