import axiosInstance from './AuthService';

const VendorInvoiceService = {
  list(params = {}) {
    return axiosInstance.get('/vendor-invoices', { params });
  },
  create(payload) {
    return axiosInstance.post('/vendor-invoices', payload);
  },
  get(id) {
    return axiosInstance.get(`/vendor-invoices/${id}`);
  },
  update(id, payload) {
    return axiosInstance.put(`/vendor-invoices/${id}`, payload);
  },
  delete(id) {
    return axiosInstance.delete(`/vendor-invoices/${id}`);
  },
};

export default VendorInvoiceService;
