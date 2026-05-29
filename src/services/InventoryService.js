import axiosInstance from './AuthService';

const InventoryService = {
  getSummary() {
    return axiosInstance.get('/inventory/summary');
  },
  getProducts(params = {}) {
    return axiosInstance.get('/inventory/products', { params });
  },
  getMovements(params = {}) {
    return axiosInstance.get('/inventory/movements', { params });
  },
  adjustProduct(productId, payload) {
    return axiosInstance.post(`/inventory/products/${productId}/adjust`, payload);
  },
  reconcileUnbatched(productId) {
    return axiosInstance.post(`/inventory/products/${productId}/reconcile-unbatched`);
  },
  updateBatch(batchId, payload) {
    return axiosInstance.put(`/inventory/batches/${batchId}`, payload);
  },
};

export default InventoryService;
