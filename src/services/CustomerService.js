import axiosInstance from './AuthService';

const CustomerService = {
  getCustomers(params = {}) {
    return axiosInstance.get('/customers', { params });
  },
};

export default CustomerService;
