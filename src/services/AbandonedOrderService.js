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
  updateNote(id, note) {
    return axiosInstance.put(`/abandoned-orders/${id}/note`, { note });
  },
  bulkDeleteOrders(ids) {
    return axiosInstance.post('/abandoned-orders/bulk-delete', { ids });
  },
  deleteOrder(id) {
    return axiosInstance.delete(`/abandoned-orders/${id}`);
  },
};

export default AbandonedOrderService;
