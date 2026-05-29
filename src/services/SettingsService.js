import axiosInstance from './AuthService';

export default {
  fetchParcelStatuses() {
    return axiosInstance.get('/settings/parcel-statuses');
  },
  updateParcelStatuses(mappings) {
    return axiosInstance.put('/settings/parcel-statuses', { mappings });
  },
  fetchWhatsAppAutomation() {
    return axiosInstance.get('/settings/whatsapp-automation');
  },
  fetchActivityLogs(params = {}) {
    return axiosInstance.get('/settings/activity-logs/label-generation', { params });
  },
  updateWhatsAppAutomation(payload) {
    return axiosInstance.put('/settings/whatsapp-automation', payload);
  },
  fetchWhatsAppStatus() {
    return axiosInstance.get('/whatsapp/status');
  },
  disconnectWhatsApp() {
    return axiosInstance.post('/whatsapp/disconnect');
  },
  sendWhatsAppTest(payload) {
    return axiosInstance.post('/whatsapp/test-message', payload);
  },
};
