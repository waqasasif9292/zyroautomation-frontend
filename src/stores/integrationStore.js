import { defineStore } from 'pinia';
import { ref } from 'vue';
import IntegrationService from '../services/IntegrationService';

const RUNTIME_CACHE_TTL_MS = 60 * 60 * 1000;
const runtimeMemoryCache = new Map();
const runtimeRequests = new Map();

const runtimeCacheKey = (name, params = {}) => {
  const normalizedParams = Object.keys(params)
    .sort()
    .reduce((carry, key) => ({ ...carry, [key]: params[key] }), {});

  return `zyro_courier_runtime:${name}:${hashCacheKey(JSON.stringify(normalizedParams))}`;
};

const hashCacheKey = (value) => {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
};

const readRuntimeCache = (key) => {
  const memoryEntry = runtimeMemoryCache.get(key);
  if (memoryEntry && Date.now() - memoryEntry.createdAt <= RUNTIME_CACHE_TTL_MS) {
    return memoryEntry.value;
  }

  if (memoryEntry) {
    runtimeMemoryCache.delete(key);
  }

  try {
    const storedEntry = JSON.parse(localStorage.getItem(key) || 'null');
    if (storedEntry && Date.now() - Number(storedEntry.createdAt || 0) <= RUNTIME_CACHE_TTL_MS) {
      runtimeMemoryCache.set(key, storedEntry);
      return storedEntry.value;
    }
  } catch (error) {
    localStorage.removeItem(key);
  }

  localStorage.removeItem(key);
  return null;
};

const writeRuntimeCache = (key, value) => {
  const entry = {
    value,
    createdAt: Date.now(),
  };

  runtimeMemoryCache.set(key, entry);

  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    localStorage.removeItem(key);
  }
};

const fetchRuntimeData = async (name, params, fetcher) => {
  const key = runtimeCacheKey(name, params);
  const cached = readRuntimeCache(key);
  if (cached !== null) return cached;

  if (runtimeRequests.has(key)) {
    return runtimeRequests.get(key);
  }

  const request = fetcher().then((value) => {
    writeRuntimeCache(key, value);
    return value;
  }).finally(() => {
    runtimeRequests.delete(key);
  });

  runtimeRequests.set(key, request);
  return request;
};

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

  const resetIntegrations = () => {
    integrations.value = [];
  };

  const checkDuplicate = async (courierSlug) => {
    const res = await IntegrationService.checkDuplicate({ courier_slug: courierSlug });
    return res.data.data.exists;
  };

  const fetchPostexPickupAddresses = async (token, cityName = '') => {
    const params = { token };
    if (cityName) params.cityName = cityName;
    return fetchRuntimeData('postex_pickup_addresses', params, async () => {
      const res = await IntegrationService.fetchPostexPickupAddresses(params);
      return res.data.data.addresses;
    });
  };

  const fetchPostexOperationalCities = async (token, operationalCityType = 'delivery') => {
    const params = { token, operationalCityType };
    return fetchRuntimeData('postex_operational_cities', params, async () => {
      const res = await IntegrationService.fetchPostexOperationalCities(params);
      return res.data.data.cities;
    });
  };

  const fetchLeopardCities = async () => {
    return fetchRuntimeData('leopard_cities', {}, async () => {
      const res = await IntegrationService.fetchLeopardCities();
      return res.data.data;
    });
  };

  const fetchLeopardPickupAddresses = async () => {
    const res = await IntegrationService.fetchLeopardPickupAddresses();
    return res.data.data.addresses;
  };

  const fetchDastaqAllowedCities = async (credentials) => {
    return fetchRuntimeData('dastaq_allowed_cities', credentials, async () => {
      const res = await IntegrationService.fetchDastaqAllowedCities(credentials);
      return res.data.data.cities;
    });
  };

  const fetchDastaqPickupAddresses = async (credentials) => {
    return fetchRuntimeData('dastaq_pickup_addresses', credentials, async () => {
      const res = await IntegrationService.fetchDastaqPickupAddresses(credentials);
      return res.data.data.addresses;
    });
  };

  const fetchArgoCities = async (credentials) => {
    return fetchRuntimeData('argo_cities', credentials, async () => {
      const res = await IntegrationService.fetchArgoCities(credentials);
      return res.data.data.cities;
    });
  };

  const fetchTraxCities = async (credentials) => {
    return fetchRuntimeData('trax_cities_v2', credentials, async () => {
      const res = await IntegrationService.fetchTraxCities(credentials);
      return res.data.data.cities;
    });
  };

  const fetchTraxPickupAddresses = async (credentials) => {
    return fetchRuntimeData('trax_pickup_addresses_v2', credentials, async () => {
      const res = await IntegrationService.fetchTraxPickupAddresses(credentials);
      return res.data.data.addresses;
    });
  };

  const fetchTcsCostCenters = async (credentials) => {
    return fetchRuntimeData('tcs_cost_centers', credentials, async () => {
      const res = await IntegrationService.fetchTcsCostCenters(credentials);
      return res.data.data.cost_centers;
    });
  };

  const fetchTcsCities = async (credentials) => {
    return fetchRuntimeData('tcs_cities', credentials, async () => {
      const res = await IntegrationService.fetchTcsCities(credentials);
      return res.data.data.cities;
    });
  };

  const fetchTcsAreas = async (credentials) => {
    return fetchRuntimeData('tcs_areas', credentials, async () => {
      const res = await IntegrationService.fetchTcsAreas(credentials);
      return res.data.data.areas;
    });
  };

  const fetchTcsBlocks = async (credentials) => {
    return fetchRuntimeData('tcs_blocks', credentials, async () => {
      const res = await IntegrationService.fetchTcsBlocks(credentials);
      return res.data.data.blocks;
    });
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
    resetIntegrations,
    checkDuplicate,
    fetchPostexPickupAddresses,
    fetchPostexOperationalCities,
    fetchLeopardCities,
    fetchLeopardPickupAddresses,
    fetchDastaqAllowedCities,
    fetchDastaqPickupAddresses,
    fetchArgoCities,
    fetchTraxCities,
    fetchTraxPickupAddresses,
    fetchTcsCostCenters,
    fetchTcsCities,
    fetchTcsAreas,
    fetchTcsBlocks,
  };
});
