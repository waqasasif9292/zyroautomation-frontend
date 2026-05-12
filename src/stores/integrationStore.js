import { defineStore } from 'pinia';
import { ref } from 'vue';
import IntegrationService from '../services/IntegrationService';

export const useIntegrationStore = defineStore('integration', () => {
  const integrations = ref([]);
  const loading = ref(false);
  const formLoading = ref(false);

  const fetchIntegrations = async () => {
    loading.value = true;
    try {
      const res = await IntegrationService.fetchIntegrations();
      integrations.value = res.data.data.integrations;
    } finally {
      loading.value = false;
    }
  };

  const fetchIntegration = async (id) => {
    const res = await IntegrationService.fetchIntegration(id);
    return res.data.data.integration;
  };

  const createIntegration = async (payload) => {
    formLoading.value = true;
    try {
      const res = await IntegrationService.createIntegration(payload);
      integrations.value.unshift(res.data.data.integration);
      return res.data.data.integration;
    } finally {
      formLoading.value = false;
    }
  };

  const updateIntegration = async (id, payload) => {
    formLoading.value = true;
    try {
      const res = await IntegrationService.updateIntegration(id, payload);
      const updated = res.data.data.integration;
      const idx = integrations.value.findIndex(item => item.id === id);
      if (idx !== -1) integrations.value[idx] = updated;
      return updated;
    } finally {
      formLoading.value = false;
    }
  };

  const deleteIntegration = async (id) => {
    formLoading.value = true;
    try {
      await IntegrationService.deleteIntegration(id);
      integrations.value = integrations.value.filter(item => item.id !== id);
    } finally {
      formLoading.value = false;
    }
  };

  const checkDuplicate = async (courierSlug) => {
    const res = await IntegrationService.checkDuplicate({ courier_slug: courierSlug });
    return res.data.data.exists;
  };

  const fetchPostexPickupAddresses = async (token, cityName = '') => {
    const params = { token };
    if (cityName) params.cityName = cityName;
    const res = await IntegrationService.fetchPostexPickupAddresses(params);
    return res.data.data.addresses;
  };

  const fetchPostexOperationalCities = async (token, operationalCityType = 'delivery') => {
    const res = await IntegrationService.fetchPostexOperationalCities({ token, operationalCityType });
    return res.data.data.cities;
  };

  return {
    integrations,
    loading,
    formLoading,
    fetchIntegrations,
    fetchIntegration,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    checkDuplicate,
    fetchPostexPickupAddresses,
    fetchPostexOperationalCities,
  };
});
