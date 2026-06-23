import axiosInstance from './AuthService';

const OrderPerformanceService = {
  getOverview(params = {}) {
    return axiosInstance.get('/orders/performance/overview', { params });
  },
  getCancelled(params = {}) {
    return axiosInstance.get('/orders/performance/cancelled', { params });
  },
  getReturns(params = {}) {
    return axiosInstance.get('/orders/performance/returns', { params });
  },
};

export default OrderPerformanceService;
