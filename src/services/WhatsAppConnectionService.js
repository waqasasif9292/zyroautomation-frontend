import axiosInstance from './AuthService';

const WhatsAppConnectionService = {
  get() {
    return axiosInstance.get('/whatsapp/connection');
  },
  create() {
    return axiosInstance.post('/whatsapp/connection');
  },
  status() {
    return axiosInstance.get('/whatsapp/connection/status');
  },
  qr() {
    return axiosInstance.get('/whatsapp/connection/qr');
  },
  reconnect() {
    return axiosInstance.post('/whatsapp/connection/reconnect');
  },
  disconnect() {
    return axiosInstance.post('/whatsapp/connection/disconnect');
  },
  logout() {
    return axiosInstance.delete('/whatsapp/connection/session');
  },
  remove() {
    return axiosInstance.delete('/whatsapp/connection');
  },
};

export default WhatsAppConnectionService;
