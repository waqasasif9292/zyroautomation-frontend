import axiosInstance from './AuthService';

const InProgressOrderReportService = {
  getReport(params = {}) {
    return axiosInstance.get('/reports/in-progress', { params });
  },
};

export default InProgressOrderReportService;
