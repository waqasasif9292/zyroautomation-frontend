import axiosInstance from './AuthService';

const OrderService = {
  getOrders(params = {}) {
    return axiosInstance.get('/orders', { params });
  },
  getOrder(id) {
    return axiosInstance.get(`/orders/${id}`);
  },
};

export default OrderService;
