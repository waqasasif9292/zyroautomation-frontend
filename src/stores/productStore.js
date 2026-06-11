import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import ProductService from '../services/ProductService';

const defaultFilters = () => ({
  search: '',
  page: 1,
});

export const useProductStore = defineStore('product', () => {
  const products = ref([]);
  const pagination = ref(null);
  const filters = reactive(defaultFilters());
  const loading = ref(false);
  const formLoading = ref(false);

  const paginatedParams = () => Object.fromEntries(
    Object.entries({ ...filters, per_page: 100 }).filter(([, value]) => value !== null && value !== '')
  );

  const fetchProducts = async (params = {}) => {
    loading.value = true;
    try {
      const res = await ProductService.getProducts(params);
      products.value = res.data.data.products;
      pagination.value = res.data.data.pagination || null;
    } finally {
      loading.value = false;
    }
  };

  const fetchProductPage = async () => {
    await fetchProducts(paginatedParams());
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

  const setSearch = async (value) => {
    filters.search = value || '';
    filters.page = 1;
    await fetchProductPage();
  };

  const setPage = async (page) => {
    filters.page = page;
    await fetchProductPage();
  };

  return {
    products,
    pagination,
    filters,
    loading,
    formLoading,
    fetchProducts,
    fetchProductPage,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    setSearch,
    setPage,
  };
});
