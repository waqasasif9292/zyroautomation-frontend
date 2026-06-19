import axiosInstance from './AuthService';

const BillingService = {
  getSummary() {
    return axiosInstance.get('/billing/summary');
  },
  getTransactions(params = {}) {
    return axiosInstance.get('/billing/transactions', { params });
  },
  recoverBlockedOrders() {
    return axiosInstance.post('/billing/recover-blocked-orders');
  },
  discardBlockedOrders() {
    return axiosInstance.post('/billing/discard-blocked-orders');
  },
};

export default BillingService;
