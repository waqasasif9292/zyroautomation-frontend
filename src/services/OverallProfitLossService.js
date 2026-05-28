import axiosInstance from './AuthService';

const OverallProfitLossService = {
  getReports() {
    return axiosInstance.get('/overall-profit-loss');
  },
  getReport(id) {
    return axiosInstance.get(`/overall-profit-loss/${id}`);
  },
  getProducts(filters) {
    return axiosInstance.get('/overall-profit-loss/products', { params: filters });
  },
  createReport(payload) {
    return axiosInstance.post('/overall-profit-loss', payload);
  },
  updateReport(id, payload) {
    return axiosInstance.put(`/overall-profit-loss/${id}`, payload);
  },
  deleteReport(id) {
    return axiosInstance.delete(`/overall-profit-loss/${id}`);
  },
};

export default OverallProfitLossService;
