import axiosInstance from './AuthService';

const VendorPaymentService = {
  list(params = {}) {
    return axiosInstance.get('/vendor-payments', { params });
  },
  create(payload) {
    return axiosInstance.post('/vendor-payments', payload);
  },
  delete(id) {
    return axiosInstance.delete(`/vendor-payments/${id}`);
  },
};

export default VendorPaymentService;
