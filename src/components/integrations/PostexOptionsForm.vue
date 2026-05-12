<template>
  <div class="postex-options">
    <div class="form-group">
      <label class="form-label">API Token</label>
      <p class="form-sublabel">Enter your PostEx API token to fetch pickup addresses.</p>
      <div class="token-row">
        <input
          :value="modelValue.api_token"
          type="text"
          class="form-input"
          :class="{ 'input-error': errorMessage }"
          placeholder="Enter PostEx API token"
          @input="updateToken($event.target.value)"
        />
        <button class="btn-fetch" type="button" :disabled="loading || !modelValue.api_token" @click="fetchAddresses">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Fetch Addresses</span>
        </button>
      </div>
      <p v-if="loading" class="helper-text">Fetching pickup addresses from PostEx...</p>
      <p v-if="errorMessage || localError" class="field-error">{{ errorMessage || localError }}</p>
    </div>

    <div v-if="addresses.length > 0" class="addresses-section">
      <p class="form-label">Pickup Address</p>
      <p class="form-sublabel">Select the pickup address that should be used for this courier.</p>

      <div class="address-list">
        <button
          v-for="address in addresses"
          :key="address.addressCode"
          type="button"
          :class="['address-card', { selected: modelValue.pickup_address_code === address.addressCode }]"
          @click="selectAddress(address)"
        >
          <span class="checkmark">✓</span>
          <span class="address-title">{{ address.contactPersonName || 'Pickup Address' }}</span>
          <span class="address-line">{{ address.address }}</span>
          <span class="address-meta">{{ address.cityName }} · {{ address.phone1 }} · {{ address.addressCode }}</span>
        </button>
      </div>
    </div>

    <div v-else class="empty-box">
      <p>{{ loading ? 'Loading pickup addresses...' : 'Pickup addresses will appear here after you fetch them from PostEx.' }}</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useIntegrationStore } from '../../stores/integrationStore';

const props = defineProps({
  modelValue: { type: Object, required: true },
  errorMessage: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);
const integrationStore = useIntegrationStore();

const loading = ref(false);
const addresses = ref([]);
const localError = ref('');
watch(
  () => props.modelValue.pickup_address,
  (address) => {
    if (address?.addressCode && addresses.value.length === 0) {
      addresses.value = [address];
    }
  },
  { immediate: true }
);

const emitOptions = (patch) => {
  emit('update:modelValue', {
    ...props.modelValue,
    ...patch,
  });
};

const updateToken = (apiToken) => {
  emitOptions({
    api_token: apiToken,
    pickup_address_code: '',
    pickup_address: null,
  });
  addresses.value = [];
  localError.value = '';
};

const fetchAddresses = async (clearSelected = true) => {
  loading.value = true;
  localError.value = '';
  try {
    addresses.value = await integrationStore.fetchPostexPickupAddresses(props.modelValue.api_token);
    if (clearSelected) {
      emitOptions({
        pickup_address_code: '',
        pickup_address: null,
      });
    }
    if (addresses.value.length === 0) {
      localError.value = 'No pickup addresses found for this token.';
    }
  } catch (error) {
    localError.value = error.response?.data?.message || 'Unable to fetch PostEx pickup addresses.';
  } finally {
    loading.value = false;
  }
};

const selectAddress = (address) => {
  emitOptions({
    pickup_address_code: address.addressCode,
    pickup_address: address,
  });
};

onMounted(() => {
  if (props.modelValue.api_token) {
    fetchAddresses(false);
  }
});
</script>

<style scoped>
.postex-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.form-sublabel {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
}

.token-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.form-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fff;
  font-size: 15px;
  color: #111827;
}

.form-input:focus {
  outline: none;
  border-color: #1e293b;
}

.input-error {
  border-color: #ef4444 !important;
}

.field-error {
  font-size: 13px;
  color: #ef4444;
  margin: 0;
}

.helper-text {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.btn-fetch {
  border: none;
  border-radius: 10px;
  background: #1e293b;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding: 0 16px;
  cursor: pointer;
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-fetch:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.addresses-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.address-list {
  display: grid;
  gap: 10px;
}

.address-card {
  position: relative;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #fff;
  padding: 14px 40px 14px 14px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.address-card:hover {
  border-color: #9ca3af;
  background: #f9fafb;
}

.address-card.selected {
  border: 2px solid #1e293b;
  background: #f8fafc;
}

.checkmark {
  display: none;
  position: absolute;
  right: 14px;
  top: 14px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #1e293b;
  color: #fff;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.address-card.selected .checkmark {
  display: flex;
}

.address-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.address-line {
  font-size: 13px;
  color: #374151;
}

.address-meta {
  font-size: 12px;
  color: #64748b;
}

.empty-box {
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  background: #f9fafb;
  padding: 22px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
