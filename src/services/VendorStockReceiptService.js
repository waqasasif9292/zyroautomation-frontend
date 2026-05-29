import axiosInstance from './AuthService';

const VendorStockReceiptService = {
  list(params = {}) {
    return axiosInstance.get('/vendor-stock-receipts', { params });
  },
  create(payload) {
    return axiosInstance.post('/vendor-stock-receipts', payload);
  },
  get(id) {
    return axiosInstance.get(`/vendor-stock-receipts/${id}`);
  },
  update(id, payload) {
    return axiosInstance.put(`/vendor-stock-receipts/${id}`, payload);
  },
  delete(id) {
    return axiosInstance.delete(`/vendor-stock-receipts/${id}`);
  },
};

export default VendorStockReceiptService;
