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
  saveDraft(payload) {
    return axiosInstance.post('/orders/draft', payload);
  },
  updateDraft(id, payload) {
    return axiosInstance.put(`/orders/${id}/draft`, payload);
  },
  createBooking(payload) {
    return axiosInstance.post('/orders/create-booking', payload);
  },
  updateBooking(id, payload) {
    return axiosInstance.put(`/orders/${id}/create-booking`, payload);
  },
  getTrackingHistory(id) {
    return axiosInstance.get(`/orders/${id}/track-history`);
  },
  getPostexTrackingHistory(id) {
    return axiosInstance.get(`/orders/${id}/postex/track-history`);
  },
  getDastaqTrackingHistory(id) {
    return axiosInstance.get(`/orders/${id}/dastaq/track-history`);
  },
  getArgoTrackingHistory(id) {
    return axiosInstance.get(`/orders/${id}/argo/track-history`);
  },
  cancelByShipper(id) {
    return axiosInstance.put(`/orders/${id}/cancel-by-shipper`);
  },
  sendAddressConfirmation(id) {
    return axiosInstance.post(`/orders/${id}/whatsapp/address-confirmation`);
  },
  sendOutForDelivery(id) {
    return axiosInstance.post(`/orders/${id}/whatsapp/out-for-delivery`);
  },
  bulkDeleteOrders(ids) {
    return axiosInstance.post('/orders/bulk-delete', { ids });
  },
  deleteOrder(id) {
    return axiosInstance.delete(`/orders/${id}`);
  },
};

export default OrderService;
