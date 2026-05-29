import axiosInstance from './AuthService';

const BrandService = {
  getBrands() {
    return axiosInstance.get('/brands');
  },
  getBrand(id) {
    return axiosInstance.get(`/brands/${id}`);
  },
  createBrand(payload) {
    return axiosInstance.post('/brands', payload);
  },
  updateBrand(id, payload) {
    return axiosInstance.put(`/brands/${id}`, payload);
  },
  regenerateWebhook(id) {
    return axiosInstance.post(`/brands/${id}/webhook/regenerate`);
  },
  regenerateAbandonedWebhook(id) {
    return axiosInstance.post(`/brands/${id}/webhook/abandoned/regenerate`);
  },
  getCustomSources() {
    return axiosInstance.get('/user/custom-sources');
  },
};

export default BrandService;
