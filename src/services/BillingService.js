import axiosInstance from './AuthService';

const BillingService = {
  getSummary() {
    return axiosInstance.get('/billing/summary');
  },
  getTransactions(params = {}) {
    return axiosInstance.get('/billing/transactions', { params });
  },
};

export default BillingService;
