import axiosInstance from './AuthService';

const VendorOrderService = {
  list(params = {}) {
    return axiosInstance.get('/vendor-orders', { params });
  },
  create(payload) {
    return axiosInstance.post('/vendor-orders', payload);
  },
  get(id) {
    return axiosInstance.get(`/vendor-orders/${id}`);
  },
  update(id, payload) {
    return axiosInstance.put(`/vendor-orders/${id}`, payload);
  },
  markReceived(id) {
    return axiosInstance.put(`/vendor-orders/${id}/mark-received`);
  },
  delete(id) {
    return axiosInstance.delete(`/vendor-orders/${id}`);
  },
};

export default VendorOrderService;
