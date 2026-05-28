import axiosInstance from './AuthService';

const OrderPerformanceService = {
  getOverview() {
    return axiosInstance.get('/orders/performance/overview');
  },
  getCancelled(params = {}) {
    return axiosInstance.get('/orders/performance/cancelled', { params });
  },
  getReturns(params = {}) {
    return axiosInstance.get('/orders/performance/returns', { params });
  },
};

export default OrderPerformanceService;
