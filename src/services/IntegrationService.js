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
  fetchLeopardCities() {
    return axiosInstance.get('/integrations/leopard/cities');
  },
  fetchLeopardPickupAddresses() {
    return axiosInstance.get('/settings/leopard-pickup-addresses');
  },
  fetchArgoCities(params) {
    return axiosInstance.get('/integrations/argo/cities', { params });
  },
  fetchDastaqAllowedCities(params) {
    return axiosInstance.get('/integrations/dastaq/allowed-cities', { params });
  },
  fetchDastaqPickupAddresses(params) {
    return axiosInstance.get('/integrations/dastaq/pickup-addresses', { params });
  },
  fetchTraxCities(params) {
    return axiosInstance.get('/integrations/trax/cities', { params });
  },
  fetchTraxPickupAddresses(params) {
    return axiosInstance.get('/integrations/trax/pickup-addresses', { params });
  },
};
