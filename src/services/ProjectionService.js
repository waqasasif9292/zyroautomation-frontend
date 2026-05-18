import axiosInstance from './AuthService';

const ProjectionService = {
  getProjections() {
    return axiosInstance.get('/projections');
  },
  getProjection(id) {
    return axiosInstance.get(`/projections/${id}`);
  },
  createProjection(payload) {
    return axiosInstance.post('/projections', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateProjection(id, payload) {
    return axiosInstance.post(`/projections/${id}`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteProjection(id) {
    return axiosInstance.delete(`/projections/${id}`);
  },
};

export default ProjectionService;
