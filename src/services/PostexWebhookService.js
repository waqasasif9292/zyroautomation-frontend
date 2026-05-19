import axiosInstance from './AuthService';

const PostexWebhookService = {
  getEvents(params = {}) {
    return axiosInstance.get('/postex/webhook-events', { params });
  },
};

export default PostexWebhookService;
