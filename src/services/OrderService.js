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
  bulkUploadShopifyOrders(formData) {
    return axiosInstance.post('/orders/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
  correctAddress(rawAddress) {
    return axiosInstance.post('/orders/address-correction', { raw_address: rawAddress });
  },
  correctOrderAddress(id) {
    return axiosInstance.post(`/orders/${id}/address-correction`);
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
  markSelfPickupDelivered(id) {
    return axiosInstance.put(`/orders/${id}/self-pickup/delivered`);
  },
  markSelfPickupReturned(id) {
    return axiosInstance.put(`/orders/${id}/self-pickup/returned`);
  },
  sendAddressConfirmation(id) {
    return axiosInstance.post(`/orders/${id}/whatsapp/address-confirmation`);
  },
  sendOutForDelivery(id) {
    return axiosInstance.post(`/orders/${id}/whatsapp/out-for-delivery`);
  },
  saveHoldCallLog(id, payload) {
    return axiosInstance.post(`/orders/${id}/hold-call-logs`, payload);
  },
  bulkDeleteOrders(ids) {
    return axiosInstance.post('/orders/bulk-delete', { ids });
  },
  deleteOrder(id) {
    return axiosInstance.delete(`/orders/${id}`);
  },
};

export default OrderService;
