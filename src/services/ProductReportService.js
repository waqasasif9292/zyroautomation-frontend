import axiosInstance from './AuthService';

const ProductReportService = {
  getReport(params = {}) {
    return axiosInstance.get('/reports/products', { params });
  },
};

export default ProductReportService;
