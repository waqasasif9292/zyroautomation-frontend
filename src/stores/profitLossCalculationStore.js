import { defineStore } from 'pinia';
import { ref } from 'vue';
import ProfitLossCalculationService from '../services/ProfitLossCalculationService';

export const useProfitLossCalculationStore = defineStore('profitLossCalculation', () => {
  const calculations = ref([]);
  const pagination = ref(null);
  const options = ref({ brands: [], couriers: [], sources: [], products: [] });
  const loading = ref(false);
  const formLoading = ref(false);

  const fetchOptions = async () => {
    const res = await ProfitLossCalculationService.getOptions();
    options.value = res.data.data.options;
    return options.value;
  };

  const fetchCalculations = async (params = {}) => {
    loading.value = true;
    try {
      const res = await ProfitLossCalculationService.getCalculations(params);
      calculations.value = res.data.data.calculations;
      pagination.value = res.data.data.pagination || null;
    } finally {
      loading.value = false;
    }
  };

  const fetchCalculation = async (id) => {
    const res = await ProfitLossCalculationService.getCalculation(id);
    return res.data.data.calculation;
  };

  const createCalculation = async (payload) => {
    formLoading.value = true;
    try {
      const res = await ProfitLossCalculationService.createCalculation(payload);
      calculations.value.unshift(res.data.data.calculation);
      return res.data.data.calculation;
    } finally {
      formLoading.value = false;
    }
  };

  const updateCalculation = async (id, payload) => {
    formLoading.value = true;
    try {
      const res = await ProfitLossCalculationService.updateCalculation(id, payload);
      const updated = res.data.data.calculation;
      const idx = calculations.value.findIndex(item => item.id === id);
      if (idx !== -1) calculations.value[idx] = updated;
      return updated;
    } finally {
      formLoading.value = false;
    }
  };

  const deleteCalculation = async (id) => {
    await ProfitLossCalculationService.deleteCalculation(id);
    calculations.value = calculations.value.filter(item => item.id !== id);
    if (pagination.value) {
      const total = Math.max(0, Number(pagination.value.total || 0) - 1);
      const totalPages = Math.max(1, Math.ceil(total / Number(pagination.value.per_page || 1)));
      pagination.value = {
        ...pagination.value,
        total,
        total_pages: totalPages,
        has_next: Number(pagination.value.current_page || 1) < totalPages,
        has_prev: Number(pagination.value.current_page || 1) > 1,
      };
    }
  };

  const refreshProfit = async (id) => {
    const res = await ProfitLossCalculationService.refreshProfit(id);
    const updated = res.data.data.calculation;
    const idx = calculations.value.findIndex(item => item.id === id);
    if (idx !== -1) calculations.value[idx] = updated;
    return updated;
  };

  return {
    calculations,
    pagination,
    options,
    loading,
    formLoading,
    fetchOptions,
    fetchCalculations,
    fetchCalculation,
    createCalculation,
    updateCalculation,
    deleteCalculation,
    refreshProfit,
  };
});
