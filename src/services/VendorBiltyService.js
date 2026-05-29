import axiosInstance from './AuthService';

const VendorBiltyService = {
  list(params = {}) {
    return axiosInstance.get('/vendor-bilties', { params });
  },
  create(payload) {
    return axiosInstance.post('/vendor-bilties', payload);
  },
  get(id) {
    return axiosInstance.get(`/vendor-bilties/${id}`);
  },
  update(id, payload) {
    return axiosInstance.put(`/vendor-bilties/${id}`, payload);
  },
  delete(id) {
    return axiosInstance.delete(`/vendor-bilties/${id}`);
  },
};

export default VendorBiltyService;
