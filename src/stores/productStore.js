import { defineStore } from 'pinia';
import { ref } from 'vue';
import ProductService from '../services/ProductService';

export const useProductStore = defineStore('product', () => {
  const products = ref([]);
  const loading = ref(false);
  const formLoading = ref(false);

  const fetchProducts = async () => {
    loading.value = true;
    try {
      const res = await ProductService.getProducts();
      products.value = res.data.data.products;
    } finally {
      loading.value = false;
    }
  };

  const fetchProduct = async (id) => {
    const res = await ProductService.getProduct(id);
    return res.data.data.product;
  };

  const createProduct = async (payload) => {
    formLoading.value = true;
    try {
      const res = await ProductService.createProduct(payload);
      products.value.unshift(res.data.data.product);
      return res.data.data.product;
    } finally {
      formLoading.value = false;
    }
  };

  const updateProduct = async (id, payload) => {
    formLoading.value = true;
    try {
      const res = await ProductService.updateProduct(id, payload);
      const updated = res.data.data.product;
      const idx = products.value.findIndex(product => product.id === id);
      if (idx !== -1) products.value[idx] = updated;
      return updated;
    } finally {
      formLoading.value = false;
    }
  };

  const deleteProduct = async (id) => {
    await ProductService.deleteProduct(id);
    products.value = products.value.filter(product => product.id !== id);
  };

  return {
    products,
    loading,
    formLoading,
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
  };
});
