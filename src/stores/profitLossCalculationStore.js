import { defineStore } from 'pinia';
import { ref } from 'vue';
import ProfitLossCalculationService from '../services/ProfitLossCalculationService';

export const useProfitLossCalculationStore = defineStore('profitLossCalculation', () => {
  const calculations = ref([]);
  const options = ref({ brands: [], couriers: [], sources: [], products: [] });
  const loading = ref(false);
  const formLoading = ref(false);

  const fetchOptions = async () => {
    const res = await ProfitLossCalculationService.getOptions();
    options.value = res.data.data.options;
    return options.value;
  };

  const fetchCalculations = async () => {
    loading.value = true;
    try {
      const res = await ProfitLossCalculationService.getCalculations();
      calculations.value = res.data.data.calculations;
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
  };

  return {
    calculations,
    options,
    loading,
    formLoading,
    fetchOptions,
    fetchCalculations,
    fetchCalculation,
    createCalculation,
    updateCalculation,
    deleteCalculation,
  };
});
