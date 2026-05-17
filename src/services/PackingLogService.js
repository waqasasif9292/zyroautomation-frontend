import axiosInstance from './AuthService';

const PackingLogService = {
  getStats() {
    return axiosInstance.get('/packing-logs/stats');
  },
  getPending(params = {}) {
    return axiosInstance.get('/packing-logs', { params });
  },
  getPacked(params = {}) {
    return axiosInstance.get('/packing-logs/packed', { params });
  },
  markShipped(id) {
    return axiosInstance.put(`/packing-logs/${id}/mark-shipped`);
  },
  markUnshipped(id) {
    return axiosInstance.put(`/packing-logs/${id}/mark-unshipped`);
  },
};

export default PackingLogService;
