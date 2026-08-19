import axiosInstance from './AuthService';

export default {
  fetchParcelStatuses() {
    return axiosInstance.get('/settings/parcel-statuses');
  },
  updateParcelStatuses(mappings) {
    return axiosInstance.put('/settings/parcel-statuses', { mappings });
  },
  fetchPreferences() {
    return axiosInstance.get('/settings/preferences');
  },
  updatePreferences(preferences) {
    return axiosInstance.put('/settings/preferences', preferences);
  },
  fetchActivityLogs(params = {}) {
    return axiosInstance.get('/settings/activity-logs/label-generation', { params });
  },
};
