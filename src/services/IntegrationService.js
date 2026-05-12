import axiosInstance from './AuthService';

export default {
  fetchIntegrations() {
    return axiosInstance.get('/integrations');
  },
  fetchIntegration(id) {
    return axiosInstance.get(`/integrations/${id}`);
  },
  createIntegration(payload) {
    return axiosInstance.post('/integrations', payload);
  },
  updateIntegration(id, payload) {
    return axiosInstance.put(`/integrations/${id}`, payload);
  },
  deleteIntegration(id) {
    return axiosInstance.delete(`/integrations/${id}`);
  },
  checkDuplicate(params) {
    return axiosInstance.get('/integrations/check', { params });
  },
  fetchPostexPickupAddresses(params) {
    return axiosInstance.get('/integrations/postex/pickup-addresses', { params });
  },
  fetchPostexOperationalCities(params) {
    return axiosInstance.get('/integrations/postex/operational-cities', { params });
  },
};
