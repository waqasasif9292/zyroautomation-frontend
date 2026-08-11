import axiosInstance from './AuthService';

const VendorService = {
  list(params = {}) {
    return axiosInstance.get('/vendors', { params });
  },
  create(payload) {
    return axiosInstance.post('/vendors', payload);
  },
  get(id) {
    return axiosInstance.get(`/vendors/${id}`);
  },
  update(id, payload) {
    return axiosInstance.put(`/vendors/${id}`, payload);
  },
  delete(id) {
    return axiosInstance.delete(`/vendors/${id}`);
  },
  dashboard() {
    return axiosInstance.get('/vendor-dashboard');
  },
  ledger(vendorId) {
    return axiosInstance.get(`/vendor-ledger/${vendorId}`);
  },
  averageCost(params) {
    return axiosInstance.get('/vendor-average-cost', { params });
  },
};

export default VendorService;
