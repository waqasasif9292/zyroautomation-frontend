import axiosInstance from './AuthService';

export default {
  fetchParcelStatuses() {
    return axiosInstance.get('/settings/parcel-statuses');
  },
  updateParcelStatuses(mappings) {
    return axiosInstance.put('/settings/parcel-statuses', { mappings });
  },
};
