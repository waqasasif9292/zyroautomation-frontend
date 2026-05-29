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
  summary(id) {
    return axiosInstance.get(`/vendors/${id}/summary`);
  },
};

export default VendorService;
