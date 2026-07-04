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
  downloadLoadSheet(params = {}) {
    return axiosInstance.get('/packing-logs/load-sheet', {
      params,
      responseType: 'blob',
    });
  },
  markShipped(id) {
    return axiosInstance.put(`/packing-logs/${id}/mark-shipped`);
  },
  markShippedByTracking(trackingNumber) {
    return axiosInstance.post('/packing-logs/scan/mark-shipped', {
      tracking_number: trackingNumber,
    });
  },
  markUnshipped(id) {
    return axiosInstance.put(`/packing-logs/${id}/mark-unshipped`);
  },
};

export default PackingLogService;
