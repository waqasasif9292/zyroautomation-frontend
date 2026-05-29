import { defineStore } from 'pinia';
import { ref } from 'vue';
import BrandService from '../services/BrandService';

export const useBrandStore = defineStore('brand', () => {
  const brands = ref([]);
  const loading = ref(false);
  const formLoading = ref(false);

  const fetchBrands = async () => {
    loading.value = true;
    try {
      const res = await BrandService.getBrands();
      brands.value = res.data.data.brands;
    } finally {
      loading.value = false;
    }
  };

  const fetchBrand = async (id) => {
    const res = await BrandService.getBrand(id);
    return res.data.data.brand;
  };

  const createBrand = async (payload) => {
    formLoading.value = true;
    try {
      const res = await BrandService.createBrand(payload);
      const brand = res.data.data.brand;
      brands.value.push(brand);
      return brand;
    } finally {
      formLoading.value = false;
    }
  };

  const updateBrand = async (id, payload) => {
    formLoading.value = true;
    try {
      const res = await BrandService.updateBrand(id, payload);
      const updated = res.data.data.brand;
      const idx = brands.value.findIndex(b => b.id === id);
      if (idx !== -1) brands.value[idx] = updated;
      return updated;
    } finally {
      formLoading.value = false;
    }
  };

  const regenerateWebhook = async (id) => {
    formLoading.value = true;
    try {
      const res = await BrandService.regenerateWebhook(id);
      const updated = res.data.data.brand;
      const idx = brands.value.findIndex(b => b.id === id);
      if (idx !== -1) brands.value[idx] = updated;
      return updated;
    } finally {
      formLoading.value = false;
    }
  };

  const regenerateAbandonedWebhook = async (id) => {
    formLoading.value = true;
    try {
      const res = await BrandService.regenerateAbandonedWebhook(id);
      const updated = res.data.data.brand;
      const idx = brands.value.findIndex(b => b.id === id);
      if (idx !== -1) brands.value[idx] = updated;
      return updated;
    } finally {
      formLoading.value = false;
    }
  };

  const fetchCustomSources = async () => {
    const res = await BrandService.getCustomSources();
    return res.data.data.custom_sources;
  };

  return {
    brands,
    loading,
    formLoading,
    fetchBrands,
    fetchBrand,
    createBrand,
    updateBrand,
    regenerateWebhook,
    regenerateAbandonedWebhook,
    fetchCustomSources,
  };
});
