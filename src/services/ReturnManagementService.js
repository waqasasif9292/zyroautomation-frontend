import axiosInstance from './AuthService';

const ReturnManagementService = {
  getStats(params = {}) {
    return axiosInstance.get('/returns/stats', { params });
  },
  getPending(params = {}) {
    return axiosInstance.get('/returns/pending', { params });
  },
  getReceived(params = {}) {
    return axiosInstance.get('/returns/received', { params });
  },
  markReceived(id) {
    return axiosInstance.put(`/returns/${id}/mark-received`);
  },
  markUnreceived(id) {
    return axiosInstance.put(`/returns/${id}/mark-unreceived`);
  },
};

export default ReturnManagementService;
