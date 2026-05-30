import axiosInstance from './AuthService';

const AbandonedOrderService = {
  getOrders(params = {}) {
    return axiosInstance.get('/abandoned-orders', { params });
  },
  getOrder(id) {
    return axiosInstance.get(`/abandoned-orders/${id}`);
  },
  updateStatus(id, status) {
    return axiosInstance.put(`/abandoned-orders/${id}/status`, { status });
  },
  deleteOrder(id) {
    return axiosInstance.delete(`/abandoned-orders/${id}`);
  },
};

export default AbandonedOrderService;
