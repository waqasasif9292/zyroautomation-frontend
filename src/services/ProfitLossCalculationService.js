import axiosInstance from './AuthService';

const ProfitLossCalculationService = {
  getOptions() {
    return axiosInstance.get('/profit-loss-calculations/options');
  },
  getCalculations() {
    return axiosInstance.get('/profit-loss-calculations');
  },
  getCalculation(id) {
    return axiosInstance.get(`/profit-loss-calculations/${id}`);
  },
  createCalculation(payload) {
    return axiosInstance.post('/profit-loss-calculations', payload);
  },
  updateCalculation(id, payload) {
    return axiosInstance.put(`/profit-loss-calculations/${id}`, payload);
  },
  deleteCalculation(id) {
    return axiosInstance.delete(`/profit-loss-calculations/${id}`);
  },
};

export default ProfitLossCalculationService;
