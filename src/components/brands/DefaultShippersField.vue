<template>
  <div class="form-group">
    <label class="form-label">Default Shippers</label>
    <p class="form-sublabel">Select default pickup addresses for this brand. Argo has no shipper selection.</p>

    <div v-if="integrationStore.loading" class="shipper-list muted-panel">
      Loading couriers...
    </div>
    <div v-else-if="shippableIntegrations.length === 0" class="shipper-list muted-panel">
      Add PostEx, Leopard, Dastaq, or Trax integrations first.
    </div>
    <div v-else class="shipper-list">
      <div v-for="integration in shippableIntegrations" :key="integration.id" class="shipper-row">
        <div class="shipper-meta">
          <strong>{{ integration.name || integration.courier_name }}</strong>
          <span>{{ integration.courier_name }}</span>
        </div>

        <select
          class="form-input"
          :value="selectedValue(integration)"
          :disabled="isLoading(integration.id)"
          @focus="loadOptions(integration)"
          @change="setDefaultShipper(integration, $event.target.value)"
        >
          <option value="">{{ optionPlaceholder(integration) }}</option>
          <option v-for="option in optionsFor(integration.id)" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <span v-if="isLoading(integration.id)" class="helper-text">Loading pickup addresses...</span>
        <span v-if="errorFor(integration.id)" class="field-error">{{ errorFor(integration.id) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue';
import { useIntegrationStore } from '../../stores/integrationStore';
import IntegrationService from '../../services/IntegrationService';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:modelValue']);
const integrationStore = useIntegrationStore();
const state = reactive({});

const shippableIntegrations = computed(() => integrationStore.integrations
  .filter(integration => ['postex', 'leopard', 'dastaq', 'trax'].includes(integration.courier_slug)));

onMounted(async () => {
  await integrationStore.fetchIntegrations();
  await Promise.all(
    shippableIntegrations.value
      .map(integration => loadOptions(integration))
  );
});

const ensureState = (integrationId) => {
  if (!state[integrationId]) {
    state[integrationId] = {
      loading: false,
      loaded: false,
      error: '',
      options: [],
    };
  }

  return state[integrationId];
};

const selectedValue = (integration) => {
  const current = props.modelValue?.[integration.id] || {};

  return integration.courier_slug === 'leopard'
    ? current.leopard_pickup_address_id || ''
    : current.pickup_address_code || '';
};

const optionsFor = integrationId => ensureState(integrationId).options;
const isLoading = integrationId => ensureState(integrationId).loading;
const errorFor = integrationId => ensureState(integrationId).error;

const optionPlaceholder = (integration) => {
  const currentState = ensureState(integration.id);
  if (currentState.loading) return 'Loading pickup addresses...';
  if (currentState.error) return 'Unable to load pickup addresses';
  return 'No default shipper';
};

const setDefaultShipper = (integration, value) => {
  const next = { ...(props.modelValue || {}) };

  if (!value) {
    delete next[integration.id];
    emit('update:modelValue', next);
    return;
  }

  next[integration.id] = integration.courier_slug === 'leopard'
    ? {
        courier_slug: 'leopard',
        leopard_pickup_address_id: value,
      }
    : {
        courier_slug: integration.courier_slug,
        pickup_address_code: value,
      };

  emit('update:modelValue', next);
};

const loadOptions = async (integration) => {
  const currentState = ensureState(integration.id);
  if (currentState.loading || currentState.loaded) return;

  currentState.loading = true;
  currentState.error = '';

  try {
    if (integration.courier_slug === 'postex') {
      const token = integration.courier_options?.api_token;
      if (!token) throw new Error('PostEx API token is missing.');
      const res = await IntegrationService.fetchPostexPickupAddresses({ token });
      currentState.options = (res.data.data.addresses || []).map(address => ({
        value: address.addressCode,
        label: pickupAddressName(address),
      })).filter(option => option.value);
    } else if (integration.courier_slug === 'leopard') {
      const res = await IntegrationService.fetchLeopardPickupAddresses();
      currentState.options = (res.data.data.addresses || []).map(address => ({
        value: address.id,
        label: leopardPickupAddressName(address),
      })).filter(option => option.value);
    } else if (integration.courier_slug === 'dastaq') {
      const api_key = integration.courier_options?.api_key;
      const api_secret = integration.courier_options?.api_secret;
      if (!api_key || !api_secret) throw new Error('Dastaq credentials are missing.');
      const res = await IntegrationService.fetchDastaqPickupAddresses({ api_key, api_secret });
      currentState.options = (res.data.data.addresses || []).map(address => ({
        value: address.id,
        label: dastaqPickupAddressName(address),
      })).filter(option => option.value);
    } else if (integration.courier_slug === 'trax') {
      const api_key = integration.courier_options?.api_key;
      const base_url = integration.courier_options?.base_url;
      if (!api_key) throw new Error('Trax API key is missing.');
      const res = await IntegrationService.fetchTraxPickupAddresses({ api_key, base_url });
      currentState.options = (res.data.data.addresses || []).map(address => ({
        value: address.id,
        label: traxPickupAddressName(address),
      })).filter(option => option.value);
    }

    currentState.loaded = true;
  } catch (error) {
    currentState.error = error.response?.data?.message || error.message || 'Unable to load pickup addresses.';
  } finally {
    currentState.loading = false;
  }
};

const pickupAddressName = address => [
  address.contactPersonName || address.address || 'Pickup Address',
  address.cityName,
  address.phone1,
  address.addressCode,
].filter(Boolean).join(' - ');

const leopardPickupAddressName = address => [
  address.shipment_name_eng || 'Pickup Address',
  address.origin_city_name,
  address.shipment_phone,
].filter(Boolean).join(' - ');

const dastaqPickupAddressName = address => [
  address.name || address.address || 'Pickup Address',
  address.city,
  address.phone,
  address.id,
].filter(Boolean).join(' - ');

const traxPickupBrandName = (address = {}) => (
  address.brand_name
  || address.brandName
  || address.raw?.brand_name
  || address.raw?.brandName
  || address.raw?.['Brand Name']
  || address.raw?.Brand
  || address.raw?.brand
  || ''
);

const traxPickupContactName = (address = {}) => (
  address.contact_name
  || address.contactName
  || address.raw?.person_of_contact
  || address.raw?.personOfContact
  || address.raw?.['Person of Contact']
  || ''
);

const traxPickupShipperName = (address = {}) => {
  const name = traxPickupBrandName(address) || address.name || address.address || 'Pickup Address';
  return String(name).split(',')[0].trim() || 'Pickup Address';
};

const traxPickupAddressName = address => (
  traxPickupShipperName(address)
);
</script>

<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.form-sublabel,
.helper-text {
  font-size: 12.5px;
  color: #9ca3af;
  margin: 0;
}

.shipper-list {
  display: grid;
  gap: 10px;
}

.muted-panel {
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  color: #6b7280;
  padding: 12px;
}

.shipper-row {
  display: grid;
  grid-template-columns: minmax(180px, 260px) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.shipper-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  color: #111827;
  font-size: 13px;
  padding-top: 9px;
}

.shipper-meta span {
  color: #6b7280;
  font-size: 12px;
}

.form-input {
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 14px;
  color: #111827;
  outline: none;
  background: #fff;
  font-family: inherit;
}

.form-input:focus {
  border-color: #111827;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.07);
}

.field-error {
  grid-column: 2;
  font-size: 12px;
  color: #ef4444;
}

.helper-text {
  grid-column: 2;
}

@media (max-width: 760px) {
  .shipper-row {
    grid-template-columns: 1fr;
  }

  .field-error,
  .helper-text {
    grid-column: 1;
  }
}
</style>
