import axiosInstance from './AuthService';

const VendorPaymentService = {
  list(params = {}) {
    return axiosInstance.get('/vendor-payments', { params });
  },
  create(payload) {
    return axiosInstance.post('/vendor-payments', payload);
  },
  get(id) {
    return axiosInstance.get(`/vendor-payments/${id}`);
  },
  update(id, payload) {
    return axiosInstance.put(`/vendor-payments/${id}`, payload);
  },
  delete(id) {
    return axiosInstance.delete(`/vendor-payments/${id}`);
  },
};

export default VendorPaymentService;
