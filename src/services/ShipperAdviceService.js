import axiosInstance from './AuthService';

const ShipperAdviceService = {
  getIntegrations() {
    return axiosInstance.get('/shipper-advice/integrations');
  },
  getOrders(params = {}) {
    return axiosInstance.get('/shipper-advice', { params });
  },
  updateAdvice(payload = {}) {
    return axiosInstance.put('/shipper-advice', payload);
  },
};

export default ShipperAdviceService;
