import axiosInstance from './AuthService';

export default {
  fetchParcelStatuses() {
    return axiosInstance.get('/settings/parcel-statuses');
  },
  updateParcelStatuses(mappings) {
    return axiosInstance.put('/settings/parcel-statuses', { mappings });
  },
  fetchActivityLogs(params = {}) {
    return axiosInstance.get('/settings/activity-logs/label-generation', { params });
  },
};
