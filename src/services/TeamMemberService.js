import axiosInstance from './AuthService';

const TeamMemberService = {
  list() {
    return axiosInstance.get('/settings/team-members');
  },
  create(payload) {
    return axiosInstance.post('/settings/team-members', payload);
  },
  update(id, payload) {
    return axiosInstance.put(`/settings/team-members/${id}`, payload);
  },
  delete(id) {
    return axiosInstance.delete(`/settings/team-members/${id}`);
  },
};

export default TeamMemberService;
