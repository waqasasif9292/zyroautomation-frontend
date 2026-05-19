import axiosInstance from './AuthService';

const StatusUpdateService = {
  getDue(params = {}) {
    return axiosInstance.get('/status-updates', { params });
  },
  refreshDue(payload = {}) {
    return axiosInstance.post('/status-updates/refresh', payload);
  },
  refreshDueByGet(params = {}) {
    return axiosInstance.get('/status-updates/refresh', { params });
  },
};

export default StatusUpdateService;
