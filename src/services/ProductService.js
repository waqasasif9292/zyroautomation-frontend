import axiosInstance from './AuthService';

const ProductService = {
  getProducts(params = {}) {
    return axiosInstance.get('/products', { params });
  },
  getProduct(id) {
    return axiosInstance.get(`/products/${id}`);
  },
  createProduct(payload) {
    return axiosInstance.post('/products', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateProduct(id, payload) {
    return axiosInstance.post(`/products/${id}`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteProduct(id) {
    return axiosInstance.delete(`/products/${id}`);
  },
};

export default ProductService;
